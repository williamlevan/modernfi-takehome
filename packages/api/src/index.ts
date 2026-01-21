import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import ordersRouter from './routes/orders';
import yieldsRouter from './routes/yields';
import { apiRateLimiter } from './middlewares/rateLimiter';
import { logger } from './utils/logger';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'production') {
  process.removeAllListeners();
}

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

app.use(apiRateLimiter);

app.get('/api/health', (req, res) => {
  logger.info('Health check requested');
  res.json({
    status: 'ok',
    message: 'Application is running'
  });
});

app.use('/api/orders', ordersRouter);
app.use('/api/yields', yieldsRouter);

const server = app.listen(PORT, () => {
  logger.info(`API server running on port ${PORT}`);
});

if (process.env.NODE_ENV !== 'production') {
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
}