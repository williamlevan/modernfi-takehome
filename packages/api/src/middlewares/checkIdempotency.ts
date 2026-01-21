import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// In-memory store for idempotency keys and their responses (24-hour TTL)
const idempotencyStore = new Map<string, { response: any; timestamp: Date }>();

/**
 * Removes idempotency entries older than 24 hours to prevent memory leaks
 */
const cleanupOldEntries = () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    for (const [key, value] of idempotencyStore.entries()) {
        if (value.timestamp < oneDayAgo) {
            idempotencyStore.delete(key);
        }
    }
};

// Run cleanup every hour
setInterval(cleanupOldEntries, 60 * 60 * 1000);

/**
 * Middleware to enforce idempotency for POST requests
 * Checks for Idempotency-Key header and returns cached response if key exists
 */
export const checkIdempotency = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Extract idempotency key from headers
    const idempotencyKey = req.headers['idempotency-key'] as string;

    if (!idempotencyKey) {
        logger.warn('Missing Idempotency-Key header', { path: req.path });
        return res.status(400).json({
            error: 'Missing Idempotency-Key header',
        });
    }

    logger.info('Checking idempotency', { idempotencyKey: idempotencyKey.substring(0, 20) + '...' });

    // Check if we've seen this key before
    const existingResponse = idempotencyStore.get(idempotencyKey);

    if (existingResponse) {
        // Return cached response (same status and data as original request)
        return res.status(existingResponse.response.status).json(existingResponse.response.data);
    }

    // Intercept response.json to cache the response for future idempotent requests
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
        // Store response with timestamp for cleanup
        idempotencyStore.set(idempotencyKey, {
            response: {
                status: res.statusCode,
                data: body,
            },
            timestamp: new Date(),
        });

        return originalJson(body);
    };

    next();
};