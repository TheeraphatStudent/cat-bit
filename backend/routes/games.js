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
    
    let query = 'SELECT *, ROW_NUMBER() OVER (ORDER BY sales_count DESC, release_date DESC) as rank FROM games WHERE 1=1';
    const params = [];

    if (name) {
      query += ' AND LOWER(name) LIKE LOWER($' + (params.length + 1) + ')';
      params.push(`%${name}%`);
    }

    if (type) {
      query += ' AND type = $' + (params.length + 1);
      params.push(type);
    }

    if (minPrice) {
      query += ' AND price >= $' + (params.length + 1);
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      query += ' AND price <= $' + (params.length + 1);
      params.push(parseFloat(maxPrice));
    }

    query += ' ORDER BY sales_count DESC, release_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get games error:', error);
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
    
    const result = await pool.query('SELECT * FROM games WHERE id = $1', [gameId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user's library (purchased games)
router.get('/library', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(`
      SELECT g.*, p.purchase_date
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

// Create game (admin only)
router.post('/', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { name, price, type, description } = req.body;

    if (!name || !price || !type) {
      return res.status(400).json({ message: 'Name, price, and type are required' });
    }

    const result = await pool.query(
      'INSERT INTO games (name, price, type, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, parseFloat(price), type, description]
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
    const { name, price, type, description } = req.body;

    if (isNaN(gameId)) {
      return res.status(400).json({ message: 'Invalid game ID' });
    }

    const result = await pool.query(
      'UPDATE games SET name = $1, price = $2, type = $3, description = $4 WHERE id = $5 RETURNING *',
      [name, parseFloat(price), type, description, gameId]
    );

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
      'UPDATE games SET image = $1 WHERE id = $2 RETURNING *',
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