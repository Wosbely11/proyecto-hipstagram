import { Request, Response } from 'express';
import pool from '../config/db';
// Importamos la interfaz para validar la estructura del body
import { IAuditRecord } from '../interfaces/Audit'; 

export const createAuditLog = async (req: Request, res: Response): Promise<void> => {
    // Al asignar el tipo IAuditRecord, TS te avisará si intentas usar una propiedad que no existe
    const { usuario_id, accion, detalles, ip_origen }: IAuditRecord = req.body; 
    
    const ipFinal = ip_origen || req.ip;
    // Si la IP es IPv6 local (::1), la guardamos como 'Localhost' para que sea legible
    const ipFormateada = (ipFinal === '::1' || ipFinal === '127.0.0.1') ? 'Localhost' : ipFinal;

    try {
        await pool.query(
            "INSERT INTO auditoria (usuario_id, accion, detalles, ip_origen) VALUES ($1, $2, $3, $4)",
            [usuario_id, accion, detalles, ipFormateada]
        );
        res.status(201).json({ message: "Registro de auditoría guardado exitosamente" });
    } catch (err: any) {
        console.error("Error en Audit Service:", err.message);
        res.status(500).json({ error: "Error al guardar en la tabla de auditoría" });
    }
};