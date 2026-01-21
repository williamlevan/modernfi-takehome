import { Request, Response } from 'express';
import { yieldsService } from '../services/yieldsService';
import { YieldsResponse } from '@modernfi-takehome/shared';
import { logger } from '../utils/logger';

export const yieldsController = {
  getYields: async (req: Request, res: Response) => {
    try {
      const apiKey = process.env.FRED_API_KEY;

      if (!apiKey) {
        logger.error('FRED API key not configured');
        return res.status(500).json({
          success: false,
          error: 'FRED API key not configured',
        });
      }

      const { yields, errors, fromCache } = await yieldsService.getAllYields(apiKey);

      // If we have no yields at all and have errors, treat as failure
      if (yields.length === 0 && errors.length > 0 && !fromCache) {
        logger.error('Failed to fetch any yield data', { errors });
        return res.status(500).json({
          success: false,
          error: `Failed to fetch yield data: ${errors.map(e => `${e.term} - ${e.error}`).join(', ')}`,
          errors
        });
      }

      if (fromCache) {
        logger.warn('Returning cached yields data due to API failures');
      }

      // Log warnings for partial failures
      if (errors.length > 0 && !fromCache) {
        logger.warn(`Partial failure: ${errors.length} terms failed`, { errors });
      }

      logger.info(`Successfully fetched ${yields.length} yield data points${errors.length > 0 ? ` (${errors.length} errors)` : ''}`);

      const response: YieldsResponse = {
        success: true,
        data: yields,
        fetched_at: new Date(),
        ...(errors.length > 0 && { errors }), // Only include errors if there are any
        ...(fromCache && { fromCache: true })
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to fetch yields', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch yields',
      });
    }
  }
}