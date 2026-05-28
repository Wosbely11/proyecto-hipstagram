import express, { Application, Response } from 'express'; // <-- Agregamos Response
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
//import pool from './config/db'; // <-- Importamos la conexión a PostgreSQL
//import verificarToken, { AuthRequest } from './authMiddleware'; // <-- Importamos

dotenv.config();

const app: Application = express();
app.use(express.json());
app.use(cors());

//app.use('/auth', authRoutes);
app.use('/', authRoutes);

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Auth Service corriendo en puerto ${PORT}`);
});