import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

router.get('/me', authenticateToken, (req: any, res) => {
    res.json({ status: 'success', user: req.user });
});

export default router;
