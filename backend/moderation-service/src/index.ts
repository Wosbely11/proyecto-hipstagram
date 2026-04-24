import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import verificarToken, { AuthRequest } from './authMiddleware';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Ruta donde se guardará nuestro archivo JSON físico
const FILE_PATH = path.join(__dirname, 'bannedWords.json');

// Función ayudante: Lee el archivo JSON
const readWords = (): string[] => {
    // Si el archivo no existe, lo creamos con algunas palabras de ejemplo
    if (!fs.existsSync(FILE_PATH)) {
        fs.writeFileSync(FILE_PATH, JSON.stringify(['spam', 'fraude', 'insulto_ejemplo']));
    }
    const data = fs.readFileSync(FILE_PATH, 'utf-8');
    return JSON.parse(data);
};

// Función ayudante: Escribe en el archivo JSON
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
    
    // Antes: const lowerWord = palabra.toLowerCase().trim();
    const lowerWord = String(palabra).toLowerCase().trim();//limpia la palabra

    // Evitamos duplicados
    if (!words.includes(lowerWord)) {
        words.push(lowerWord);
        writeWords(words);
    }
    res.json({ message: "Palabra agregada", palabras: words });
});

// --- RUTA: ELIMINAR PALABRA ---
app.delete('/words/:word', verificarToken, (req: AuthRequest, res: Response) => {
    if (req.user?.rol !== 'ADMIN') return res.status(403).json({ message: "Acceso denegado" });
    
    // Antes: const wordToDelete = req.params.word.toLowerCase();
    const wordToDelete = String(req.params.word).toLowerCase();
    let words = readWords();
    
    // Filtramos la lista para quitar la palabra seleccionada
    words = words.filter(w => w !== wordToDelete);
    writeWords(words);
    
    res.json({ message: "Palabra eliminada", palabras: words });
});

const PORT = process.env.PORT || 3008;
app.listen(PORT, () => {
    console.log(`🛡️ Moderation-Service corriendo en puerto ${PORT}`);
});