import { Router } from 'express';
import { getCategories } from '../controllers/homeController';
import authRoutes from './authRoutes';

const router = Router();

router.use('/auth', authRoutes); // /api/auth/login, /api/auth/register
router.get('/categories', getCategories);

export default router;
