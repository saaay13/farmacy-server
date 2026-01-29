import { Router } from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory, restoreCategory } from '../controllers/categoryController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// Rutas públicas
router.get('/', getCategories);

// Rutas protegidas (Solo Admin y Farmacéutico pueden modificar categorías)
router.post('/', authenticateToken, authorizeRole(['admin', 'farmaceutico']), createCategory);
router.put('/:id', authenticateToken, authorizeRole(['admin', 'farmaceutico']), updateCategory);
router.delete('/:id', authenticateToken, authorizeRole(['admin', 'farmaceutico']), deleteCategory);
router.patch('/:id/restore', authenticateToken, authorizeRole(['admin', 'farmaceutico']), restoreCategory);

export default router;
