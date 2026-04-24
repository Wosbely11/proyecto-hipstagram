import express, { Response } from 'express';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import axios from 'axios';
import pool from './db';
import verificarToken, { AuthRequest } from './authMiddleware';
import * as dotenv from 'dotenv';
import AWS from 'aws-sdk';

dotenv.config();

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});


const app = express();
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));


// Configuración de Multer

const storage = multer.memoryStorage();
const upload = multer({ storage });


// --- RUTA: SUBIR POST ---
app.post('/upload', verificarToken, upload.single('image'), async (req: AuthRequest, res: Response) => {
    const { descripcion } = req.body;
    const usuario_id = req.user?.id;
    
    if (!req.file) return res.status(400).send("No se subió ninguna imagen");

    // Parámetros para S3
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME || '',
        Key: `${Date.now()}-${req.file.originalname}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
    };

    try {
        // 1. Subir a AWS
        const s3Response = await s3.upload(params).promise();
        const imageUrl = s3Response.Location;

        // 2. Guardar en Postgres
        const result = await pool.query(
            "INSERT INTO publicaciones (usuario_id, url_imagen, descripcion) VALUES ($1, $2, $3) RETURNING *",
            [usuario_id, imageUrl, descripcion]
        );
        const nuevaPublicacion = result.rows[0];

        // 3. LÓGICA DE HASHTAGS
        // Extraemos palabras que empiezan con # (ej: "#guate #viaje" -> ["guate", "viaje"])
        const palabras = descripcion.split(' ');
        const hashtags = palabras
            .filter((word: string) => word.startsWith('#'))
            .map((tag: string) => tag.replace('#', '').toLowerCase());

        if (hashtags.length > 0) {
            for (const tag of hashtags) {
                // Insertamos el hashtag si no existe
                await pool.query(
                    "INSERT INTO hashtags (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING",
                    [tag]
                );
                
                // Obtenemos su ID
                const tagResult = await pool.query("SELECT id FROM hashtags WHERE nombre = $1", [tag]);
                const tagId = tagResult.rows[0].id;

                // Vinculamos el hashtag a la publicación
                await pool.query(
                    "INSERT INTO publicaciones_hashtags (publicacion_id, hashtag_id) VALUES ($1, $2)",
                    [nuevaPublicacion.id, tagId]
                );
            }

            // 4. LLAMAR A MODERACIÓN
            axios.post('http://moderation-service:3008/validar-hashtags', {
                hashtags: hashtags,
                publicacion_id: nuevaPublicacion.id
            }).catch(e => console.error("⚠️ Error llamando a Moderación:", e.message));
        }

        // 5. ENVIAR RESPUESTA AL USUARIO
        res.json({ message: "Publicación creada exitosamente", post: nuevaPublicacion });

        // 6. NOTIFICAR A AUDITORÍA
        axios.post('http://audit-service:3003/log', {
            usuario_id,
            accion: 'CREAR_POST',
            detalles: `Post creado con ID: ${nuevaPublicacion.id} y ${hashtags.length} hashtags.`,
            ip_origen: req.ip
        }).catch(e => console.error("⚠️ Error en auditoría:", e.message));

    } catch (err: any) {
        console.error("Error crítico:", err);
        res.status(500).json({ error: "Fallo en la subida a S3 o Base de Datos" });
    }
});

// --- RUTA: OBTENER TODOS LOS POSTS (FEED) ---
app.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                p.id, 
                p.usuario_id, 
                p.url_imagen, 
                p.descripcion, 
                p.fecha_publicacion, 
                u.username,
                -- Subconsulta para sumar likes sin romper el GROUP BY
                COALESCE((SELECT SUM(tipo_voto) FROM votos WHERE publicacion_id = p.id), 0) AS likes,
                -- Subconsulta para traer los comentarios en formato de arreglo JSON
                COALESCE((
                    SELECT json_agg(json_build_object('texto', c.texto, 'username', cu.username))
                    FROM comentarios c
                    JOIN usuarios cu ON c.usuario_id = cu.id
                    WHERE c.publicacion_id = p.id
                ), '[]'::json) AS comentarios
            FROM publicaciones p
            LEFT JOIN usuarios u ON p.usuario_id = u.id
            ORDER BY p.fecha_publicacion DESC
        `);
        
        res.json(result.rows);
    } catch (err: any) {
        console.error("Error al obtener feed:", err);
        res.status(500).json({ error: "No se pudo cargar el feed" });
    }
});
// --- RUTA: ELIMINAR POST ---
app.delete('/delete/:id', verificarToken, async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const usuario_id = req.user?.id;

    try {
        const result = await pool.query(
            "DELETE FROM publicaciones WHERE id = $1 AND usuario_id = $2 RETURNING *",
            [id, usuario_id]
        );

        if (result.rowCount === 0) {
            return res.status(403).json({ message: "No autorizado o no existe" });
        }

        res.json({ message: "Publicación eliminada" });

        axios.post('http://audit-service:3003/log', {
            usuario_id,
            accion: 'ELIMINAR_POST',
            detalles: `Eliminado post: ${id}`,
            ip_origen: req.ip
        }).catch(e => console.error(e.message));

    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// --- RUTAS DE MODERACIÓN (Solo ADMIN) ---

// 1. Obtener todas las publicaciones para la tabla del panel
app.get('/admin/moderation', verificarToken, async (req: AuthRequest, res: Response) => {
    if (req.user?.rol !== 'ADMIN') return res.status(403).json({ message: "Acceso denegado" });

    try {
        // Hacemos un JOIN para traer el nombre del usuario junto con la publicación
        const result = await pool.query(`
            SELECT p.id, p.url_imagen, p.descripcion, p.fecha_publicacion, p.estado_moderacion, u.username
            FROM publicaciones p
            JOIN usuarios u ON p.usuario_id = u.id
            ORDER BY p.fecha_publicacion DESC
        `);
        res.json(result.rows);
    } catch (err: any) {
        console.error("Error al obtener publicaciones:", err);
        res.status(500).json({ error: "Error al obtener el historial de publicaciones" });
    }
});

// 2. Cambiar el estado de una publicación (Aprobar / Bloquear)
app.put('/admin/moderation/:id', verificarToken, async (req: AuthRequest, res: Response) => {
    if (req.user?.rol !== 'ADMIN') return res.status(403).json({ message: "Acceso denegado" });
    
    const { estado } = req.body; // Recibimos 'APROBADO' o 'BLOQUEADO'
    const postId = req.params.id;

    try {
        await pool.query(
            "UPDATE publicaciones SET estado_moderacion = $1 WHERE id = $2",
            [estado, postId]
        );

        res.json({ message: `Publicación marcada como ${estado}` });

        // Guardamos el movimiento en la auditoría
        axios.post('http://audit-service:3003/log', {
            usuario_id: req.user.id,
            accion: `POST_${estado}`, // Ej: POST_BLOQUEADO
            detalles: `Admin cambió el estado del post ${postId} a ${estado}`,
            ip_origen: req.ip
        }).catch(err => console.error("Error enviando a auditoría:", err.message));

    } catch (err: any) {
        res.status(500).json({ error: "Error al actualizar el estado de la publicación" });
    }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`📸 Post-Service corriendo en puerto ${PORT}`));