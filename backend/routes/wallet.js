const express = require('express');
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get wallet balance
router.get('/balance', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query('SELECT wallet_balance FROM users WHERE id = $1', [userId]);
    
    res.json({ balance: parseFloat(result.rows[0].wallet_balance) });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Top up wallet
router.post('/topup', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const topupAmount = parseFloat(amount);

    // Begin transaction
    await pool.query('BEGIN');

    try {
      // Update user wallet balance
      const result = await pool.query(
        'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2 RETURNING wallet_balance',
        [topupAmount, userId]
      );

      // Create wallet transaction record
      await pool.query(
        'INSERT INTO wallet_transactions (user_id, type, amount) VALUES ($1, $2, $3)',
        [userId, 'topup', topupAmount]
      );

      await pool.query('COMMIT');

      res.json({ 
        balance: parseFloat(result.rows[0].wallet_balance),
        message: 'Wallet topped up successfully'
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Top up error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get transaction history
router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
        wt.id,
        wt.user_id,
        wt.type,
        wt.amount,
        wt.game_id,
        wt.transaction_date,
        CASE 
          WHEN wt.game_id IS NOT NULL THEN json_build_object(
            'id', g.id,
            'name', g.name,
            'price', g.price,
            'type', g.type,
            'image', g.image
          )
          ELSE NULL
        END as game
      FROM wallet_transactions wt
      LEFT JOIN games g ON wt.game_id = g.id
      WHERE wt.user_id = $1 
      ORDER BY wt.transaction_date DESC 
      LIMIT 50`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;