'use strict';

const Comment = require('../models/Comment');
const Post = require('../models/Post');
const mongoose = require('mongoose');

/**
 * Create a new comment or nested reply.
 * Automatically flags isOfficialResponse: true if created by an admin.
 */
async function createComment({ postId, authorId, content, parentId, userRole }) {
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    const err = new Error('Invalid post ID');
    err.status = 400;
    err.code = 'INVALID_ID';
    throw err;
  }

  const post = await Post.findById(postId);
  if (!post) {
    const err = new Error('Post not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  let parentComment = null;
  if (parentId) {
    if (!mongoose.Types.ObjectId.isValid(parentId)) {
      const err = new Error('Invalid parent comment ID');
      err.status = 400;
      err.code = 'INVALID_ID';
      throw err;
    }
    parentComment = await Comment.findById(parentId);
    if (!parentComment) {
      const err = new Error('Parent comment not found');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }
  }

  const isOfficialResponse = userRole === 'admin';

  const comment = await Comment.create({
    post: postId,
    author: authorId,
    content: content.trim(),
    parent: parentComment ? parentComment._id : null,
    isOfficialResponse,
  });

  return Comment.findById(comment._id).populate('author', 'name role email');
}

/**
 * Fetch all comments for a post populated with author information.
 */
async function getCommentsByPost(postId) {
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    const err = new Error('Invalid post ID');
    err.status = 400;
    err.code = 'INVALID_ID';
    throw err;
  }

  const comments = await Comment.find({ post: postId })
    .sort({ createdAt: 1 })
    .populate('author', 'name role email');

  return comments;
}

module.exports = {
  createComment,
  getCommentsByPost,
};
