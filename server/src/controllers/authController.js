
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');
const {
  validateRegister,
  validateLogin,
} = require('../utils/authValidators');

const DUMMY_HASH = bcrypt.hashSync(
  'DummyPassword123',
  10
);

const register = asyncHandler(async (req, res) => {
  const { isValid, errors, data } = validateRegister(req.body);

  if (!isValid) {
    throw new ApiError(400, 'Validation failed', errors);
  }

  const existingUser = await User.findOne({ email: data.email });

  if (existingUser) {
    throw new ApiError(409, 'Email already registered');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await User.create({
    name: data.name,
    email: data.email,
    passwordHash,
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: user.toJSON(),
      token,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { isValid, errors, data } = validateLogin(req.body);

  if (!isValid) {
    throw new ApiError(400, 'Validation failed', errors);
  }

  const user = await User.findOne({ email: data.email })
    .select('+passwordHash');

  if (!user) {
    await bcrypt.compare(data.password, DUMMY_HASH);
    throw new ApiError(401, 'Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(
    data.password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toJSON(),
      token,
    },
  });
});

const me = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user.toJSON(),
    },
  });
});

module.exports = { register, login, me };
