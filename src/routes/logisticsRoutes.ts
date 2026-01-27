import { Router } from 'express';
import { getReplenishmentSuggestions, getCriticalProductsReport } from '../controllers/logisticsController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// Todas las rutas de logística requieren autenticación y rol de staff (Admin o Farmacéutico)
router.use(authenticateToken);
router.use(authorizeRole(['admin', 'farmaceutico']));

/**
 * @route GET /api/logistics/replenishment
 * @desc Obtener sugerencias de reabastecimiento basadas en stock y ventas
 */
router.get('/replenishment', getReplenishmentSuggestions);

/**
 * @route GET /api/logistics/critical-report
 * @desc Obtener reporte consolidado de productos críticos
 */
router.get('/critical-report', getCriticalProductsReport);

export default router;
