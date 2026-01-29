import { Router } from 'express';
import { getUsers, deleteUser, updateUserRole, createUser, updateUser, restoreUser } from '../controllers/userController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// Gestión de usuarios
router.use(authenticateToken);
router.use(authorizeRole(['admin', 'farmaceutico', 'vendedor']));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);
router.patch('/:id/restore', restoreUser);

export default router;
