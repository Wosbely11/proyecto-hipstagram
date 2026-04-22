import express, { Request, Response } from 'express';
import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import cors from 'cors';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());

// 1. Configuración del Cliente S3 (v3) con Tipado
const s3 = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY || '',
        secretAccessKey: process.env.AWS_SECRET_KEY || '',
    },
});

// 2. Configuración de Multer-S3
// Tipamos 'upload' para que reconozca los métodos de Multer
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME || 'hipstagram-bucket',
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            const fileName = `posts/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
            cb(null, fileName);
        }
    })
});

// 3. Endpoint de Subida
app.post('/upload', upload.single('image'), (req: Request, res: Response) => {
    // En multer-s3, el archivo subido viene con la propiedad 'location'
    const file = req.file as any; 

    if (!file) {
        return res.status(400).json({ error: "No se pudo subir la imagen" });
    }

    res.json({
        message: "Imagen subida exitosamente a S3",
        url: file.location, // Esta es la URL pública que guardaremos en el Post Service
        key: file.key
    });
});

const PORT = process.env.PORT || 3007;
app.listen(PORT, () => {
    console.log(`☁️ Media-Service (S3 v3) corriendo en puerto ${PORT}`);
});