import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import routes from './routes';
import { AutomationService } from './services/AutomationService';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api', routes);

// Iniciar servicios automáticos (Cron Jobs)
AutomationService.init();

app.get('/', (req, res) => {
    res.send('Store Farmacy Server Running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
