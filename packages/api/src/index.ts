import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import ordersRouter from './routes/orders';
import yieldsRouter from './routes/yields';
import { apiRateLimiter } from './middlewares/rateLimiter';
import { logger } from './utils/logger';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Prevent duplicate listeners during hot reloading in development
if (process.env.NODE_ENV !== 'production') {
  process.removeAllListeners();
}

// Configure CORS to allow requests from frontend
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json());

// Apply rate limiting to all routes
app.use(apiRateLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  logger.info('Health check requested');
  res.json({
    status: 'ok',
    message: 'Application is running'
  });
});

// Mount API routes
app.use('/api/orders', ordersRouter);
app.use('/api/yields', yieldsRouter);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`API server running on port ${PORT}`);
});

// Handle graceful shutdown in development (nodemon restarts)
if (process.env.NODE_ENV !== 'production') {
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
}