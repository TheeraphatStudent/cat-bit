const express = require('express');
const multer = require('multer');
const pool = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ storage: storage });

// Get all games with optional filtering
router.get('/', async (req, res) => {
  try {
    const { name, type, minPrice, maxPrice } = req.query;
    const userId = req.user?.id;

    let query = `
      SELECT
        g.id,
        g.name,
        g.price,
        g.type,
        g.description,
        g.image,
        g.release_date AS "releaseDate",
        COALESCE(g.sales_count, 0) AS "salesCount",
        ROW_NUMBER() OVER (ORDER BY g.sales_count DESC, g.release_date DESC) AS "rank"
        ${userId ? `, EXISTS(SELECT 1 FROM purchases p WHERE p.user_id = ${userId} AND p.game_id = g.id) AS "isPurchased"` : ', false AS "isPurchased"'}
      FROM games g
      WHERE 1 = 1
    `;

    const params = [];

    if (name) {
      query += ` AND LOWER(g.name) LIKE LOWER($${params.length + 1})`;
      params.push(`%${name}%`);
    }

    if (type) {
      query += ` AND g.type = $${params.length + 1}`;
      params.push(type);
    }

    if (minPrice) {
      query += ` AND g.price >= $${params.length + 1}`;
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      query += ` AND g.price <= $${params.length + 1}`;
      params.push(parseFloat(maxPrice));
    }

    query += ' ORDER BY g.sales_count DESC, g.release_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user's library (purchased games)
router.get('/library', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT
        g.id,
        g.name,
        g.price,
        g.type,
        g.description,
        g.image,
        g.release_date AS "releaseDate",
        COALESCE(g.sales_count, 0) AS "salesCount",
        p.purchase_date AS "purchaseDate"
      FROM games g
      JOIN purchases p ON g.id = p.game_id
      WHERE p.user_id = $1
      ORDER BY p.purchase_date DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get library error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single game
router.get('/:id', async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);

    if (isNaN(gameId)) {
      return res.status(400).json({ message: 'Invalid game ID' });
    }

    const result = await pool.query(`
      SELECT
        id,
        name,
        price,
        type,
        description,
        image,
        release_date AS "releaseDate",
        COALESCE(sales_count, 0) AS "salesCount"
      FROM games
      WHERE id = $1
    `, [gameId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create game (admin only)
router.post('/', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { name, price, type, description, image } = req.body;

    if (!name || !price || !type) {
      return res.status(400).json({ message: 'Name, price, and type are required' });
    }

    const result = await pool.query(
      `INSERT INTO games (name, price, type, description, image)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING
         id,
         name,
         price,
         type,
         description,
         image,
         release_date AS "releaseDate",
         COALESCE(sales_count, 0) AS "salesCount"`,
      [name, parseFloat(price), type, description, image || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update game (admin only)
router.put('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const { name, price, type, description, image } = req.body;

    if (isNaN(gameId)) {
      return res.status(400).json({ message: 'Invalid game ID' });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (price !== undefined) {
      updates.push(`price = $${paramCount++}`);
      values.push(parseFloat(price));
    }
    if (type !== undefined) {
      updates.push(`type = $${paramCount++}`);
      values.push(type);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (image !== undefined) {
      updates.push(`image = $${paramCount++}`);
      values.push(image);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(gameId);
    const query = `UPDATE games SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, name, price, type, description, image, release_date AS "releaseDate", COALESCE(sales_count, 0) AS "salesCount"`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete game (admin only)
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);

    if (isNaN(gameId)) {
      return res.status(400).json({ message: 'Invalid game ID' });
    }

    const result = await pool.query('DELETE FROM games WHERE id = $1 RETURNING *', [gameId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }

    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Upload game image
router.post('/:id/upload-image', authMiddleware, roleMiddleware(['admin']), upload.single('image'), async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);

    if (isNaN(gameId)) {
      return res.status(400).json({ message: 'Invalid game ID' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    const result = await pool.query(
      `UPDATE games
       SET image = $1
       WHERE id = $2
       RETURNING
         id,
         name,
         price,
         type,
         description,
         image,
         release_date AS "releaseDate",
         COALESCE(sales_count, 0) AS "salesCount"`,
      [imageUrl, gameId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }

    res.json({ imageUrl, game: result.rows[0] });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
