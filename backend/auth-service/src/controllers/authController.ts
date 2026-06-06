import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import { IUser } from '../interfaces/User';
import { sendToAudit } from '../services/auditHelper';

export const register = async (req: Request, res: Response) => {
    const { username, email, password, rol } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            "INSERT INTO usuarios (username, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING id, username, email, rol",
            [username, email, hashedPassword, rol || 'USER']
        );

        const createdUser = newUser.rows[0];

        // --- REGISTRO EN AUDITORÍA ---
        await sendToAudit(
            createdUser.id, 
            'REGISTRO_USUARIO', 
            `Nuevo usuario registrado: ${username}`
        );

        res.status(201).json(createdUser);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
        if (result.rows.length === 0) return res.status(401).json({ message: "Credenciales incorrectas" });

        // Nota: Si TypeScript marca error aquí por "activo", asegúrate de agregarlo a tu interface IUser
        const user: any = result.rows[0]; 
        
        // --- NUEVO: BLOQUEO DE SEGURIDAD PARA USUARIOS INACTIVOS ---
        // Verificamos si la columna 'activo' es falsa en la base de datos
        if (user.activo === false) {
            // Opcional: Podrías registrar en auditoría el intento fallido
            return res.status(403).json({ 
                error: "Usuario inactivo",
                message: "El usuario está desactivado. Comuníquese con el administrador."
            });
        }
        // -----------------------------------------------------------

        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            // Opcional: Auditar intentos fallidos
            return res.status(401).json({ message: "Credenciales incorrectas" });
        }

        // --- REGISTRO EN AUDITORÍA ---
        await sendToAudit(user.id!.toString(), 'LOGIN_EXITOSO', `Sesión iniciada por ${user.username}`);

        const token = jwt.sign(
            { id: user.id, rol: user.rol },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '2h' }
        );

        // Agregamos 'activo' a la respuesta JSON por si el frontend lo requiere evaluar
        res.json({ token, user: { username: user.username, rol: user.rol, activo: user.activo } });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};