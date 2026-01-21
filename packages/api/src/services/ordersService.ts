import { Order } from '@modernfi-takehome/shared';
import { logger } from '../utils/logger';
import { TREASURY_SERIES } from '../constants/fredConstants';

// In-memory storage for orders (data persists only during server runtime)
const orders: Order[] = [];

// Valid treasury terms derived from FRED series constants
const VALID_TERMS = Object.keys(TREASURY_SERIES);

interface OrderValidationError {
  field: string;
  message: string;
}

/**
 * Validates order data before creation
 * Throws an error with validation details if any field is invalid
 */
function validateOrderData(orderData: Omit<Order, 'id' | 'created_at'>): void {
  const errors: OrderValidationError[] = [];

  // Validate term (must be a valid treasury term)
  if (!orderData.term || typeof orderData.term !== 'string') {
    errors.push({ field: 'term', message: 'Term is required and must be a string' });
  } else if (!VALID_TERMS.includes(orderData.term)) {
    errors.push({
      field: 'term',
      message: `Invalid term. Must be one of: ${VALID_TERMS.join(', ')}`
    });
  }

  // Validate amount_in_cents (must be positive integer, max $10 billion)
  if (orderData.amount_in_cents === undefined || orderData.amount_in_cents === null) {
    errors.push({ field: 'amount_in_cents', message: 'Amount in cents is required' });
  } else if (typeof orderData.amount_in_cents !== 'number') {
    errors.push({ field: 'amount_in_cents', message: 'Amount in cents must be a number' });
  } else if (!Number.isInteger(orderData.amount_in_cents)) {
    errors.push({ field: 'amount_in_cents', message: 'Amount in cents must be an integer' });
  } else if (orderData.amount_in_cents <= 0) {
    errors.push({ field: 'amount_in_cents', message: 'Amount in cents must be greater than 0' });
  } else if (orderData.amount_in_cents > 1000000000000) { // Max $10 billion
    errors.push({ field: 'amount_in_cents', message: 'Amount exceeds maximum allowed value' });
  }

  // Validate rate_at_submission (must be between 0 and 100%)
  if (orderData.rate_at_submission === undefined || orderData.rate_at_submission === null) {
    errors.push({ field: 'rate_at_submission', message: 'Rate at submission is required' });
  } else if (typeof orderData.rate_at_submission !== 'number') {
    errors.push({ field: 'rate_at_submission', message: 'Rate at submission must be a number' });
  } else if (isNaN(orderData.rate_at_submission)) {
    errors.push({ field: 'rate_at_submission', message: 'Rate at submission must be a valid number' });
  } else if (orderData.rate_at_submission < 0) {
    errors.push({ field: 'rate_at_submission', message: 'Rate at submission cannot be negative' });
  } else if (orderData.rate_at_submission > 100) {
    errors.push({ field: 'rate_at_submission', message: 'Rate at submission cannot exceed 100%' });
  }

  // Validate curve_date (must be valid date, not in future, not older than 10 years)
  if (!orderData.curve_date) {
    errors.push({ field: 'curve_date', message: 'Curve date is required' });
  } else {
    const curveDate = orderData.curve_date instanceof Date
      ? orderData.curve_date
      : new Date(orderData.curve_date);

    if (isNaN(curveDate.getTime())) {
      errors.push({ field: 'curve_date', message: 'Curve date must be a valid date' });
    } else {
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today

      if (curveDate > today) {
        errors.push({ field: 'curve_date', message: 'Curve date cannot be in the future' });
      }

      // Check if date is too far in the past (e.g., more than 10 years)
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
      if (curveDate < tenYearsAgo) {
        errors.push({ field: 'curve_date', message: 'Curve date is too far in the past' });
      }
    }
  }

  // Validate series_id (must match expected FRED series ID for the term)
  if (!orderData.series_id || typeof orderData.series_id !== 'string') {
    errors.push({ field: 'series_id', message: 'Series ID is required and must be a string' });
  } else if (orderData.series_id.trim().length === 0) {
    errors.push({ field: 'series_id', message: 'Series ID cannot be empty' });
  } else if (orderData.term && VALID_TERMS.includes(orderData.term)) {
    // Validate that series_id matches the expected series_id for the term
    const expectedSeriesId = TREASURY_SERIES[orderData.term as keyof typeof TREASURY_SERIES];
    if (orderData.series_id !== expectedSeriesId) {
      errors.push({
        field: 'series_id',
        message: `Series ID does not match expected value for term ${orderData.term}. Expected: ${expectedSeriesId}`
      });
    }
  }

  if (errors.length > 0) {
    const errorMessage = errors.map(e => `${e.field}: ${e.message}`).join('; ');
    logger.warn('Order validation failed', { errors });
    throw new Error(`Validation failed: ${errorMessage}`);
  }
}

export const orderService = {
  /**
   * Retrieves orders with pagination support
   * Returns orders sorted by creation date (newest first)
   */
  getOrdersPaginated: (page: number = 1, limit: number = 10): {
    orders: Order[];
    total: number;
    total_pages: number;
  } => {
    // Sort orders by creation date (newest first)
    const sortedOrders = [...orders].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Calculate pagination metadata
    const total = sortedOrders.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = sortedOrders.slice(startIndex, endIndex);

    return {
      orders: paginatedOrders,
      total,
      total_pages: totalPages,
    };
  },

  /**
   * Creates a new order after validation
   * Generates a unique ID and timestamp
   */
  createOrder: (orderData: Omit<Order, 'id' | 'created_at'>): Order => {
    // Validate all order fields before creation
    validateOrderData(orderData);

    // Generate unique order ID with timestamp and random suffix
    const newOrder: Order = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date(),
      ...orderData,
    };

    orders.push(newOrder);
    logger.info(`Order stored in memory`, { orderId: newOrder.id, totalOrders: orders.length });

    return newOrder;
  },

  /**
   * Finds an existing order by idempotency key
   * Used to prevent duplicate order creation
   */
  findOrderByIdempotencyKey: (idempotencyKey: string): Order | undefined => {
    const order = orders.find(
      order => (order as any).idempotencyKey === idempotencyKey
    );

    if (order) {
      logger.info('Found existing order by idempotency key', { orderId: order.id });
    }

    return order;
  },
};