const express = require('express');
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get user's cart (using session storage for simplicity)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get cart items from session table (we'll create this virtually)
    const result = await pool.query(`
      SELECT g.*, 1 as quantity
      FROM games g
      WHERE g.id = ANY(
        COALESCE(
          (SELECT string_to_array(cart_items, ',')::int[]
           FROM user_sessions 
           WHERE user_id = $1 AND cart_items IS NOT NULL),
          ARRAY[]::int[]
        )
      )
    `, [userId]);

    const items = result.rows.map(game => ({
      game,
      quantity: 1
    }));

    const total = items.reduce((sum, item) => sum + item.game.price, 0);

    res.json({
      items,
      total,
      discountCode: null,
      discountAmount: 0
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add game to cart
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { gameId } = req.body;

    if (!gameId) {
      return res.status(400).json({ message: 'Game ID is required' });
    }

    const parsedGameId = parseInt(gameId);
    if (isNaN(parsedGameId)) {
      return res.status(400).json({ message: 'Invalid game ID' });
    }

    // Check if game exists
    const gameResult = await pool.query('SELECT * FROM games WHERE id = $1', [parsedGameId]);
    if (gameResult.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Check if user already owns this game
    const ownedCheck = await pool.query(
      'SELECT id FROM purchases WHERE user_id = $1 AND game_id = $2',
      [userId, parsedGameId]
    );

    if (ownedCheck.rows.length > 0) {
      return res.status(400).json({ message: 'You already own this game' });
    }

    await pool.query(`
      INSERT INTO user_sessions (user_id, cart_items) 
      VALUES ($1, $2)
      ON CONFLICT (user_id) 
      DO UPDATE SET cart_items = 
        CASE 
          WHEN user_sessions.cart_items IS NULL OR user_sessions.cart_items = '' THEN $2
          WHEN position($2 in user_sessions.cart_items) = 0 THEN user_sessions.cart_items || ',' || $2
          ELSE user_sessions.cart_items
        END
    `, [userId, parsedGameId.toString()]);

    // Return updated cart
    const cartResult = await pool.query(`
      SELECT g.*, 1 as quantity
      FROM games g
      WHERE g.id = ANY(
        COALESCE(
          (SELECT string_to_array(cart_items, ',')::int[]
           FROM user_sessions 
           WHERE user_id = $1 AND cart_items IS NOT NULL AND cart_items != ''),
          ARRAY[]::int[]
        )
      )
    `, [userId]);

    const items = cartResult.rows.map(game => ({
      game,
      quantity: 1
    }));

    const total = items.reduce((sum, item) => sum + item.game.price, 0);

    res.json({
      items,
      total,
      discountCode: null,
      discountAmount: 0
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove game from cart
router.delete('/remove/:gameId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const gameId = parseInt(req.params.gameId);

    await pool.query(`
      UPDATE user_sessions 
      SET cart_items = array_to_string(
        array_remove(
          string_to_array(cart_items, ','), 
          $2
        ), 
        ','
      )
      WHERE user_id = $1
    `, [userId, gameId.toString()]);

    // Return updated cart
    const cartResult = await pool.query(`
      SELECT g.*, 1 as quantity
      FROM games g
      WHERE g.id = ANY(
        COALESCE(
          (SELECT string_to_array(cart_items, ',')::int[]
           FROM user_sessions 
           WHERE user_id = $1 AND cart_items IS NOT NULL AND cart_items != ''),
          ARRAY[]::int[]
        )
      )
    `, [userId]);

    const items = cartResult.rows.map(game => ({
      game,
      quantity: 1
    }));

    const total = items.reduce((sum, item) => sum + item.game.price, 0);

    res.json({
      items,
      total,
      discountCode: null,
      discountAmount: 0
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Apply discount code
router.post('/discount', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Discount code is required' });
    }

    const discountResult = await pool.query(
      'SELECT * FROM discount_codes WHERE code = $1 AND (expire_date IS NULL OR expire_date > NOW()) AND used_count < max_usage',
      [code]
    );

    if (discountResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired discount code' });
    }

    const discount = discountResult.rows[0];

    await pool.query(
      'UPDATE user_sessions SET discount_code = $1 WHERE user_id = $2',
      [code, userId]
    );

    // Get current cart
    const cartResult = await pool.query(`
      SELECT g.*, 1 as quantity
      FROM games g
      WHERE g.id = ANY(
        COALESCE(
          (SELECT string_to_array(cart_items, ',')::int[]
           FROM user_sessions 
           WHERE user_id = $1 AND cart_items IS NOT NULL AND cart_items != ''),
          ARRAY[]::int[]
        )
      )
    `, [userId]);

    const items = cartResult.rows.map(game => ({
      game,
      quantity: 1
    }));

    const subtotal = items.reduce((sum, item) => sum + item.game.price, 0);
    const discountAmount = subtotal * (discount.discount_value / 100);
    const total = subtotal - discountAmount;

    res.json({
      items,
      total,
      discountCode: code,
      discountAmount
    });
  } catch (error) {
    console.error('Apply discount error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Checkout
router.post('/checkout', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { gameIds, discountCode } = req.body;

    if (!gameIds || gameIds.length === 0) {
      return res.status(400).json({ message: 'No games selected for purchase' });
    }

    // Get user's current wallet balance
    const userResult = await pool.query('SELECT wallet_balance FROM users WHERE id = $1', [userId]);
    let walletBalance = parseFloat(userResult.rows[0].wallet_balance);

    // Calculate total cost
    const gamesResult = await pool.query(
      'SELECT * FROM games WHERE id = ANY($1)',
      [gameIds]
    );

    let totalCost = gamesResult.rows.reduce((sum, game) => sum + parseFloat(game.price), 0);
    let discountAmount = 0;

    // Apply discount if provided
    if (discountCode) {
      const discountResult = await pool.query(
        'SELECT * FROM discount_codes WHERE code = $1 AND (expire_date IS NULL OR expire_date > NOW()) AND used_count < max_usage',
        [discountCode]
      );

      if (discountResult.rows.length > 0) {
        const discount = discountResult.rows[0];
        discountAmount = totalCost * (discount.discount_value / 100);
        totalCost -= discountAmount;
      }
    }

    // Check if user has sufficient balance
    if (walletBalance < totalCost) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Begin transaction
    await pool.query('BEGIN');

    try {
      // Check for duplicate purchases
      const existingPurchases = await pool.query(
        'SELECT game_id FROM purchases WHERE user_id = $1 AND game_id = ANY($2)',
        [userId, gameIds]
      );

      if (existingPurchases.rows.length > 0) {
        await pool.query('ROLLBACK');
        return res.status(400).json({ message: 'You already own some of these games' });
      }

      // Create purchases
      for (const gameId of gameIds) {
        await pool.query(
          'INSERT INTO purchases (user_id, game_id) VALUES ($1, $2)',
          [userId, gameId]
        );

        // Update game sales count
        await pool.query(
          'UPDATE games SET sales_count = sales_count + 1 WHERE id = $1',
          [gameId]
        );
      }

      // Update user wallet balance
      await pool.query(
        'UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2',
        [totalCost, userId]
      );

      // Create wallet transaction
      await pool.query(
        'INSERT INTO wallet_transactions (user_id, type, amount) VALUES ($1, $2, $3)',
        [userId, 'purchase', totalCost]
      );

      // Update discount code usage
      if (discountCode) {
        await pool.query(
          'UPDATE discount_codes SET used_count = used_count + 1 WHERE code = $1',
          [discountCode]
        );
      }

      // Clear cart
      await pool.query('UPDATE user_sessions SET cart_items = NULL, discount_code = NULL WHERE user_id = $1', [userId]);

      await pool.query('COMMIT');

      res.json({
        message: 'Purchase completed successfully',
        totalCost,
        discountAmount,
        purchasedGames: gamesResult.rows
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Clear cart
router.delete('/clear', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query('UPDATE user_sessions SET cart_items = NULL, discount_code = NULL WHERE user_id = $1', [userId]);

    res.json({
      items: [],
      total: 0,
      discountCode: null,
      discountAmount: 0
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;