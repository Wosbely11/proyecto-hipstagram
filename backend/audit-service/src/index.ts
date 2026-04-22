// src/index.ts
import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import auditRoutes from './routes/auditRoutes';

// Cargar variables de entorno
dotenv.config();

const app: Application = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Rutas 
//app.use('/audit', auditRoutes);
app.use('/', auditRoutes);

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
    console.log(`🚀 Audit Service en TypeScript corriendo en puerto ${PORT}`);
});