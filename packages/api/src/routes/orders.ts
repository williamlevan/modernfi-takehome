import { Router } from 'express';
import { checkIdempotency } from '../middlewares/checkIdempotency';
import { orderController } from '../controllers/ordersController';

const router = Router();

/**
 * GET /api/orders
 * Fetches paginated list of orders
 */
router.get('/', orderController.getOrders);

/**
 * POST /api/orders
 * Creates a new order
 * Requires Idempotency-Key header (enforced by checkIdempotency middleware)
 */
router.post('/', checkIdempotency, orderController.createOrder);

export default router;