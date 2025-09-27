const pool = require('../config/database');

const initializeDatabase = async () => {
  try {
    console.log('Initializing database...');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(10) CHECK(role IN ('user','admin')) NOT NULL DEFAULT 'user',
        profile_image TEXT,
        wallet_balance NUMERIC(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create games table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        price NUMERIC(10,2) NOT NULL,
        type VARCHAR(50) NOT NULL,
        image TEXT,
        description TEXT,
        release_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sales_count INT DEFAULT 0
      )
    `);

    // Create purchases table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        game_id INT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, game_id)
      )
    `);

    // Create wallet_transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) CHECK(type IN ('topup','purchase')) NOT NULL,
        amount NUMERIC(10,2) NOT NULL,
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create discount_codes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS discount_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_value NUMERIC(5,2) NOT NULL,
        max_usage INT NOT NULL,
        used_count INT DEFAULT 0,
        expire_date TIMESTAMP
      )
    `);

    // Insert sample data
    console.log('Inserting sample data...');

    // Insert sample admin user (password: admin123)
    await pool.query(`
      INSERT INTO users (username, email, password, role, wallet_balance) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['admin', 'admin@gameshop.com', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin', 1000]);

    // Insert sample regular user (password: user123)
    await pool.query(`
      INSERT INTO users (username, email, password, role, wallet_balance) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['testuser', 'user@gameshop.com', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'user', 500]);

    // Insert sample games
    const sampleGames = [
      ['Cyberpunk 2077', 59.99, 'RPG', 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg', 'An open-world, action-adventure story set in Night City.'],
      ['The Witcher 3', 39.99, 'RPG', 'https://images.pexels.com/photos/275033/pexels-photo-275033.jpeg', 'Story-driven open world RPG set in a visually stunning fantasy universe.'],
      ['Call of Duty: Modern Warfare', 49.99, 'Action', 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg', 'The stakes have never been higher as players take on the role of lethal Tier One operators.'],
      ['FIFA 24', 69.99, 'Sports', 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg', 'Experience the emotion of football in FIFA 24.'],
      ['Gran Turismo 7', 59.99, 'Racing', 'https://images.pexels.com/photos/544542/pexels-photo-544542.jpeg', 'The ultimate driving simulator returns.'],
      ['Minecraft', 29.99, 'Adventure', 'https://images.pexels.com/photos/163064/play-stone-network-networked-interactive-163064.jpeg', 'Build, explore, and survive in randomly generated worlds.'],
      ['Tetris Effect', 19.99, 'Puzzle', 'https://images.pexels.com/photos/163064/play-stone-network-networked-interactive-163064.jpeg', 'The ultimate expression of Tetris with stunning visuals.'],
      ['SimCity', 39.99, 'Simulation', 'https://images.pexels.com/photos/208684/pexels-photo-208684.jpeg', 'Build the city of your dreams and watch it come to life.'],
      ['Portal 2', 24.99, 'Puzzle', 'https://images.pexels.com/photos/163064/play-stone-network-networked-interactive-163064.jpeg', 'The sequel to the acclaimed puzzle-platform game.'],
      ['Age of Empires IV', 49.99, 'Strategy', 'https://images.pexels.com/photos/163064/play-stone-network-networked-interactive-163064.jpeg', 'One of the most beloved strategy games returns.']
    ];

    for (const game of sampleGames) {
      await pool.query(`
        INSERT INTO games (name, price, type, image, description, sales_count)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (name) DO NOTHING
      `, [...game, Math.floor(Math.random() * 10000)]);
    }

    // Insert sample discount codes
    await pool.query(`
      INSERT INTO discount_codes (code, discount_value, max_usage, expire_date)
      VALUES 
        ('WELCOME10', 10.00, 100, NOW() + INTERVAL '30 days'),
        ('SUMMER25', 25.00, 50, NOW() + INTERVAL '60 days'),
        ('NEWUSER5', 5.00, 200, NOW() + INTERVAL '90 days')
      ON CONFLICT (code) DO NOTHING
    `);

    console.log('Database initialized successfully!');
    console.log('Sample users created:');
    console.log('Admin: admin@gameshop.com / admin123');
    console.log('User: user@gameshop.com / user123');
    
    process.exit(0);
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
};

initializeDatabase();