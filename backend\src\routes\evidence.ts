import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { uploadEvidence, getEvidence, getEvidenceHistory, verifyEvidence, analyzeEvidence, transferEvidence } from '../controllers/evidence';
import { authenticate } from '../middleware/auth';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../..', 'storage'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB

const router = Router();
router.use(authenticate);

router.post('/upload', upload.single('file'), uploadEvidence);
router.get('/:id', getEvidence);
router.get('/:id/history', getEvidenceHistory);
router.post('/:id/verify', upload.single('file'), verifyEvidence);
router.post('/:id/analyze', analyzeEvidence);
router.post('/:id/transfer', transferEvidence);

export default router;
