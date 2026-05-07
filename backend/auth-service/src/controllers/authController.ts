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

        const user: IUser = result.rows[0];

        if (!user.activo) {
            return res.status(403).json({ message: "Tu cuenta ha sido deshabilitada. Contacta al administrador." });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ message: "Credenciales incorrectas" });
        }

        // --- REGISTRO EN AUDITORÍA ---
        // Usamos user.id que es el UUID de tu DB
        //await sendToAudit(user.id!, 'LOGIN_EXITOSO', `Sesión iniciada por ${user.username}`);
        // --- REGISTRO EN AUDITORÍA ---
        // Usamos .toString() o simplemente aseguramos que sea string
        await sendToAudit(user.id!.toString(), 'LOGIN_EXITOSO', `Sesión iniciada por ${user.username}`);

        const token = jwt.sign(
            { id: user.id, rol: user.rol },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '2h' }
        );

        res.json({ token, user: { username: user.username, rol: user.rol } });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};