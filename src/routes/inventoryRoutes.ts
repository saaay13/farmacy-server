import { Router } from 'express';
import { getInventory, getInventoryByProduct } from '../controllers/inventoryController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// Rutas protegidas
router.get('/', authenticateToken, authorizeRole(['admin', 'farmaceutico', 'vendedor']), getInventory);
router.get('/:idProducto', authenticateToken, authorizeRole(['admin', 'farmaceutico', 'vendedor']), getInventoryByProduct);

export default router;
