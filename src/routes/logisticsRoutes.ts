import { Router } from 'express';
import { getReplenishmentSuggestions, getCriticalProductsReport } from '../controllers/logisticsController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// Autenticación y roles
router.use(authenticateToken);
router.use(authorizeRole(['admin', 'farmaceutico']));

// Sugerencias de reabastecimiento
router.get('/replenishment', getReplenishmentSuggestions);

// Reporte consolidado
router.get('/critical-report', getCriticalProductsReport);

export default router;
