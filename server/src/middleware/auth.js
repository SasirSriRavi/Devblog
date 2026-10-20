
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const getToken = (req) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }

  return header.slice(7).trim();
};

const protect = asyncHandler(async (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    throw new ApiError(401, 'Authentication required');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: ['HS256'],
  });

  if (!decoded.id || !mongoose.isValidObjectId(decoded.id)) {
    throw new ApiError(401, 'Invalid authentication token');
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    throw new ApiError(401, 'User no longer exists');
  }

  req.user = user;
  next();
});

const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });

    if (decoded.id && mongoose.isValidObjectId(decoded.id)) {
      req.user = await User.findById(decoded.id) || null;
    }
  } catch (error) {
    req.user = null;
  }

  next();
});

module.exports = { protect, optionalAuth };
