'use strict';

/**
 * Votes tests — Phase 3: Atomic Upvote Engine & Concurrency Control
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request  = require('supertest');

process.env.JWT_SECRET      = 'test-secret-do-not-use-in-prod';
process.env.NODE_ENV        = 'test';
process.env.ACCESS_TOKEN_EXPIRES_IN = '15m';

const app  = require('../src/app');
const User = require('../src/models/User');
const Post = require('../src/models/Post');

let mongod;
let user1Token, user1Id;
let user2Token, user2Id;
let user3Token, user3Id;
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

  // Helper setup — 3 distinct users
  await request(app).post('/api/auth/signup').send({ name: 'User 1', email: 'u1@example.com', password: 'Password123!' });
  await request(app).post('/api/auth/signup').send({ name: 'User 2', email: 'u2@example.com', password: 'Password123!' });
  await request(app).post('/api/auth/signup').send({ name: 'User 3', email: 'u3@example.com', password: 'Password123!' });

  const l1 = await request(app).post('/api/auth/login').send({ email: 'u1@example.com', password: 'Password123!' });
  const l2 = await request(app).post('/api/auth/login').send({ email: 'u2@example.com', password: 'Password123!' });
  const l3 = await request(app).post('/api/auth/login').send({ email: 'u3@example.com', password: 'Password123!' });

  user1Token = l1.body.accessToken; user1Id = l1.body.user._id;
  user2Token = l2.body.accessToken; user2Id = l2.body.user._id;
  user3Token = l3.body.accessToken; user3Id = l3.body.user._id;

  // Create test post by User 1 (author self-vote initializes voteCount = 1)
  const postRes = await request(app)
    .post('/api/posts')
    .set('Authorization', `Bearer ${user1Token}`)
    .send({
      title:       'Concurrency Test Request',
      description: 'Test post description',
      category:    'feature',
    });

  testPostId = postRes.body.post._id;
});

describe('Atomic Upvote Engine (Phase 3)', () => {
  it('upvotes a post when User 2 votes for the first time', async () => {
    const res = await request(app)
      .post(`/api/posts/${testPostId}/vote`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(200);
    expect(res.body.voted).toBe(true);
    expect(res.body.post.voteCount).toBe(2);
    expect(res.body.post.voters).toContain(user2Id);
  });

  it('unvotes a post when User 1 clicks upvote again (toggles off)', async () => {
    // User 1 created post and auto-voted (voteCount = 1)
    const res = await request(app)
      .post(`/api/posts/${testPostId}/vote`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.voted).toBe(false);
    expect(res.body.post.voteCount).toBe(0);
    expect(res.body.post.voters).not.toContain(user1Id);
  });

  it('processes concurrent votes from multiple users with zero race conditions', async () => {
    // User 2 and User 3 vote simultaneously via Promise.all
    const [res2, res3] = await Promise.all([
      request(app).post(`/api/posts/${testPostId}/vote`).set('Authorization', `Bearer ${user2Token}`),
      request(app).post(`/api/posts/${testPostId}/vote`).set('Authorization', `Bearer ${user3Token}`),
    ]);

    expect(res2.status).toBe(200);
    expect(res3.status).toBe(200);

    const finalPost = await Post.findById(testPostId);
    expect(finalPost.voteCount).toBe(3); // User 1 (author) + User 2 + User 3
    expect(finalPost.voters).toHaveLength(3);
  });

  it('rejects unauthenticated vote requests with 401', async () => {
    const res = await request(app).post(`/api/posts/${testPostId}/vote`);
    expect(res.status).toBe(401);
  });
});
