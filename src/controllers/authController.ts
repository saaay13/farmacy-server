import { Request, Response } from 'express';
import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UsuarioModel } from '../models/Usuario';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_change_me_in_prod';

export const register = async (req: Request, res: Response) => {
    try {
        const { nombre, email, password, avatarUrl } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ status: 'error', message: 'Faltan campos obligatorios' });
        }

        // Check if user exists
        const existingUser = await prisma.usuario.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ status: 'error', message: 'El usuario ya existe' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user - Siempre con rol 'cliente' para registros públicos
        const user = await prisma.usuario.create({
            data: {
                nombre,
                email,
                password: hashedPassword,
                rol: 'cliente',
                avatarUrl: avatarUrl || null
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
        const user = await prisma.usuario.findFirst({ where: { email, activo: true } });
        if (!user) {
            return res.status(400).json({ status: 'error', message: 'Credenciales inválidas o cuenta desactivada' });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(400).json({ status: 'error', message: 'Credenciales inválidas' });
        }

        // --- USO DE MODELO POO ---
        const userObj = new UsuarioModel(
            user.id,
            user.nombre,
            user.email,
            user.rol,
            user.password,
            user.avatarUrl
        );

        // Generate Token
        const token = jwt.sign(
            { id: userObj.id, email: userObj.email, rol: userObj.getRol() },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            status: 'success',
            message: 'Login exitoso (Modelo POO)',
            token,
            user: {
                id: userObj.id,
                email: userObj.email,
                rol: userObj.getRol(),
                nombre: userObj.nombre,
                avatarUrl: userObj.avatarUrl,
                esAdmin: userObj.esAdmin()
            }
        });
    } catch (error: any) {
        console.error('Login Error:', error);
        res.status(500).json({ status: 'error', message: 'Error en login', error: error.message });
    }
};
