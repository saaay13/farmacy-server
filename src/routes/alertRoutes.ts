import { Router } from 'express';
import { getAlerts, checkAndGenerateAlerts, deleteAlert } from '../controllers/alertController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// Todas las rutas de alertas requieren autenticación interna (no clientes)
router.get('/', authenticateToken, authorizeRole(['admin', 'farmaceutico', 'vendedor']), getAlerts);
router.post('/check', authenticateToken, authorizeRole(['admin', 'farmaceutico']), checkAndGenerateAlerts);
router.delete('/:id', authenticateToken, authorizeRole(['admin', 'farmaceutico']), deleteAlert);

export default router;
