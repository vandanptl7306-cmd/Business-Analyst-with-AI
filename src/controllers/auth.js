// src/controllers/auth.js

const User = require('../models/User');
const { generateToken } = require('../utils/auth');
const { OAuth2Client } = require('google-auth-library');

// Initialize Google OAuth2 client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Simple validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide name, email, and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists with this email' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: 'Admin', // Default role is Admin as per requirements
    });

    // Generate token
    const token = generateToken(user);

    // Mongoose toJSON transform will strip the password from the user object
    res.status(201).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ success: false, error: 'Server error during registration' });
  }
};

/**
 * @desc    Standard User Login
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Simple validation
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // If user registered with Google and has no password set
    if (!user.password) {
      return res.status(400).json({
        success: false,
        error: 'This account was registered using Google OAuth. Please log in using Google.',
      });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, error: 'Server error during login' });
  }
};

/**
 * @desc    Google OAuth login/register
 * @route   POST /api/auth/google
 * @access  Public
 */
const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, error: 'Please provide Google idToken' });
    }

    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyError) {
      console.error('Google token verification failed:', verifyError.message);
      // For development, if client id isn't set, allow a dummy verification or return error
      if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(400).json({
          success: false,
          error: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID env variable.',
        });
      }
      return res.status(400).json({ success: false, error: 'Invalid Google token' });
    }

    const { sub: googleId, email, name, picture: avatarUrl } = payload;

    // Check if user exists by googleId or email
    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });

    if (user) {
      // Update googleId or avatarUrl if not present
      let updated = false;
      if (!user.googleId) {
        user.googleId = googleId;
        updated = true;
      }
      if (!user.avatarUrl && avatarUrl) {
        user.avatarUrl = avatarUrl;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    } else {
      // Create user if they do not exist
      user = await User.create({
        name,
        email,
        googleId,
        avatarUrl,
        role: 'Admin', // Automatically registered as Admin as per requirements
        isEmailVerified: true, // Google email is verified
      });
    }

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.error('Google login error:', error.message);
    res.status(500).json({ success: false, error: 'Server error during Google OAuth' });
  }
};

module.exports = {
  register,
  login,
  googleLogin,
};
