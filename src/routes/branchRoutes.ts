import { Router } from 'express';
import { getSucursales, createSucursal, updateSucursal, deleteSucursal, restoreSucursal } from '../controllers/branchController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// Rutas públicas (listar sucursales)
router.get('/', getSucursales);

// Rutas protegidas (solo admin puede gestionar sucursales)
router.post('/', authenticateToken, authorizeRole(['admin']), createSucursal);
router.put('/:id', authenticateToken, authorizeRole(['admin']), updateSucursal);
router.delete('/:id', authenticateToken, authorizeRole(['admin']), deleteSucursal);
router.patch('/:id/restore', authenticateToken, authorizeRole(['admin']), restoreSucursal);

export default router;
