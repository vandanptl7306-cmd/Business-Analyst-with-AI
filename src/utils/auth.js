// src/utils/auth.js

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/**
 * Generate a JWT token for a user
 * @param {Object} user - User document
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || 'fallback_secret_for_development_only',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

/**
 * Verify a JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_development_only');
  } catch (err) {
    return null;
  }
};

/**
 * Hash a password manually (useful for password resets or seed scripts)
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare plain password with hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} Match result
 */
const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
};
