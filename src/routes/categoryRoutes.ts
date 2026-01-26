import { Router } from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// Rutas públicas
router.get('/', getCategories);

// Rutas protegidas (Solo Admin y Farmacéutico pueden modificar categorías)
router.post('/', authenticateToken, authorizeRole(['admin', 'farmaceutico']), createCategory);
router.put('/:id', authenticateToken, authorizeRole(['admin', 'farmaceutico']), updateCategory);
router.delete('/:id', authenticateToken, authorizeRole(['admin', 'farmaceutico']), deleteCategory);

export default router;
