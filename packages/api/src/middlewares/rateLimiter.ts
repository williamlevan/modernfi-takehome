import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

/**
 * General API rate limiter
 * Limits requests to 100 per minute per IP address
 */
export const apiRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 100, // Maximum 100 requests per window
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    handler: (req, res) => {
        // Custom handler to log rate limit violations and return consistent error format
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`, { path: req.path });
        res.status(429).json({
            success: false,
            error: 'Too many requests from this IP, please try again later.',
        });
    },
});

