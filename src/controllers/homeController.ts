import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.categoria.findMany();
        res.json({ success: true, count: categories.length, data: categories });
    } catch (error: any) {
        console.error('DB Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
