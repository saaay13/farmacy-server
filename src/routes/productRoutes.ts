import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/productController';
import { authenticateToken, authorizeRole, optionalAuthenticate } from '../middleware/authMiddleware';

const router = Router();

// Rutas públicas pero sensibles al rol (Listado y Detalle)
router.get('/', optionalAuthenticate, getProducts);
router.get('/:id', optionalAuthenticate, getProductById);

// Rutas protegidas (Solo Admin y Farmacéutico pueden modificar productos)
router.post('/', authenticateToken, authorizeRole(['admin', 'farmaceutico']), createProduct);
router.put('/:id', authenticateToken, authorizeRole(['admin', 'farmaceutico']), updateProduct);
router.delete('/:id', authenticateToken, authorizeRole(['admin', 'farmaceutico']), deleteProduct);

export default router;
