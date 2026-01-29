import { Request, Response } from 'express';
import prisma from '../config/prisma';

// Listar usuarios
export const getUsers = async (req: Request, res: Response) => {
    try {
        const { rol, includeDeactivated } = req.query;
        const requesterRole = (req as any).user.rol;

        const users = await prisma.usuario.findMany({
            where: {
                rol: rol ? String(rol) : undefined,
                activo: includeDeactivated === 'true' ? undefined : true
            },
            select: {
                id: true,
                nombre: true,
                email: true,
                rol: true,
                avatarUrl: true,
                activo: true
            },
            orderBy: { nombre: 'asc' }
        });

        res.json({ success: true, count: users.length, data: users });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Eliminar usuario
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const requesterId = (req as any).user.id;
        const requesterRole = (req as any).user.rol;

        if (id === requesterId) {
            return res.status(400).json({ success: false, message: 'No puedes eliminar tu propia cuenta' });
        }

        const targetUser = await prisma.usuario.findFirst({ where: { id: String(id), activo: true } });
        if (!targetUser) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

        // Lógica de seguridad
        if (requesterRole !== 'admin' && targetUser.rol !== 'cliente') {
            return res.status(403).json({ success: false, message: 'No tienes permisos para eliminar personal administrativo' });
        }

        await prisma.usuario.update({
            where: { id: String(id) },
            data: { activo: false }
        });
        res.json({ success: true, message: 'Usuario eliminado exitosamente' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Crear usuario
export const createUser = async (req: Request, res: Response) => {
    try {
        const { nombre, email, password, rol } = req.body;
        const requesterRole = (req as any).user.rol;

        // Lógica de seguridad
        const finalRol = requesterRole === 'admin' ? rol : 'cliente';

        const existingUser = await prisma.usuario.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'El correo electrónico ya está registrado' });
        }

        const newUser = await prisma.usuario.create({
            data: {
                nombre,
                email,
                password: password || '123456',
                rol: finalRol
            },
            select: { id: true, nombre: true, email: true, rol: true }
        });

        res.status(201).json({ success: true, data: newUser });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Actualizar usuario
export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { nombre, email, rol, avatarUrl, password } = req.body;
        const requesterRole = (req as any).user.rol;
        const requesterId = (req as any).user.id;

        const targetUser = await prisma.usuario.findUnique({ where: { id: String(id) } });
        if (!targetUser) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

        // Lógica de seguridad
        const isSelfUpdate = requesterId === id;

        if (requesterRole !== 'admin' && !isSelfUpdate) {
            if (targetUser.rol !== 'cliente') {
                return res.status(403).json({ success: false, message: 'No puedes editar perfiles de personal' });
            }
        }

        const updateData: any = {
            nombre,
            email,
            avatarUrl,
            // Asignación de rol
            rol: requesterRole === 'admin' && !isSelfUpdate ? rol : targetUser.rol
        };

        // Hasheo de password
        if (password && password.trim() !== '') {
            const bcrypt = require('bcryptjs'); // Lazy load or import at top if possible
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.usuario.update({
            where: { id: String(id) },
            data: updateData,
            select: { id: true, nombre: true, email: true, rol: true, avatarUrl: true }
        });

        res.json({ success: true, data: updatedUser });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Actualizar rol
export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { rol } = req.body;

        const updatedUser = await prisma.usuario.update({
            where: { id: String(id) },
            data: { rol },
            select: { id: true, nombre: true, rol: true }
        });

        res.json({ success: true, data: updatedUser });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
// Restaurar usuario
export const restoreUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const requesterRole = (req as any).user.rol;

        if (requesterRole !== 'admin') {
            return res.status(403).json({ success: false, message: 'Solo los administradores pueden restaurar cuentas' });
        }

        const targetUser = await prisma.usuario.findFirst({ where: { id: String(id) } });
        if (!targetUser) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

        if (targetUser.activo) {
            return res.status(400).json({ success: false, message: 'El usuario ya está activo' });
        }

        const restoredUser = await prisma.usuario.update({
            where: { id: String(id) },
            data: { activo: true },
            select: { id: true, nombre: true, email: true, rol: true, activo: true }
        });

        res.json({ success: true, message: 'Usuario restaurado exitosamente', data: restoredUser });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
