import { Router } from 'express';
import { createSale, getSales, getSaleById } from '../controllers/saleController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// Rutas protegidas
// Clientes solo pueden ver sus ventas (o nada por ahora), vendedores/admin pueden todo
router.get('/', authenticateToken, authorizeRole(['admin', 'farmaceutico', 'vendedor']), getSales);
router.get('/:id', authenticateToken, authorizeRole(['admin', 'farmaceutico', 'vendedor']), getSaleById);

// Registro de venta: Cualquier usuario autenticado puede intentar, el controlador valida la receta
router.post('/', authenticateToken, createSale);

export default router;
