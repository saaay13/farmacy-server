import { Router } from 'express';
import { getBatches, createBatch, deleteBatch, restoreBatch } from '../controllers/batchController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// Rutas protegidas (Solo Admin y Farmacéutico)
router.get('/', authenticateToken, authorizeRole(['admin', 'farmaceutico', 'vendedor']), getBatches);
router.post('/', authenticateToken, authorizeRole(['admin', 'farmaceutico']), createBatch);
router.delete('/:id', authenticateToken, authorizeRole(['admin', 'farmaceutico']), deleteBatch);
router.patch('/:id/restore', authenticateToken, authorizeRole(['admin', 'farmaceutico']), restoreBatch);

export default router;
