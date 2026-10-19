
const Tag = require('../models/Tag');
const Post = require('../models/Post');
const asyncHandler = require('../utils/asyncHandler');

const getTags = asyncHandler(async (req, res) => {
  const counts = await Post.aggregate([
    { $match: { status: 'published' } },
    { $unwind: '$tags' },
    {
      $group: {
        _id: '$tags',
        postCount: { $sum: 1 },
      },
    },
  ]);

  const tagIds = counts.map((item) => item._id);

  const tags = await Tag.find({
    _id: { $in: tagIds },
  })
    .sort({ name: 1 })
    .lean();

  const countMap = new Map(
    counts.map((item) => [
      item._id.toString(),
      item.postCount,
    ])
  );

  const result = tags.map((tag) => ({
    ...tag,
    postCount: countMap.get(tag._id.toString()) || 0,
  }));

  res.json({
    success: true,
    data: { tags: result },
  });
});

module.exports = { getTags };
