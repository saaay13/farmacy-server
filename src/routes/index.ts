import { Router } from 'express';
import { getHome, getCategories } from '../controllers/homeController';

const router = Router();

router.get('/', getHome);
router.get('/test-db', getCategories);

export default router;
