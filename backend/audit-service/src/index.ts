// src/index.ts
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import pool from './config/db';
import verificarToken, { AuthRequest } from './authMiddleware';
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
// --- OBTENER LOGS DE AUDITORÍA (Solo ADMIN) ---
// El API Gateway enviará las peticiones de /audit hacia aquí ('/')
app.get('/', verificarToken, async (req: AuthRequest, res: Response) => {
    // Verificamos que sea un Administrador
    if (req.user?.rol !== 'ADMIN') {
        return res.status(403).json({ message: "Acceso denegado: Solo para administradores" });
    }

    try {
        // Traemos los últimos 100 movimientos, del más reciente al más antiguo
        const result = await pool.query(`
            SELECT id, usuario_id, accion, detalles, ip_origen, fecha_accion 
            FROM auditoria 
            ORDER BY fecha_accion DESC 
            LIMIT 100
        `);
        res.json(result.rows);
    } catch (err: any) {
        console.error("Error obteniendo auditoría:", err.message);
        res.status(500).json({ error: "Error interno al obtener los logs" });
    }
});
const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
    console.log(`🚀 Audit Service en TypeScript corriendo en puerto ${PORT}`);
});