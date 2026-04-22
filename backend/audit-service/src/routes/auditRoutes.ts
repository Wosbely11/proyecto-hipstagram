import { Router } from 'express';
import { createAuditLog } from '../controllers/auditController';

const router = Router();

router.post('/log', createAuditLog);

export default router;