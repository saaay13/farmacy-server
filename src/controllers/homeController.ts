import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getHome = (req: Request, res: Response) => {
    res.json({ message: 'Welcome to Store Farmacy API', status: 'success' });
};

export const getCategories = async (req: Request, res: Response) => {
    try {
        console.log('Fetching categories...');
        const categories = await prisma.categoria.findMany();
        res.json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error: any) {
        console.error('DB Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
