import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.get('/', (req, res) => {
    res.send('Store Farmacy Server Running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
