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

// --- RUTA: VOTAR (LIKE/DISLIKE) ---
app.post('/voto', verificarToken, async (req: AuthRequest, res: Response) => {
    const { publicacion_id, tipo_voto } = req.body; 
    const usuario_id = req.user?.id;

    try {
        await pool.query(
            `INSERT INTO votos (usuario_id, publicacion_id, tipo_voto) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (usuario_id, publicacion_id) 
             DO UPDATE SET tipo_voto = EXCLUDED.tipo_voto`, // <-- ESTA ES LA CORRECCIÓN MÁGICA
            [usuario_id, publicacion_id, tipo_voto]
        );

        res.json({ message: "Voto registrado/actualizado correctamente" });

        axios.post('http://audit-service:3003/log', {
            usuario_id,
            accion: 'VOTO_PUBLICACION',
            detalles: `Usuario votó ${tipo_voto} en post ${publicacion_id}`,
            ip_origen: req.ip
        }).catch(err => console.error("Error en auditoría:", err.message));

    } catch (err: any) {
        console.error("❌ Error de BD al votar:", err.message); // <-- Esto nos dirá qué pasa
        res.status(500).json({ error: "Error al procesar el voto" });
    }
});

// --- RUTA: COMENTAR ---
app.post('/comentar', verificarToken, async (req: AuthRequest, res: Response) => {
    const { publicacion_id, texto } = req.body;
    const usuario_id = req.user?.id;

    if (!texto || texto.trim().length === 0) {
        return res.status(400).json({ error: "El comentario no puede estar vacío" });
    }
    if (texto.length > 128) {
        return res.status(400).json({ error: "El comentario no puede superar los 128 caracteres" });
    }

    console.log(`📝 Recibiendo comentario: "${texto}" para post: ${publicacion_id}`);

    try {
        const nuevoComentario = await pool.query(
            "INSERT INTO comentarios (usuario_id, publicacion_id, texto) VALUES ($1, $2, $3) RETURNING *",
            [usuario_id, publicacion_id, texto]
        );

        res.json(nuevoComentario.rows[0]);

        axios.post('http://audit-service:3003/log', {
            usuario_id,
            accion: 'COMENTAR_POST',
            detalles: `Usuario comentó: ${texto.substring(0, 30)}...`,
            ip_origen: req.ip
        }).catch(err => console.error("Error en auditoría:", err.message));

    } catch (err: any) {
        console.error("❌ Error de BD al guardar comentario:", err.message); // <-- Esto nos dirá qué pasa
        res.status(500).json({ error: "Error al guardar comentario" });
    }
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
    console.log(`💬 Interaction-Service en TS corriendo en puerto ${PORT}`);
});