const express = require('express');
const pool = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// All routes require admin role
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

// Get all users
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, profile_image, wallet_balance, created_at FROM users ORDER BY id DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user transactions
router.get('/users/:userId/transactions', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

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
      ORDER BY wt.transaction_date DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/users/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { username, email, role, wallet_balance } = req.body;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (username !== undefined) {
      updates.push(`username = $${paramCount++}`);
      values.push(username);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (role !== undefined) {
      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }
    if (wallet_balance !== undefined) {
      updates.push(`wallet_balance = $${paramCount++}`);
      values.push(wallet_balance);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(userId);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, username, email, role, profile_image, wallet_balance, created_at`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user role
router.put('/users/:userId/role', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, role, profile_image, wallet_balance',
      [role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete user
router.delete('/users/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Get various statistics
    const [usersCount, gamesCount, totalSales, totalRevenue] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM games'),
      pool.query('SELECT COUNT(*) as count FROM purchases'),
      pool.query('SELECT SUM(amount) as total FROM wallet_transactions WHERE type = $1', ['purchase'])
    ]);

    // Get recent transactions
    const recentTransactions = await pool.query(`
      SELECT wt.*, u.username, u.email 
      FROM wallet_transactions wt 
      JOIN users u ON wt.user_id = u.id 
      ORDER BY wt.transaction_date DESC 
      LIMIT 10
    `);

    // Get top games by sales
    const topGames = await pool.query(`
      SELECT g.*, COUNT(p.id) as purchase_count 
      FROM games g 
      LEFT JOIN purchases p ON g.id = p.game_id 
      GROUP BY g.id 
      ORDER BY purchase_count DESC, g.sales_count DESC 
      LIMIT 5
    `);

    res.json({
      totalUsers: parseInt(usersCount.rows[0].count),
      totalGames: parseInt(gamesCount.rows[0].count),
      totalSales: parseInt(totalSales.rows[0].count),
      totalRevenue: parseFloat(totalRevenue.rows[0].total) || 0,
      recentTransactions: recentTransactions.rows,
      topGames: topGames.rows
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;