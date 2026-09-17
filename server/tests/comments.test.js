'use strict';

/**
 * Comments tests — Phase 4: Threaded Comments & Official Admin Responses
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request  = require('supertest');

process.env.JWT_SECRET      = 'test-secret-do-not-use-in-prod';
process.env.NODE_ENV        = 'test';
process.env.ACCESS_TOKEN_EXPIRES_IN = '15m';

const app     = require('../src/app');
const User    = require('../src/models/User');
const Post    = require('../src/models/Post');
const Comment = require('../src/models/Comment');

let mongod;
let userToken, userId;
let adminToken, adminId;
let testPostId;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Post.deleteMany({});
  await Comment.deleteMany({});

  // Regular user setup
  await request(app).post('/api/auth/signup').send({ name: 'Regular User', email: 'user@example.com', password: 'Password123!' });
  const userLogin = await request(app).post('/api/auth/login').send({ email: 'user@example.com', password: 'Password123!' });
  userToken = userLogin.body.accessToken;
  userId    = userLogin.body.user._id;

  // Admin user setup
  const adminDoc = await User.create({
    name: 'System Admin',
    email: 'admin@example.com',
    passwordHash: await User.hashPassword('Admin123!'),
    role: 'admin',
    isVerified: true,
  });
  const adminLogin = await request(app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'Admin123!' });
  adminToken = adminLogin.body.accessToken;
  adminId    = adminDoc._id;

  // Create post
  const postRes = await request(app)
    .post('/api/posts')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      title:       'Comment Thread Test Post',
      description: 'Discussing feature specs',
      category:    'feature',
    });

  testPostId = postRes.body.post._id;
});

describe('Threaded Comments & Status Timeline (Phase 4)', () => {
  it('allows authenticated user to post a comment', async () => {
    const res = await request(app)
      .post(`/api/posts/${testPostId}/comments`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ content: 'Great idea! I would love to see this built.' });

    expect(res.status).toBe(201);
    expect(res.body.comment.content).toBe('Great idea! I would love to see this built.');
    expect(res.body.comment.isOfficialResponse).toBe(false);
  });

  it('automatically flags admin comments as isOfficialResponse: true', async () => {
    const res = await request(app)
      .post(`/api/posts/${testPostId}/comments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ content: 'Official update: We are planning to ship this in Q3.' });

    expect(res.status).toBe(201);
    expect(res.body.comment.isOfficialResponse).toBe(true);
    expect(res.body.comment.author.role).toBe('admin');
  });

  it('supports nested reply threads linked to a parent comment', async () => {
    // Top-level comment
    const topRes = await request(app)
      .post(`/api/posts/${testPostId}/comments`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ content: 'Top level comment' });

    const parentId = topRes.body.comment._id;

    // Nested reply
    const replyRes = await request(app)
      .post(`/api/posts/${testPostId}/comments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ content: 'Reply to top level comment', parentId });

    expect(replyRes.status).toBe(201);
    expect(replyRes.body.comment.parent).toBe(parentId);

    const getRes = await request(app).get(`/api/posts/${testPostId}/comments`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.comments.length).toBe(2);
  });

  it('rejects unauthenticated comment requests with 401', async () => {
    const res = await request(app)
      .post(`/api/posts/${testPostId}/comments`)
      .send({ content: 'Unauthorized comment' });

    expect(res.status).toBe(401);
  });
});
