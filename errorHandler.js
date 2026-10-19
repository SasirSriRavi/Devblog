
const ApiError = require('../utils/ApiError');

const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server error';
  let errors = err.errors;

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    errors = undefined;
  }

  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = 'Validation failed';
    const fieldErrors = {};
    Object.values(err.errors).forEach((e) => {
      fieldErrors[e.path] = e.message;
    });
    errors = fieldErrors;
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    statusCode = 409;
    message = `${field} already exists`;
    errors = { [field]: message };
  }

  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON in request body';
    errors = undefined;
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token';
    errors = undefined;
  }

  if (statusCode >= 500) {
    console.error(err);
    if (process.env.NODE_ENV === 'production') {
      message = 'Something went wrong on the server';
    }
  }

  const body = { success: false, message };
  if (errors) body.errors = errors;

  res.status(statusCode).json(body);
};

module.exports = { notFound, errorHandler };
