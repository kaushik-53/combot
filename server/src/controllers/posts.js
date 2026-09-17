'use strict';

const postService = require('../services/posts');

async function createPost(req, res) {
  const { title, description, category } = req.body;

  if (!title || !title.trim()) {
    const err = new Error('Title is required');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  if (!description || !description.trim()) {
    const err = new Error('Description is required');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const post = await postService.createPost({
    authorId: req.user.sub || req.user.id || req.user._id,
    title: title.trim(),
    description: description.trim(),
    category,
  });

  res.status(201).json({ post });
}

async function getPosts(req, res) {
  const { sort, status, category, search, limit, cursor } = req.query;

  const result = await postService.getPosts({
    sort,
    status,
    category,
    search,
    limit,
    cursor,
  });

  res.status(200).json(result);
}

async function getPostById(req, res) {
  const post = await postService.getPostById(req.params.id);
  res.status(200).json({ post });
}

async function toggleVote(req, res) {
  const result = await postService.toggleVote({
    postId: req.params.id,
    userId: req.user.sub || req.user.id || req.user._id,
  });

  res.status(200).json(result);
}

async function updateStatus(req, res) {
  const post = await postService.updatePostStatus({
    postId: req.params.id,
    status: req.body.status,
  });

  res.status(200).json({ post });
}

module.exports = {
  createPost,
  getPosts,
  getPostById,
  toggleVote,
  updateStatus,
};
