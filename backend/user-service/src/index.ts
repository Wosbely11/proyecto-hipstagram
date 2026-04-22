import express, { Response } from 'express';
import cors from 'cors';
import axios from 'axios';
import pool from './db';
import verificarToken, { AuthRequest } from './authMiddleware';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// --- VER PERFIL ---
app.get('/perfil/:id', verificarToken, async (req: AuthRequest, res: Response) => {
    try {
        const user = await pool.query(
            "SELECT id, username, email, rol, activo, fecha_creacion FROM usuarios WHERE id = $1",
            [req.params.id]
        );
        if (user.rows.length === 0) return res.status(404).send("Usuario no encontrado");
        res.json(user.rows[0]);
    } catch (err) {
        res.status(500).send("Error al obtener perfil");
    }
});

// --- STATUS (Solo ADMIN) ---
app.put('/admin/status', verificarToken, async (req: AuthRequest, res: Response) => {
    const { usuario_id, activo } = req.body;

    if (req.user?.rol !== 'ADMIN') {
        return res.status(403).send("Acceso denegado: Se requiere rol de ADMIN");
    }

    try {
        await pool.query(
            "UPDATE usuarios SET activo = $1 WHERE id = $2",
            [activo, usuario_id]
        );

        res.json({ message: `Usuario ${activo ? 'activado' : 'desactivado'} correctamente` });

        // Comunicación asíncrona con Audit-Service
        axios.post('http://audit-service:3003/log', {
            usuario_id: req.user.id,
            accion: activo ? 'ACTIVAR_USUARIO' : 'DESACTIVAR_USUARIO',
            detalles: `Admin cambió estado de usuario ${usuario_id} a ${activo}`,
            ip_origen: req.ip
        }).catch(err => console.error("Error enviando a auditoría:", err.message));

    } catch (err) {
        res.status(500).send("Error al actualizar estado");
    }
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
    console.log(`👤 User-Service en TS corriendo en puerto ${PORT}`);
});