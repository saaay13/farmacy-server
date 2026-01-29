import { Request, Response } from 'express';
import prisma from '../config/prisma';

// Listar todos los usuarios (Personal + Clientes) con soporte de filtros
export const getUsers = async (req: Request, res: Response) => {
    try {
        const { rol } = req.query;
        const requesterRole = (req as any).user.rol;

        // Si no es admin y pide todos, limitamos por seguridad o según necesidad de negocio
        // Para el POS, los vendedores necesitan ver 'clientes'.
        const users = await prisma.usuario.findMany({
            where: {
                rol: rol ? String(rol) : undefined
            },
            select: {
                id: true,
                nombre: true,
                email: true,
                rol: true,
                avatarUrl: true
            },
            orderBy: { nombre: 'asc' }
        });

        res.json({ success: true, count: users.length, data: users });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Eliminar un usuario (Protección: No-admin solo elimina clientes)
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const requesterId = (req as any).user.id;
        const requesterRole = (req as any).user.rol;

        if (id === requesterId) {
            return res.status(400).json({ success: false, message: 'No puedes eliminar tu propia cuenta' });
        }

        const targetUser = await prisma.usuario.findUnique({ where: { id: String(id) } });
        if (!targetUser) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

        // Lógica de seguridad: Solo admin borra personal. Vendedores solo borran clientes.
        if (requesterRole !== 'admin' && targetUser.rol !== 'cliente') {
            return res.status(403).json({ success: false, message: 'No tienes permisos para eliminar personal administrativo' });
        }

        await prisma.usuario.delete({ where: { id: String(id) } });
        res.json({ success: true, message: 'Usuario eliminado exitosamente' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Crear un nuevo usuario (Protección: No-admin solo crea clientes)
export const createUser = async (req: Request, res: Response) => {
    try {
        const { nombre, email, password, rol } = req.body;
        const requesterRole = (req as any).user.rol;

        // Seguridad: Si no es admin, solo puede crear 'cliente'
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

// Actualizar usuario completo (Protección: No-admin solo actualiza clientes)
export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { nombre, email, rol, avatarUrl } = req.body;
        const requesterRole = (req as any).user.rol;

        const targetUser = await prisma.usuario.findUnique({ where: { id: String(id) } });
        if (!targetUser) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

        // Lógica de seguridad
        if (requesterRole !== 'admin') {
            if (targetUser.rol !== 'cliente') {
                return res.status(403).json({ success: false, message: 'No puedes editar perfiles de personal' });
            }
        }

        const updatedUser = await prisma.usuario.update({
            where: { id: String(id) },
            data: {
                nombre,
                email,
                rol: requesterRole === 'admin' ? rol : targetUser.rol, // Vendedor no cambia roles
                avatarUrl
            },
            select: { id: true, nombre: true, email: true, rol: true, avatarUrl: true }
        });

        res.json({ success: true, data: updatedUser });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Actualizar rol de usuario (por si se quiere promover a alguien)
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
