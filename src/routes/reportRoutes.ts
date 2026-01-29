import { Router } from 'express';
import {
    getExpiringProductsReport,
    getExpiredProductsReport,
    getStockReport,
    getSalesReport,
    getSalesByProductReport
} from '../controllers/reportController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// Todos los reportes están protegidos para roles Administrativos/Farmacéuticos
router.use(authenticateToken);
router.use(authorizeRole(['admin', 'farmaceutico', 'vendedor']));

router.get('/expiring', getExpiringProductsReport);
router.get('/expired', getExpiredProductsReport);
router.get('/stock', getStockReport);
router.get('/sales-summary', getSalesReport);
router.get('/sales-by-product', getSalesByProductReport);

export default router;
