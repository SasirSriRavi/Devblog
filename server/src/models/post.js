
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
      minlength: 3,
      maxlength: 160,
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      minlength: 1,
    },
    coverImage: {
      type: String,
      trim: true,
      default: '',
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag',
      },
    ],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ title: 'text' });

module.exports = mongoose.model('Post', postSchema);
