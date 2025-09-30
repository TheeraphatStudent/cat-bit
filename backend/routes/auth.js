const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const trimmedUsername = username?.trim();
    const trimmedEmail = email?.trim();
    const trimmedPassword = password?.trim();

    if (!trimmedUsername || !trimmedEmail || !trimmedPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [trimmedEmail, trimmedUsername]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(trimmedPassword, saltRounds);

    console.log('Registration - Password length:', trimmedPassword.length);
    console.log('Registration - Hash length:', hashedPassword.length);

    const newUser = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [trimmedUsername, trimmedEmail, hashedPassword, 'user']
    );

    res.status(201).json({
      message: 'User created successfully',
      user: newUser.rows[0]
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Trim whitespace from inputs
    const trimmedEmail = email?.trim();
    const trimmedPassword = password?.trim();

    if (!trimmedEmail || !trimmedPassword) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    console.log('Login attempt - Email:', trimmedEmail);
    console.log('Login attempt - Password length:', trimmedPassword.length);

    // Get user
    const userResult = await pool.query(
      'SELECT id, username, email, password, role, profile_image, wallet_balance FROM users WHERE email = $1',
      [trimmedEmail]
    );

    if (userResult.rows.length === 0) {
      console.log('Login failed - User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = userResult.rows[0];
    console.log('Login - Found user:', user.email);
    console.log('Login - Stored hash length:', user.password.length);
    console.log('Login - Actual password:', user.password);
    console.log("Login - Password to compare length:", trimmedPassword.length);
    console.log('Login - Actual input password:', trimmedPassword);
    
    // Check password
    const isPasswordValid = await bcrypt.compare(trimmedPassword, user.password);
    console.log('Login - Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Login failed - Invalid password');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Remove password from response
    delete user.password;

    console.log('Login successful for user:', user.email);

    res.json({
      message: 'Login successful',
      user,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
router.put('/update', authMiddleware, async (req, res) => {
  try {
    const { username, email } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!username || !email) {
      return res.status(400).json({ message: 'Username and email are required' });
    }

    // Check for existing username/email (excluding current user)
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE (email = $1 OR username = $2) AND id != $3',
      [email, username, userId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Update user
    const updatedUser = await pool.query(
      'UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING id, username, email, role, profile_image, wallet_balance',
      [username, email, userId]
    );

    res.json(updatedUser.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete user account
router.delete('/delete', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;