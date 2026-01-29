import { Router } from 'express';
import { getPromotions, createPromotion, approvePromotion, deletePromotion } from '../controllers/promotionController';
import { authenticateToken, authorizeRole, optionalAuthenticate } from '../middleware/authMiddleware';

const router = Router();

// Rutas públicas/protegidas según parámetros
// GET con aprobada=true es público (para clientes)
// GET sin parámetros o aprobada=false requiere autenticación (staff)
router.get('/', optionalAuthenticate, getPromotions);
router.post('/', authenticateToken, authorizeRole(['admin', 'farmaceutico', 'vendedor']), createPromotion);

// Solo Admin puede aprobar o eliminar promociones críticas
router.patch('/:id/approve', authenticateToken, authorizeRole(['admin']), approvePromotion);
router.delete('/:id', authenticateToken, authorizeRole(['admin']), deletePromotion);

export default router;
