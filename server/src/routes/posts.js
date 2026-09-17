'use strict';

const express = require('express');
const asyncWrapper = require('../middleware/asyncWrapper');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const postController    = require('../controllers/posts');
const commentController = require('../controllers/comments');

const router = express.Router();

// Public routes
router.get('/',                  asyncWrapper(postController.getPosts));
router.get('/:id',               asyncWrapper(postController.getPostById));
router.get('/:postId/comments',  asyncWrapper(commentController.getCommentsByPost));

// Protected routes (requires authentication)
router.post('/',                  requireAuth, asyncWrapper(postController.createPost));
router.post('/:id/vote',          requireAuth, asyncWrapper(postController.toggleVote));
router.post('/:postId/comments',  requireAuth, asyncWrapper(commentController.createComment));

// Admin routes
router.patch('/:id/status',       requireAdmin, asyncWrapper(postController.updateStatus));

module.exports = router;
