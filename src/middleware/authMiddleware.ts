import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_change_me_in_prod';

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.status(401).json({ status: 'error', message: 'Acceso denegado: Falta token' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.status(403).json({ status: 'error', message: 'Token inválido o expirado' });
        req.user = user;
        next();
    });
};

export const authorizeRole = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) return res.status(401).json({ status: 'error', message: 'No autenticado' });

        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({
                status: 'error',
                message: `Acceso prohibido: Se requiere rol [${roles.join(', ')}]`
            });
        }
        next();
    };
};
