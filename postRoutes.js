
const express = require('express');

const {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  getMyPosts,
} = require('../controllers/postController');

const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Specific routes first
router.get('/my', protect, getMyPosts);

router
  .route('/')
  .get(getPosts)
  .post(protect, createPost);

router
  .route('/:id')
  .get(optionalAuth, getPostById)
  .patch(protect, updatePost)
  .delete(protect, deletePost);

module.exports = router;
