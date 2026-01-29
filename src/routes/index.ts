import { Router } from 'express';
import categoryRoutes from './categoryRoutes';
import productRoutes from './productRoutes';
import batchRoutes from './batchRoutes';
import inventoryRoutes from './inventoryRoutes';
import alertRoutes from './alertRoutes';
import promotionRoutes from './promotionRoutes';
import saleRoutes from './saleRoutes';
import reportRoutes from './reportRoutes';
import authRoutes from './authRoutes';
import logisticsRoutes from './logisticsRoutes';
import banchRoutes from './banchRoutes';
import userRoutes from './userRoutes';
const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/batches', batchRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/alerts', alertRoutes);
router.use('/promotions', promotionRoutes);
router.use('/sales', saleRoutes);
router.use('/reports', reportRoutes);
router.use('/logistics', logisticsRoutes); // Added
router.use('/banch', banchRoutes); // Added
export default router;
