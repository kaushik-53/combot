'use strict';

const Post = require('../models/Post');
const mongoose = require('mongoose');

/**
 * Create a new feature request post.
 * Per spec, author automatically upvotes their own created post (voters: [authorId], voteCount: 1).
 */
async function createPost({ authorId, title, description, category }) {
  const post = await Post.create({
    title,
    description,
    category: category || 'feature',
    status: 'under_review',
    author: authorId,
    voters: [authorId],
    voteCount: 1,
  });

  return Post.findById(post._id).populate('author', 'name role email');
}

/**
 * Fetch paginated feature request posts with filtering and sorting.
 * Supports sorting by:
 *   - 'trending': score = voteCount / ((hours + 2) ^ 1.5)
 *   - 'top': voteCount DESC, createdAt DESC
 *   - 'newest': createdAt DESC
 */
async function getPosts({ sort = 'trending', status, category, search, limit = 10, cursor }) {
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

  // Build match query
  const query = {};

  if (status && status !== 'all') {
    query.status = status;
  }

  if (category && category !== 'all') {
    query.category = category;
  }

  if (search && search.trim() !== '') {
    query.$text = { $search: search.trim() };
  }

  let sortOption = { createdAt: -1 };
  if (sort === 'top') {
    sortOption = { voteCount: -1, createdAt: -1 };
  }

  let posts = await Post.find(query)
    .sort(sortOption)
    .populate('author', 'name role email');

  if (sort === 'trending') {
    const now = Date.now();
    posts.sort((a, b) => {
      const ageA = (now - new Date(a.createdAt).getTime()) / (1000 * 3600);
      const ageB = (now - new Date(b.createdAt).getTime()) / (1000 * 3600);
      const scoreA = (a.voteCount || 0) / Math.pow(ageA + 2, 1.5);
      const scoreB = (b.voteCount || 0) / Math.pow(ageB + 2, 1.5);
      return scoreB - scoreA;
    });
  }

  const totalCount = posts.length;
  let hasMore = false;
  if (posts.length > parsedLimit) {
    hasMore = true;
    posts = posts.slice(0, parsedLimit);
  }

  return {
    posts,
    hasMore,
    totalCount,
  };
}

/**
 * Retrieve a single post by ID.
 */
async function getPostById(postId) {
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    const err = new Error('Invalid post ID');
    err.status = 400;
    err.code = 'INVALID_ID';
    throw err;
  }

  const post = await Post.findById(postId).populate('author', 'name role email');
  if (!post) {
    const err = new Error('Post not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return post;
}

/**
 * Atomic upvote / unvote toggle.
 * Uses atomic findOneAndUpdate with $addToSet / $pull and $inc to guarantee zero race conditions.
 */
async function toggleVote({ postId, userId }) {
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    const err = new Error('Invalid post ID');
    err.status = 400;
    err.code = 'INVALID_ID';
    throw err;
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Check if post exists and user has already voted
  const existing = await Post.findById(postId);
  if (!existing) {
    const err = new Error('Post not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  const hasVoted = existing.voters.some((v) => v.equals(userObjectId));

  let updatedPost;
  let voted;

  if (hasVoted) {
    // Unvote: Remove user from voters and decrement voteCount
    updatedPost = await Post.findOneAndUpdate(
      { _id: postId, voters: userObjectId },
      {
        $pull: { voters: userObjectId },
        $inc: { voteCount: -1 },
      },
      { new: true }
    ).populate('author', 'name role email');
    voted = false;
  } else {
    // Upvote: Add user to voters and increment voteCount
    updatedPost = await Post.findOneAndUpdate(
      { _id: postId, voters: { $ne: userObjectId } },
      {
        $addToSet: { voters: userObjectId },
        $inc: { voteCount: 1 },
      },
      { new: true }
    ).populate('author', 'name role email');
    voted = true;
  }

  return { post: updatedPost || existing, voted };
}

/**
 * Update a post's pipeline status (Admin only).
 */
async function updatePostStatus({ postId, status }) {
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    const err = new Error('Invalid post ID');
    err.status = 400;
    err.code = 'INVALID_ID';
    throw err;
  }

  const validStatuses = ['under_review', 'planned', 'in_progress', 'shipped'];
  if (!status || !validStatuses.includes(status)) {
    const err = new Error('Invalid status value');
    err.status = 400;
    err.code = 'INVALID_STATUS';
    throw err;
  }

  const post = await Post.findByIdAndUpdate(
    postId,
    { status },
    { new: true }
  ).populate('author', 'name role email');

  if (!post) {
    const err = new Error('Post not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return post;
}

module.exports = {
  createPost,
  getPosts,
  getPostById,
  toggleVote,
  updatePostStatus,
};
