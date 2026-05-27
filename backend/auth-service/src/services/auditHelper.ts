import axios from 'axios';

const AUDIT_SERVICE_URL = process.env.AUDIT_SERVICE_URL || 'http://localhost:3003/log';

// Agregamos 'correlationId' como parámetro opcional al final
export const sendToAudit = async (usuario_id: string, accion: string, detalles: string, correlationId?: string) => {
    try {
        await axios.post(AUDIT_SERVICE_URL, {
            usuario_id,
            accion,
            detalles,
            ip_origen: 'auth-service'
        }, {
            // Agregamos el 'x-correlation-id' a los headers para que el servicio de auditoría pueda rastrear la petición
            headers: {
                'x-correlation-id': correlationId || 'SIN-RASTREO'
            }
        });
    } catch (error) {
        console.error('❌ Error de conexión con Audit Service:', error);
    }
};