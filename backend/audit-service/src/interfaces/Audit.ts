export interface IAuditRecord {
    usuario_id: string | null;
    accion: string;
    detalles: string;
    ip_origen?: string;
    request_id?: string;
    actor_role?: string;
    entity_type?: string;
    entity_id?: string;
    result?: string;
}