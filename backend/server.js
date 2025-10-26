const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/games', require('./routes/games'));
app.use('/game-types', require('./routes/game-types'));
app.use('/cart', require('./routes/cart'));
app.use('/wallet', require('./routes/wallet'));
app.use('/discount', require('./routes/discount'));
app.use('/admin', require('./routes/admin'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  const availableEndpoints = {
    message: 'Endpoint not found',
    availableRoutes: {
      auth: ['POST /auth/register', 'POST /auth/login', 'GET /auth/me', 'PUT /auth/update', 'DELETE /auth/delete'],
      games: ['GET /games', 'GET /games/library', 'GET /games/:id', 'POST /games (admin)', 'PUT /games/:id (admin)', 'DELETE /games/:id (admin)', 'POST /games/:id/upload-image (admin)'],
      gameTypes: ['GET /game-types', 'POST /game-types (admin)', 'PUT /game-types/:id (admin)', 'DELETE /game-types/:id (admin)'],
      cart: ['GET /cart', 'POST /cart/add', 'DELETE /cart/remove/:gameId', 'POST /cart/discount', 'POST /cart/checkout', 'DELETE /cart/clear'],
      wallet: ['GET /wallet/balance', 'POST /wallet/topup', 'GET /wallet/transactions'],
      discount: ['POST /discount/validate', 'GET /discount/available', 'GET /discount (admin)', 'POST /discount (admin)', 'PUT /discount/:id (admin)', 'DELETE /discount/:id (admin)'],
      admin: ['GET /admin/users (admin)', 'GET /admin/users/:userId/transactions (admin)', 'PUT /admin/users/:userId (admin)', 'PUT /admin/users/:userId/role (admin)', 'DELETE /admin/users/:userId (admin)', 'GET /admin/stats (admin)'],
      health: ['GET /health']
    },
    documentation: 'See api.spec.md for complete API documentation',
    baseUrl: 'http://localhost:3000'
  };
  res.status(404).json(availableEndpoints);
});

app.listen(PORT, () => {
  console.log(`Cat bit Backend running on port ${PORT}`);
});