import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

export const apiRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`, { path: req.path });
        res.status(429).json({
            success: false,
            error: 'Too many requests from this IP, please try again later.',
        });
    },
});

