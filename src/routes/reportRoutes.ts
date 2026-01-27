import { Router } from 'express';
import {
    getExpiringProductsReport,
    getExpiredProductsReport,
    getStockReport,
    getSalesReport
} from '../controllers/reportController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// Todos los reportes están protegidos para roles Administrativos/Farmacéuticos
router.use(authenticateToken);
router.use(authorizeRole(['admin', 'farmaceutico']));

router.get('/expiring', getExpiringProductsReport);
router.get('/expired', getExpiredProductsReport);
router.get('/stock', getStockReport);
router.get('/sales-summary', getSalesReport);

export default router;
