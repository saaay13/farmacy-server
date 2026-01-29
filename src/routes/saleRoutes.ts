import { Router } from 'express';
import { createSale, getSales, getSaleById } from '../controllers/saleController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// Rutas protegidas
// Historial de ventas
router.get('/', authenticateToken, authorizeRole(['admin', 'farmaceutico', 'vendedor']), getSales);
router.get('/:id', authenticateToken, authorizeRole(['admin', 'farmaceutico', 'vendedor']), getSaleById);

// Registro de venta
router.post('/', authenticateToken, createSale);

export default router;
