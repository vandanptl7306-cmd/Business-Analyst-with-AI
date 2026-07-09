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

/**
 * @desc    Update user profile (name, companyName, phoneNumber)
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const { name, companyName, phoneNumber } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    // Validate phone number format if provided
    if (phoneNumber && phoneNumber.trim()) {
      const phoneRegex = /^\+?[1-9]\d{6,14}$/;
      if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
        return res.status(400).json({ success: false, error: 'Please enter a valid phone number (e.g. +919876543210)' });
      }
    }

    const user = await User.findOne({ _id: req.user._id });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.name = name.trim();
    user.companyName = (companyName || '').trim();
    user.phoneNumber = (phoneNumber || '').trim();
    await user.save();

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ success: false, error: 'Server error updating profile' });
  }
};

/**
 * @desc    Change user password
 * @route   PUT /api/auth/password
 * @access  Private
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
    }

    const user = await User.findOne({ _id: req.user._id });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Google-only users have no password
    if (!user.password) {
      return res.status(400).json({ success: false, error: 'This account uses Google sign-in and has no password to change' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error.message);
    res.status(500).json({ success: false, error: 'Server error changing password' });
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  updateProfile,
  changePassword,
};
