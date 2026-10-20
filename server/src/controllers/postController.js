
const mongoose = require('mongoose');
const Post = require('../models/Post');
const Tag = require('../models/Tag');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const makeSlug = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const getTagIds = async (inputTags = []) => {
  if (!Array.isArray(inputTags)) {
    throw new ApiError(400, 'Tags must be an array');
  }

  const names = [
    ...new Set(
      inputTags
        .filter((tag) => typeof tag === 'string')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];

  if (names.length > 5) {
    throw new ApiError(400, 'A post can have at most 5 tags');
  }

  const ids = [];

  for (const name of names) {
    if (name.length < 2 || name.length > 30) {
      throw new ApiError(400, 'Each tag must be 2–30 characters');
    }

    const slug = makeSlug(name);
    if (!slug) throw new ApiError(400, 'Invalid tag name');

    let tag = await Tag.findOne({ slug });

    if (!tag) {
      try {
        tag = await Tag.create({ name, slug });
      } catch (error) {
        if (error.code !== 11000) throw error;
        tag = await Tag.findOne({ slug });
      }
    }

    if (tag) ids.push(tag._id);
  }

  return ids;
};

const validatePostInput = (body, partial = false) => {
  const errors = {};

  if (!partial || body.title !== undefined) {
    if (
      typeof body.title !== 'string' ||
      body.title.trim().length < 3 ||
      body.title.trim().length > 160
    ) {
      errors.title = 'Title must be 3–160 characters';
    }
  }

  if (!partial || body.content !== undefined) {
    if (
      typeof body.content !== 'string' ||
      body.content.trim().length === 0
    ) {
      errors.content = 'Content is required';
    }
  }

  if (body.status !== undefined &&
      !['draft', 'published'].includes(body.status)) {
    errors.status = 'Status must be draft or published';
  }

  if (body.coverImage !== undefined &&
      typeof body.coverImage !== 'string') {
    errors.coverImage = 'Cover image must be a URL string';
  }

  if (Object.keys(errors).length) {
    throw new ApiError(400, 'Validation failed', errors);
  }
};

const createPost = asyncHandler(async (req, res) => {
  validatePostInput(req.body);

  const tagIds = await getTagIds(req.body.tags || []);
  const status = req.body.status || 'draft';

  const post = await Post.create({
    title: req.body.title.trim(),
    content: req.body.content,
    coverImage: (req.body.coverImage || '').trim(),
    tags: tagIds,
    author: req.user._id,
    status,
    publishedAt: status === 'published' ? new Date() : null,
  });

  const populatedPost = await Post.findById(post._id)
    .populate('author', 'name avatarUrl')
    .populate('tags', 'name slug');

  res.status(201).json({
    success: true,
    message: 'Post created successfully',
    data: { post: populatedPost },
  });
});

const getPosts = asyncHandler(async (req, res) => {
  const filter = { status: 'published' };

  if (req.query.tag) {
    const tag = await Tag.findOne({
      slug: String(req.query.tag).toLowerCase(),
    });

    if (!tag) {
      return res.json({
        success: true,
        data: { posts: [], total: 0, page: 1, pages: 0 },
      });
    }

    filter.tags = tag._id;
  }

  if (req.query.search) {
    const search = String(req.query.search).trim().slice(0, 100);
    if (search) filter.title = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 10));

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .populate('author', 'name avatarUrl')
      .populate('tags', 'name slug')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Post.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      posts,
      total,
      page,
      pages: Math.ceil(total / limit),
    },
  });
});

const getPostById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid post ID');
  }

  const post = await Post.findById(req.params.id)
    .populate('author', 'name avatarUrl')
    .populate('tags', 'name slug');

  if (!post) throw new ApiError(404, 'Post not found');

  const isOwner =
    req.user && post.author._id.toString() === req.user._id.toString();

  if (post.status !== 'published' && !isOwner) {
    throw new ApiError(404, 'Post not found');
  }

  res.json({ success: true, data: { post } });
});

const updatePost = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid post ID');
  }

  validatePostInput(req.body, true);

  const post = await Post.findById(req.params.id);
  if (!post) throw new ApiError(404, 'Post not found');

  if (post.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You cannot edit this post');
  }

  if (req.body.title !== undefined) post.title = req.body.title.trim();
  if (req.body.content !== undefined) post.content = req.body.content;
  if (req.body.coverImage !== undefined) {
    post.coverImage = req.body.coverImage.trim();
  }
  if (req.body.tags !== undefined) {
    post.tags = await getTagIds(req.body.tags);
  }

  if (req.body.status !== undefined) {
    if (req.body.status === 'published' && post.status !== 'published') {
      post.publishedAt = new Date();
    }
    if (req.body.status === 'draft') post.publishedAt = null;
    post.status = req.body.status;
  }

  await post.save();

  const populatedPost = await Post.findById(post._id)
    .populate('author', 'name avatarUrl')
    .populate('tags', 'name slug');

  res.json({
    success: true,
    message: 'Post updated successfully',
    data: { post: populatedPost },
  });
});

const deletePost = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid post ID');
  }

  const post = await Post.findById(req.params.id);
  if (!post) throw new ApiError(404, 'Post not found');

  if (post.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You cannot delete this post');
  }

  await post.deleteOne();

  res.json({
    success: true,
    message: 'Post deleted successfully',
  });
});

const getMyPosts = asyncHandler(async (req, res) => {
  const filter = { author: req.user._id };

  if (req.query.status && ['draft', 'published'].includes(req.query.status)) {
    filter.status = req.query.status;
  }

  const posts = await Post.find(filter)
    .populate('tags', 'name slug')
    .sort({ updatedAt: -1 });

  res.json({ success: true, data: { posts } });
});

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  getMyPosts,
};
