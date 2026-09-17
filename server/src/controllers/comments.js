'use strict';

const commentService = require('../services/comments');

async function createComment(req, res) {
  const { content, parentId } = req.body;
  const { postId } = req.params;

  if (!content || !content.trim()) {
    const err = new Error('Comment content is required');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const comment = await commentService.createComment({
    postId,
    authorId: req.user.sub || req.user.id || req.user._id,
    content: content.trim(),
    parentId,
    userRole: req.user.role,
  });

  res.status(201).json({ comment });
}

async function getCommentsByPost(req, res) {
  const comments = await commentService.getCommentsByPost(req.params.postId);
  res.status(200).json({ comments });
}

module.exports = {
  createComment,
  getCommentsByPost,
};
