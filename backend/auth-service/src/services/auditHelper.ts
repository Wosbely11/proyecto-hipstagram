import axios from 'axios';

const AUDIT_SERVICE_URL = process.env.AUDIT_SERVICE_URL || 'http://localhost:3003/log';

// IMPORTANTE: El 'export' adelante es lo que permite que el controlador lo encuentre
export const sendToAudit = async (usuario_id: string, accion: string, detalles: string) => {
    try {
        await axios.post(AUDIT_SERVICE_URL, {
            usuario_id,
            accion,
            detalles,
            ip_origen: 'auth-service'
        });
    } catch (error) {
        console.error('❌ Error de conexión con Audit Service:', error);
    }
};