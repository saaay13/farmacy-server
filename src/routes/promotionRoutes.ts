import { Router } from 'express';
import { getPromotions, createPromotion, approvePromotion, deletePromotion, restorePromotion } from '../controllers/promotionController';
import { authenticateToken, authorizeRole, optionalAuthenticate } from '../middleware/authMiddleware';

const router = Router();

// Listar promociones
router.get('/', optionalAuthenticate, getPromotions);
router.post('/', authenticateToken, authorizeRole(['admin', 'farmaceutico', 'vendedor']), createPromotion);

// Gestión de promociones
router.patch('/:id/approve', authenticateToken, authorizeRole(['admin']), approvePromotion);
router.delete('/:id', authenticateToken, authorizeRole(['admin']), deletePromotion);
router.patch('/:id/restore', authenticateToken, authorizeRole(['admin']), restorePromotion);

export default router;
