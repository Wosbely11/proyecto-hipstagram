import express, { Request, Response } from 'express';
import cors from 'cors';
import pool from './db';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Definimos qué esperamos recibir
interface ModerationRequest {
    hashtags: string[];
    publicacion_id: string;
}

const BAN_LIST: string[] = ['spam', 'ofensivo', 'ilegal'];

app.post('/validar-hashtags', async (req: Request, res: Response) => {
    const { hashtags, publicacion_id }: ModerationRequest = req.body;
    
    if (!hashtags || !publicacion_id) {
        return res.status(400).json({ error: "Faltan datos para la moderación" });
    }

    const tieneProhibidos = hashtags.some(tag => BAN_LIST.includes(tag.toLowerCase()));

    try {
        if (tieneProhibidos) {
            await pool.query(
                "UPDATE publicaciones SET estado_moderacion = 'BLOQUEADO' WHERE id = $1",
                [publicacion_id]
            );
            console.log(`🚫 Post ${publicacion_id} bloqueado por contenido inapropiado.`);
            return res.json({ aprobado: false, message: "Contenido bloqueado por hashtags prohibidos" });
        }
        
        res.json({ aprobado: true });
    } catch (err: any) {
        console.error("❌ Error en Moderación:", err.message);
        res.status(500).send("Error en el proceso de moderación");
    }
});

const PORT = process.env.PORT || 3008;
app.listen(PORT, () => {
    console.log(`🛡️ Moderation-Service en TS corriendo en puerto ${PORT}`);
});