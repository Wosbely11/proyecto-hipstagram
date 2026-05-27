import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import verificarToken, { AuthRequest } from './authMiddleware';
import * as dotenv from 'dotenv';
import AWS from 'aws-sdk'; // IMPORTAMOS AWS

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// CONFIGURACIÓN DE AWS REKOGNITION
const rekognition = new AWS.Rekognition({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
});

// Ruta donde se guardará nuestro archivo JSON físico
const FILE_PATH = path.join(__dirname, 'bannedWords.json');

const readWords = (): string[] => {
    if (!fs.existsSync(FILE_PATH)) {
        fs.writeFileSync(FILE_PATH, JSON.stringify(['spam', 'fraude', 'insulto_ejemplo']));
    }
    const data = fs.readFileSync(FILE_PATH, 'utf-8');
    return JSON.parse(data);
};

const writeWords = (words: string[]) => {
    fs.writeFileSync(FILE_PATH, JSON.stringify(words, null, 2));
};

// --- RUTA: OBTENER PALABRAS ---
app.get('/words', verificarToken, (req: AuthRequest, res: Response) => {
    if (req.user?.rol !== 'ADMIN') return res.status(403).json({ message: "Acceso denegado" });
    res.json(readWords());
});

// --- RUTA: AGREGAR PALABRA ---
app.post('/words', verificarToken, (req: AuthRequest, res: Response) => {
    if (req.user?.rol !== 'ADMIN') return res.status(403).json({ message: "Acceso denegado" });
    const { palabra } = req.body;
    if (!palabra) return res.status(400).json({ message: "La palabra es requerida" });
    const words = readWords();
    const lowerWord = String(palabra).toLowerCase().trim();
    if (!words.includes(lowerWord)) {
        words.push(lowerWord);
        writeWords(words);
    }
    res.json({ message: "Palabra agregada", palabras: words });
});

// --- RUTA: ELIMINAR PALABRA ---
app.delete('/words/:word', verificarToken, (req: AuthRequest, res: Response) => {
    if (req.user?.rol !== 'ADMIN') return res.status(403).json({ message: "Acceso denegado" });
    const wordToDelete = String(req.params.word).toLowerCase();
    let words = readWords();
    words = words.filter(w => w !== wordToDelete);
    writeWords(words);
    res.json({ message: "Palabra eliminada", palabras: words });
});

// MIDDLEWARE DE TRAZABILIDAD (Mantiene el gafete que viene del Gateway)
app.use((req, res, next) => {
    const correlationId = req.headers['x-correlation-id'] || 'SIN-RASTREO';
    console.log(`[TraceID: ${correlationId}] Ejecutando Moderation-Service: ${req.method} ${req.url}`);
    next();
});

// --- RUTA: COMPROBAR TEXTO E IMAGEN (Usada por el post-service) ---
app.post(['/check', '/moderation/check'], async (req: Request, res: Response) => {
    const { text, imageUrl, key } = req.body;
    const correlationId = req.headers['x-correlation-id'] || 'SIN-RASTREO';
    
    console.log(`[TraceID: ${correlationId}] --- PROCESO DE MODERACIÓN ---`);
    
    let isClean = true;
    let details: string[] = [];

    // 1. MODERACIÓN DE TEXTO (Tu lógica original con JSON)
    if (text) {
        const bannedWords = readWords();
        const lowerText = String(text).toLowerCase();
        const badWordFound = bannedWords.find((banned: string) => lowerText.includes(banned.toLowerCase().trim()));
        
        if (badWordFound) {
            console.log(`[TraceID: ${correlationId}] ⚠️ BLOQUEADO TEXTO: Se encontró [${badWordFound}]`);
            isClean = false;
            details.push(`Palabra prohibida encontrada: ${badWordFound}`);
        }
    }

    // 2. MODERACIÓN DE IMAGEN (Con AWS Rekognition)
    // Solo evalúa si nos mandaron una imagen y si el S3 está configurado en el .env
    if (isClean && imageUrl && imageUrl.includes('amazonaws.com') && process.env.AWS_BUCKET_NAME) {
        try {
            // Extraer el nombre real del archivo en S3. 
            // Si le pasaste 'key' desde el post-service, úsalo, sino extráelo de la URL
            const s3ObjectName = key || imageUrl.split('/').pop(); 

            console.log(`[TraceID: ${correlationId}] Analizando imagen en AWS S3: ${s3ObjectName}`);
            
            const params = {
                Image: {
                    S3Object: {
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Name: s3ObjectName
                    }
                },
                MinConfidence: 75 // Sensibilidad del 75%
            };

            const response = await rekognition.detectModerationLabels(params).promise();
            
            if (response.ModerationLabels && response.ModerationLabels.length > 0) {
                console.log(`[TraceID: ${correlationId}] 🚨 BLOQUEADO IMAGEN: AWS detectó contenido inapropiado:`, response.ModerationLabels);
                isClean = false;
                // Guardamos la etiqueta principal (Ej: Explicit Nudity) para el reporte
                details.push(`Contenido visual reportado por IA: ${response.ModerationLabels[0].Name}`);
            } else {
                console.log(`[TraceID: ${correlationId}] ✅ IMAGEN LIMPIA según AWS`);
            }
        } catch (error: any) {
            console.error(`[TraceID: ${correlationId}] ❌ Error conectando con AWS Rekognition:`, error.message);
            // Si falla Amazon, no bloqueamos la app, pero dejamos registro
            details.push('Error al analizar la imagen con IA');
        }
    }

    res.json({ 
        clean: isClean,
        details: details
    });
});

const PORT = process.env.PORT || 3008;
app.listen(PORT, () => {
    console.log(`🛡️ Moderation-Service corriendo en puerto ${PORT}`);
});