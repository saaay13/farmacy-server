import { Request, Response } from 'express';
import { ReplenishmentService } from '../services/ReplenishmentService';


//Obtiene sugerencias inteligentes de reabastecimiento

export const getReplenishmentSuggestions = async (req: Request, res: Response) => {
    try {
        const suggestions = await ReplenishmentService.getSuggestions();
        res.json({
            success: true,
            count: suggestions.length,
            data: suggestions
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

//Obtiene el reporte consolidado de productos en estado crítico
export const getCriticalProductsReport = async (req: Request, res: Response) => {
    try {
        const report = await ReplenishmentService.getCriticalReport();
        res.json({
            success: true,
            data: report
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
