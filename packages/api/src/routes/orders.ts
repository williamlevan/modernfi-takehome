import { Router } from 'express';
import { checkIdempotency } from '../middlewares/checkIdempotency';
import { orderController } from '../controllers/ordersController';

const router = Router();

router.get('/', orderController.getOrders);

router.post('/', checkIdempotency, orderController.createOrder);

export default router;