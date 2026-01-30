import { Router } from 'express';
import {
    getBlockedAttempts,
    getBlockedAttemptStats,
    getBlockedAttemptsByVendedor,
    getRecentBlockedAttempts
} from '../controllers/blockedAttemptController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// Solo admin y farmacéuticos pueden ver intentos bloqueados (auditoría)
router.get(
    '/',
    authenticateToken,
    authorizeRole(['admin', 'farmaceutico']),
    getBlockedAttempts
);

router.get(
    '/stats',
    authenticateToken,
    authorizeRole(['admin', 'farmaceutico']),
    getBlockedAttemptStats
);

router.get(
    '/recent',
    authenticateToken,
    authorizeRole(['admin', 'farmaceutico']),
    getRecentBlockedAttempts
);

router.get(
    '/vendedor/:id',
    authenticateToken,
    authorizeRole(['admin', 'farmaceutico']),
    getBlockedAttemptsByVendedor
);

export default router;
