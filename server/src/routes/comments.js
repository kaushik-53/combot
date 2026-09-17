'use strict';

const express = require('express');
const asyncWrapper = require('../middleware/asyncWrapper');
const { requireAuth } = require('../middleware/auth');
const commentController = require('../controllers/comments');

const router = express.Router({ mergeParams: true });

// Public route to view comments for a post
router.get('/:postId/comments', asyncWrapper(commentController.getCommentsByPost));

// Protected route to add a comment or reply
router.post('/:postId/comments', requireAuth, asyncWrapper(commentController.createComment));

module.exports = router;
