'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const BCRYPT_COST = 12; // Cost 12 per security requirements

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // select: false ensures passwordHash is never returned in queries by default
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: [true, 'Name is required'], trim: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isVerified: { type: Boolean, default: false },

    // Token fields excluded from query results to prevent accidental leakage
    verifyTokenHash:    { type: String, select: false },
    verifyTokenExpires: { type: Date },
    resetTokenHash:     { type: String, select: false },
    resetTokenExpires:  { type: Date },
    // Hashed refresh token — comparing requires hashing the candidate first
    refreshTokenHash:   { type: String, select: false },
    // UUID family; rotated on reuse detection to invalidate all sessions
    refreshTokenFamily: { type: String, select: false },
  },
  {
    timestamps: true,
    // toJSON transform strips __v and any field that must never leave the server.
    // select: false is the first line of defence; toJSON is the second.
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.verifyTokenHash;
        delete ret.resetTokenHash;
        delete ret.refreshTokenHash;
        delete ret.refreshTokenFamily;
        return ret;
      },
    },
  }
);

// Instance helper — centralises password comparison so controllers stay thin
userSchema.methods.comparePassword = async function (candidate) {
  // passwordHash is select:false; callers must explicitly select('+passwordHash')
  return bcrypt.compare(candidate, this.passwordHash);
};

// Static helper — hash a raw password (used on signup and reset)
userSchema.statics.hashPassword = (raw) => bcrypt.hash(raw, BCRYPT_COST);

const User = mongoose.model('User', userSchema);
module.exports = User;
