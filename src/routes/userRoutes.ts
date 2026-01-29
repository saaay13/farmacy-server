import { Router } from 'express';
import { getUsers, deleteUser, updateUserRole, createUser, updateUser } from '../controllers/userController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// Las rutas de usuarios están ahora protegidas por lógica interna en el controller
// para que roles no-admin solo puedan interactuar con cuentas tipo 'cliente'
router.use(authenticateToken);
router.use(authorizeRole(['admin', 'farmaceutico', 'vendedor']));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);

export default router;
