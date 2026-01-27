import { Router } from 'express';
import { getPromotions, createPromotion, approvePromotion, deletePromotion } from '../controllers/promotionController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// Rutas protegidas (Personal interno puede ver y crear)
router.get('/', authenticateToken, authorizeRole(['admin', 'farmaceutico', 'vendedor']), getPromotions);
router.post('/', authenticateToken, authorizeRole(['admin', 'farmaceutico', 'vendedor']), createPromotion);

// Solo Admin puede aprobar o eliminar promociones críticas
router.patch('/:id/approve', authenticateToken, authorizeRole(['admin']), approvePromotion);
router.delete('/:id', authenticateToken, authorizeRole(['admin']), deletePromotion);

export default router;
