import { Request, Response } from 'express';
import pool from '../config/db';
// Importamos la interfaz para validar la estructura del body
import { IAuditRecord } from '../interfaces/Audit'; 

export const createAuditLog = async (req: Request, res: Response): Promise<void> => {
    const { usuario_id, accion, detalles, ip_origen, request_id, actor_role, entity_type, entity_id, result }: IAuditRecord = req.body;

    const ipFinal = ip_origen || req.ip;
    const ipFormateada = (ipFinal === '::1' || ipFinal === '127.0.0.1') ? 'Localhost' : ipFinal;

    try {
        await pool.query(
            `INSERT INTO auditoria
             (usuario_id, accion, detalles, ip_origen, request_id, actor_role, entity_type, entity_id, result)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [usuario_id, accion, detalles, ipFormateada, request_id ?? null, actor_role ?? null, entity_type ?? null, entity_id ?? null, result ?? 'EXITO']
        );
        res.status(201).json({ message: "Registro de auditoría guardado exitosamente" });
    } catch (err: any) {
        console.error("Error en Audit Service:", err.message);
        res.status(500).json({ error: "Error al guardar en la tabla de auditoría" });
    }
};