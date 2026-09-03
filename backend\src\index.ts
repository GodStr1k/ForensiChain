import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import casesRoutes from './routes/cases';
import evidenceRoutes from './routes/evidence';
import blockchainRoutes from './routes/blockchain';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/blockchain', blockchainRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`ForensiChain Backend listening at http://localhost:${port}`);
});
