import express, { Application, Response } from 'express'; // <-- Agregamos Response
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import pool from './config/db'; // <-- Importamos la conexión a PostgreSQL
import verificarToken, { AuthRequest } from './authMiddleware'; // <-- Importamos

dotenv.config();

const app: Application = express();
app.use(express.json());
app.use(cors());

//app.use('/auth', authRoutes);
app.use('/', authRoutes);

// --- RUTA: OBTENER TODOS LOS USUARIOS (SOLO ADMIN) ---
// El API Gateway debería apuntar algo como /users hacia aquí
app.get('/users', verificarToken, async (req: AuthRequest, res: Response) => {
    // Medida extra de seguridad: verificar que quien pide esto sea ADMIN
    if (req.user?.rol !== 'ADMIN') {
        return res.status(403).json({ message: "Acceso denegado: Solo para administradores" });
    }

    try {
        const result = await pool.query(`
            SELECT id, username, email, rol, activo, fecha_creacion 
            FROM usuarios 
            ORDER BY fecha_creacion DESC
        `);
        res.json(result.rows);
    } catch (err: any) {
        console.error("Error obteniendo usuarios:", err.message);
        res.status(500).json({ error: "Error interno al obtener la lista de usuarios" });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Auth Service corriendo en puerto ${PORT}`);
});