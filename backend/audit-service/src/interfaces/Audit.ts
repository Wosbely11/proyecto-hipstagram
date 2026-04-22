export interface IAuditRecord {
    //usuario_id: number;
    usuario_id: string;   // <--- Cambiado de number a string para soportar UUID
    accion: string;
    detalles: string;
    ip_origen?: string;
    fecha_creacion?: Date;
}