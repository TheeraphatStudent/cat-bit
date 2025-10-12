const express = require('express');
const pool = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all game types
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, created_at FROM game_types ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get game types error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create game type (admin only)
router.post('/', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Game type name is required' });
    }

    const result = await pool.query(
      'INSERT INTO game_types (name) VALUES ($1) RETURNING id, name, created_at',
      [name.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create game type error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Game type already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update game type (admin only)
router.put('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const typeId = parseInt(req.params.id);
    const { name } = req.body;

    if (isNaN(typeId)) {
      return res.status(400).json({ message: 'Invalid game type ID' });
    }

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Game type name is required' });
    }

    const result = await pool.query(
      'UPDATE game_types SET name = $1 WHERE id = $2 RETURNING id, name, created_at',
      [name.trim(), typeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Game type not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update game type error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Game type already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete game type (admin only)
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const typeId = parseInt(req.params.id);

    if (isNaN(typeId)) {
      return res.status(400).json({ message: 'Invalid game type ID' });
    }

    // Check if any games use this type
    const gamesCheck = await pool.query(
      'SELECT COUNT(*) as count FROM games WHERE type = (SELECT name FROM game_types WHERE id = $1)',
      [typeId]
    );

    if (parseInt(gamesCheck.rows[0].count) > 0) {
      return res.status(400).json({ message: 'Cannot delete game type that is in use by games' });
    }

    const result = await pool.query(
      'DELETE FROM game_types WHERE id = $1 RETURNING *',
      [typeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Game type not found' });
    }

    res.json({ message: 'Game type deleted successfully' });
  } catch (error) {
    console.error('Delete game type error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
