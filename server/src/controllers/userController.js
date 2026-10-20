
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/post');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const getPublicProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid user ID');
  }

  const user = await User.findById(id).select('name bio avatarUrl createdAt');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const posts = await Post.find({
    author: user._id,
    status: 'published',
  })
    .select('title content coverImage tags author status publishedAt createdAt updatedAt')
    .populate('author', 'name bio avatarUrl')
    .populate('tags', 'name slug')
    .sort({ publishedAt: -1 });

  res.json({
    success: true,
    data: {
      user,
      posts,
      totalPosts: posts.length,
    },
  });
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const updates = {};
  const allowedFields = ['name', 'bio', 'avatarUrl'];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      if (typeof req.body[field] !== 'string') {
        throw new ApiError(400, `${field} must be a string`);
      }

      updates[field] = req.body[field].trim();
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, 'Provide at least one profile field to update');
  }

  if (updates.name !== undefined) {
    if (updates.name.length < 2 || updates.name.length > 50) {
      throw new ApiError(400, 'Name must be between 2 and 50 characters');
    }
  }

  if (updates.bio !== undefined && updates.bio.length > 300) {
    throw new ApiError(400, 'Bio cannot exceed 300 characters');
  }

  if (updates.avatarUrl !== undefined && updates.avatarUrl.length > 2048) {
    throw new ApiError(400, 'Avatar URL is too long');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json({
    success: true,
    data: { user },
  });
});

module.exports = {
  getPublicProfile,
  updateMyProfile,
};

