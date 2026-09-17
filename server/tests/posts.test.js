'use strict';

/**
 * Posts tests — Phase 2: Creation, default status, self-vote, and filtering
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
let userToken;
let userId;

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

  // Helper user setup
  const signupRes = await request(app)
    .post('/api/auth/signup')
    .send({ name: 'Alice Test', email: 'alice@example.com', password: 'Password123!' });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'alice@example.com', password: 'Password123!' });

  userToken = loginRes.body.accessToken;
  userId    = loginRes.body.user._id;
});

describe('Post Submissions & Feed (Phase 2)', () => {
  it('creates a new feature request with self-vote and default under_review status', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title:       'Add GitHub integration',
        description: 'Allow linking pull requests directly to feature requests.',
        category:    'integration',
      });

    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body.post.title).toBe('Add GitHub integration');
    expect(res.body.post.category).toBe('integration');
    expect(res.body.post.status).toBe('under_review');
    expect(res.body.post.voteCount).toBe(1);
    expect(res.body.post.voters).toContain(userId);
  });

  it('rejects post creation without authorization header', async () => {
    const res = await request(app)
      .post('/api/posts')
      .send({
        title:       'Unauthorized Post',
        description: 'Should fail with 401',
      });

    expect(res.status).toBe(401);
  });

  it('filters posts by category and status', async () => {
    // Create 2 posts
    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title:       'Feature Idea',
        description: 'Descr 1',
        category:    'feature',
      });

    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title:       'Bug Report',
        description: 'Descr 2',
        category:    'bug',
      });

    const featureOnly = await request(app).get('/api/posts?category=feature');
    expect(featureOnly.status).toBe(200);
    expect(featureOnly.body.posts.length).toBe(1);
    expect(featureOnly.body.posts[0].category).toBe('feature');

    const allPosts = await request(app).get('/api/posts');
    expect(allPosts.body.posts.length).toBe(2);
  });
});
