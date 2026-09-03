import { Router } from 'express';
import { getTransactions, getTransaction, getEvidenceTransactions, retryTransaction } from '../controllers/blockchain';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/transactions', getTransactions);
router.get('/transactions/:id', getTransaction);
router.get('/evidence/:evidenceId', getEvidenceTransactions);
router.post('/retry/:id', retryTransaction);

export default router;
