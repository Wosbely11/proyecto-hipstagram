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

// --- RUTA: VOTAR (LIKE / UNLIKE) ---
app.post('/voto', verificarToken, async (req: AuthRequest, res: Response) => {
    const { publicacion_id, tipo_voto } = req.body; 
    const usuario_id = req.user?.id;

    try {
        if (tipo_voto === -1) {
            // LÓGICA TIPO INSTAGRAM: Si manda -1 (Unlike), ELIMINAMOS su voto previo
            await pool.query(
                "DELETE FROM votos WHERE usuario_id = $1 AND publicacion_id = $2",
                [usuario_id, publicacion_id]
            );
            
            res.json({ message: "Like removido correctamente" });

            // Registrar en auditoría que quitó el like
            axios.post('http://audit-service:3003/log', {
                usuario_id,
                accion: 'QUITAR_LIKE',
                detalles: `Usuario quitó su like en post ${publicacion_id}`,
                ip_origen: req.ip
            }).catch(err => console.error("Error en auditoría:", err.message));

        } else {
            // LÓGICA TIPO INSTAGRAM: Si manda 1 (Like), insertamos. 
            // Si ya le había dado like (ON CONFLICT), lo ignoramos para no sumar doble.
            await pool.query(
                `INSERT INTO votos (usuario_id, publicacion_id, tipo_voto) 
                 VALUES ($1, $2, 1) 
                 ON CONFLICT (usuario_id, publicacion_id) DO NOTHING`,
                [usuario_id, publicacion_id]
            );

            res.json({ message: "Like registrado correctamente" });

            // Registrar en auditoría que dio like
            axios.post('http://audit-service:3003/log', {
                usuario_id,
                accion: 'DAR_LIKE',
                detalles: `Usuario dio like en post ${publicacion_id}`,
                ip_origen: req.ip
            }).catch(err => console.error("Error en auditoría:", err.message));
        }

    } catch (err: any) {
        console.error("❌ Error de BD al votar:", err.message); 
        res.status(500).json({ error: "Error al procesar el voto" });
    }
});

// --- RUTA: COMENTAR ---
app.post('/comentar', verificarToken, async (req: AuthRequest, res: Response) => {
    const { publicacion_id, texto } = req.body;
    const usuario_id = req.user?.id;

    console.log(`📝 Recibiendo comentario: "${texto}" para post: ${publicacion_id}`);

    // --- NUEVA VALIDACIÓN: Límite de 128 caracteres ---
    if (!texto || typeof texto !== 'string') {
        return res.status(400).json({ error: "El comentario no puede estar vacío" });
    }

    if (texto.length > 128) {
        return res.status(400).json({ 
            error: `El comentario excede el límite permitido. Máximo 128 caracteres (Ingresado: ${texto.length})` 
        });
    }
    // --------------------------------------------------

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