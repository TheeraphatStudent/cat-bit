const express = require('express');
const pool = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Validate discount code
router.post('/validate', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({ message: 'Discount code is required' });
    }

    // Check if discount code exists and is valid
    const result = await pool.query(
      'SELECT * FROM discount_codes WHERE code = $1 AND (expire_date IS NULL OR expire_date > NOW()) AND used_count < max_usage',
      [code]
    );

    if (result.rows.length === 0) {
      return res.json({ valid: false, discount: 0 });
    }

    const discount = result.rows[0];

    // Check if user has already used this discount code
    const usageCheck = await pool.query(
      'SELECT COUNT(*) as usage_count FROM wallet_transactions wt JOIN user_sessions us ON wt.user_id = us.user_id WHERE wt.user_id = $1 AND us.discount_code = $2 AND wt.type = $3',
      [userId, code, 'purchase']
    );

    if (parseInt(usageCheck.rows[0].usage_count) > 0) {
      return res.json({ valid: false, discount: 0, message: 'You have already used this discount code' });
    }

    res.json({ valid: true, discount: discount.discount_value });
  } catch (error) {
    console.error('Validate discount error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get available discount codes for users
router.get('/available', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, code, discount_value, max_usage, used_count, expire_date FROM discount_codes WHERE (expire_date IS NULL OR expire_date > NOW()) AND used_count < max_usage ORDER BY discount_value DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get available discount codes error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all discount codes (admin only)
router.get('/', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM discount_codes ORDER BY expire_date DESC, id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get discount codes error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create discount code (admin only)
router.post('/', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { code, discountValue, maxUsage, expireDate } = req.body;

    if (!code || !discountValue || !maxUsage) {
      return res.status(400).json({ message: 'Code, discount value, and max usage are required' });
    }

    // Check if code already exists
    const existingCode = await pool.query('SELECT id FROM discount_codes WHERE code = $1', [code]);
    if (existingCode.rows.length > 0) {
      return res.status(400).json({ message: 'Discount code already exists' });
    }

    const result = await pool.query(
      'INSERT INTO discount_codes (code, discount_value, max_usage, expire_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [code, parseFloat(discountValue), parseInt(maxUsage), expireDate || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create discount code error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update discount code (admin only)
router.put('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const discountId = parseInt(req.params.id);
    const { code, discountValue, maxUsage, expireDate } = req.body;

    const result = await pool.query(
      'UPDATE discount_codes SET code = $1, discount_value = $2, max_usage = $3, expire_date = $4 WHERE id = $5 RETURNING *',
      [code, parseFloat(discountValue), parseInt(maxUsage), expireDate || null, discountId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Discount code not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update discount code error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete discount code (admin only)
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const discountId = parseInt(req.params.id);

    const result = await pool.query('DELETE FROM discount_codes WHERE id = $1 RETURNING *', [discountId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Discount code not found' });
    }

    res.json({ message: 'Discount code deleted successfully' });
  } catch (error) {
    console.error('Delete discount code error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;