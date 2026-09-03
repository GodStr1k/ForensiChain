import { Router } from 'express';
import { createCase, getCases, getCase, updateCase } from '../controllers/cases';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createCase);
router.get('/', getCases);
router.get('/:id', getCase);
router.put('/:id', updateCase);

export default router;
