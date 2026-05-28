import express, { Response } from 'express';
import cors from 'cors';
import pool from './db';
import * as dotenv from 'dotenv';
// Nota: Puedes importar verificarToken si quieres que solo usuarios logueados busquen

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// --- RUTA: BUSCAR POSTS POR TEXTO O HASHTAG ---
// El API Gateway manda /search/posts hacia aquí, por defecto llega como /posts
app.get('/posts', async (req, res: Response) => {
    const termino = req.query.q as string;

    if (!termino) {
        return res.status(400).json({ error: "Debe enviar un término de búsqueda" });
    }

    try {
        // Usamos la misma mega-consulta del feed, pero agregamos un WHERE con ILIKE
        // ILIKE busca el texto sin importar mayúsculas/minúsculas. 
        // Si el usuario busca "#viaje", encontrará las descripciones que tengan "#viaje".
        const searchQuery = `%${termino}%`;

        const result = await pool.query(`
            SELECT 
                p.id, 
                p.usuario_id, 
                p.url_imagen, 
                p.descripcion, 
                p.fecha_publicacion, 
                u.username,
                COALESCE((SELECT SUM(tipo_voto) FROM votos WHERE publicacion_id = p.id), 0) AS likes,
                COALESCE((
                    SELECT json_agg(json_build_object('texto', c.texto, 'username', cu.username))
                    FROM comentarios c
                    JOIN usuarios cu ON c.usuario_id = cu.id
                    WHERE c.publicacion_id = p.id
                ), '[]'::json) AS comentarios
            FROM publicaciones p
            LEFT JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.descripcion ILIKE $1
               OR EXISTS (
                   SELECT 1 FROM comentarios c WHERE c.publicacion_id = p.id AND c.texto ILIKE $1
               )
            ORDER BY p.fecha_publicacion DESC
        `, [searchQuery]);

        res.json(result.rows);
    } catch (err: any) {
        console.error("Error en la búsqueda:", err.message);
        res.status(500).json({ error: "Error interno al buscar publicaciones" });
    }
});

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
    console.log(`🔎 Search-Service corriendo en puerto ${PORT}`);
});