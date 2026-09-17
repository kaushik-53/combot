'use strict';

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      enum: ['feature', 'bug', 'integration', 'ux', 'other'],
      default: 'feature',
      index: true,
    },
    status: {
      type: String,
      enum: ['under_review', 'planned', 'in_progress', 'shipped'],
      default: 'under_review',
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    voters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    voteCount: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Text index for full-text searching titles and descriptions
postSchema.index({ title: 'text', description: 'text' });

// Compound index for vote-sorted queries
postSchema.index({ voteCount: -1, createdAt: -1 });

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
