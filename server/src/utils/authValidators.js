
const cleanString = (value) =>
  typeof value === 'string' ? value.trim() : '';

const normalizeEmail = (value) => cleanString(value).toLowerCase();

const validateRegister = ({ name, email, password } = {}) => {
  const errors = {};

  const cleanName = cleanString(name);
  const cleanEmail = normalizeEmail(email);

  if (cleanName.length < 2 || cleanName.length > 50) {
    errors.name = 'Name must be between 2 and 50 characters';
  }

  if (
    cleanEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
  ) {
    errors.email = 'Enter a valid email address';
  }

  if (typeof password !== 'string') {
    errors.password = 'Password is required';
  } else {
    if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (Buffer.byteLength(password, 'utf8') > 72) {
      errors.password = 'Password must not exceed 72 bytes';
    } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      errors.password = 'Password must contain at least one letter and one number';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: {
      name: cleanName,
      email: cleanEmail,
      password,
    },
  };
};

const validateLogin = ({ email, password } = {}) => {
  const errors = {};
  const cleanEmail = normalizeEmail(email);

  if (
    cleanEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
  ) {
    errors.email = 'Enter a valid email address';
  }

  if (typeof password !== 'string' || password.length === 0) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: {
      email: cleanEmail,
      password,
    },
  };
};

module.exports = {
  cleanString,
  normalizeEmail,
  validateRegister,
  validateLogin,
};
