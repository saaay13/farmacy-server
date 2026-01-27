import { Router } from 'express';
import { getSucursales, createSucursal, updateSucursal, deleteSucursal } from '../controllers/banchController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// Rutas públicas (listar sucursales)
router.get('/', getSucursales);

// Rutas protegidas (solo admin puede gestionar sucursales)
router.post('/', authenticateToken, authorizeRole(['admin']), createSucursal);
router.put('/:id', authenticateToken, authorizeRole(['admin']), updateSucursal);
router.delete('/:id', authenticateToken, authorizeRole(['admin']), deleteSucursal);

export default router;
