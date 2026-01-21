import { Request, Response } from 'express';
import { orderService } from '../services/ordersService';
import { Order, OrdersResponse } from '@modernfi-takehome/shared';
import { logger } from '../utils/logger';

export const orderController = {
  getOrders: (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (page < 1) {
        logger.warn(`Invalid page parameter: ${page}`);
        return res.status(400).json({
          success: false,
          error: 'Page must be greater than 0',
        });
      }

      if (limit < 1 || limit > 100) {
        logger.warn(`Invalid limit parameter: ${limit}`);
        return res.status(400).json({
          success: false,
          error: 'Limit must be between 1 and 100',
        });
      }

      const { orders, total, total_pages } = orderService.getOrdersPaginated(page, limit);

      logger.info(`Successfully fetched ${orders.length} orders (total: ${total})`);

      const response: OrdersResponse = {
        success: true,
        data: orders,
        pagination: {
          page,
          limit,
          total,
          total_pages
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to fetch orders', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch orders',
      });
    }
  },

  createOrder: (req: Request, res: Response) => {
    try {
      const idempotencyKey = req.headers['idempotency-key'] as string;
      const orderData = req.body;

      logger.info('Creating new order', { term: orderData.term, amount: orderData.amount_in_cents });

      const existingOrder = orderService.findOrderByIdempotencyKey(idempotencyKey);

      if (existingOrder) {
        logger.info('Order already exists (idempotent)', { orderId: existingOrder.id });
        return res.status(200).json({
          success: true,
          data: existingOrder,
          message: 'Order already exists (idempotent)',
        });
      }

      const { curve_date, term, amount_in_cents, rate_at_submission, series_id } = orderData;

      if (!curve_date || !term || !series_id || amount_in_cents === undefined || rate_at_submission === undefined) {
        logger.warn('Missing required fields in order creation', { orderData });
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: curve_date, term, series_id, amount_cents, rate',
        });
      }

      const newOrder = orderService.createOrder({
        curve_date: new Date(curve_date),
        term,
        amount_in_cents,
        rate_at_submission,
        series_id,
      });

      logger.info('Order created successfully', { orderId: newOrder.id, term: newOrder.term });

      res.status(201).json({
        success: true,
        data: newOrder
      });
    } catch (error) {
      logger.error('Failed to create order', error);

      // Check if it's a validation error
      if (error instanceof Error && error.message.startsWith('Validation failed:')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create order',
      });
    }
  },
};