import { Request, Response } from 'express';
import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_change_me_in_prod';

export const register = async (req: Request, res: Response) => {
    try {
        const { nombre, email, password, rol } = req.body;

        // Check if user exists
        const existingUser = await prisma.usuario.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ status: 'error', message: 'El usuario ya existe' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.usuario.create({
            data: {
                nombre,
                email,
                password: hashedPassword,
                rol // admin, farmaceutico, vendedor, cliente
            }
        });

        res.status(201).json({ status: 'success', message: 'Usuario creado exitosamente', data: { id: user.id, email: user.email } });
    } catch (error: any) {
        console.error('Registration Error:', error);
        res.status(500).json({ status: 'error', message: 'Error al registrar usuario', error: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await prisma.usuario.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ status: 'error', message: 'Credenciales inválidas' });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(400).json({ status: 'error', message: 'Credenciales inválidas' });
        }

        // Generate Token
        const token = jwt.sign(
            { id: user.id, email: user.email, rol: user.rol },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            status: 'success',
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                email: user.email,
                rol: user.rol,
                nombre: user.nombre
            }
        });
    } catch (error: any) {
        console.error('Login Error:', error);
        res.status(500).json({ status: 'error', message: 'Error en login', error: error.message });
    }
};
