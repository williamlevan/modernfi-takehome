import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

const idempotencyStore = new Map<string, { response: any; timestamp: Date }>();

const cleanupOldEntries = () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    for (const [key, value] of idempotencyStore.entries()) {
        if (value.timestamp < oneDayAgo) {
            idempotencyStore.delete(key);
        }
    }
};

setInterval(cleanupOldEntries, 60 * 60 * 1000);

export const checkIdempotency = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const idempotencyKey = req.headers['idempotency-key'] as string;

    if (!idempotencyKey) {
        logger.warn('Missing Idempotency-Key header', { path: req.path });
        return res.status(400).json({
            error: 'Missing Idempotency-Key header',
        });
    }

    logger.info('Checking idempotency', { idempotencyKey: idempotencyKey.substring(0, 20) + '...' });

    const existingResponse = idempotencyStore.get(idempotencyKey);

    if (existingResponse) {
        return res.status(existingResponse.response.status).json(existingResponse.response.data);
    }

    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
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