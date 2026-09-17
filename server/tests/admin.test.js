'use strict';

/**
 * Admin Pipeline tests — Phase 5: Updating Post Status & Admin Access Control
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request  = require('supertest');

process.env.JWT_SECRET              = 'test-secret-do-not-use-in-prod';
process.env.NODE_ENV                = 'test';
process.env.ACCESS_TOKEN_EXPIRES_IN = '15m';

const app  = require('../src/app');
const User = require('../src/models/User');
const Post = require('../src/models/Post');

let mongod;
let adminToken;
let userToken;
let samplePostId;

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

  // 1. Create standard user
  await request(app)
    .post('/api/auth/signup')
    .send({ name: 'Standard User', email: 'user@example.com', password: 'Password123!' });

  const userLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'user@example.com', password: 'Password123!' });

  userToken = userLogin.body.accessToken;

  // 2. Create admin user in DB directly (or via role field)
  const adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@example.com',
    passwordHash: '$2b$10$v...dummyhash', // not used directly, we login via supertest or set role
    role: 'admin'
  });

  // Login admin by creating signup or setting role after signup
  await request(app)
    .post('/api/auth/signup')
    .send({ name: 'Admin Guy', email: 'admin2@example.com', password: 'Password123!' });
  
  await User.updateOne({ email: 'admin2@example.com' }, { role: 'admin' });

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin2@example.com', password: 'Password123!' });

  adminToken = adminLogin.body.accessToken;

  // 3. Create a post
  const postRes = await request(app)
    .post('/api/posts')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      title: 'Dark Mode Support',
      description: 'Please add dark mode option.',
      category: 'feature'
    });

  samplePostId = postRes.body.post._id;
});

describe('Admin Pipeline & Status Updates (Phase 5)', () => {
  it('allows an admin to update a post status to planned, in_progress, shipped', async () => {
    // Change to planned
    const resPlanned = await request(app)
      .patch(`/api/posts/${samplePostId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'planned' });

    expect(resPlanned.status).toBe(200);
    expect(resPlanned.body.post.status).toBe('planned');

    // Change to in_progress
    const resProgress = await request(app)
      .patch(`/api/posts/${samplePostId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'in_progress' });

    expect(resProgress.status).toBe(200);
    expect(resProgress.body.post.status).toBe('in_progress');

    // Change to shipped
    const resShipped = await request(app)
      .patch(`/api/posts/${samplePostId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'shipped' });

    expect(resShipped.status).toBe(200);
    expect(resShipped.body.post.status).toBe('shipped');
  });

  it('rejects status updates from non-admin users with 403 FORBIDDEN', async () => {
    const res = await request(app)
      .patch(`/api/posts/${samplePostId}/status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'planned' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('rejects status updates without auth header with 401 UNAUTHENTICATED', async () => {
    const res = await request(app)
      .patch(`/api/posts/${samplePostId}/status`)
      .send({ status: 'planned' });

    expect(res.status).toBe(401);
  });

  it('rejects invalid status values with 400', async () => {
    const res = await request(app)
      .patch(`/api/posts/${samplePostId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'invalid_status_value' });

    expect(res.status).toBe(400);
  });
});
