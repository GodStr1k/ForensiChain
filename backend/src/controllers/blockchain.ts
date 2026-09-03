import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const txs = await prisma.blockchainTransaction.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    res.status(200).json({ transactions: txs });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const tx = await prisma.blockchainTransaction.findUnique({ where: { id: req.params.id } });
    if (!tx) { res.status(404).json({ error: 'Transaction not found' }); return; }
    res.status(200).json({ transaction: tx });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEvidenceTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const txs = await prisma.blockchainTransaction.findMany({
      where: { evidenceId: req.params.evidenceId },
      orderBy: { timestamp: 'asc' },
    });
    res.status(200).json({ transactions: txs });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const retryTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const tx = await prisma.blockchainTransaction.findUnique({ where: { id: req.params.id } });
    if (!tx) { res.status(404).json({ error: 'Transaction not found' }); return; }
    // Mark as pending again for retry
    const updated = await prisma.blockchainTransaction.update({
      where: { id: req.params.id },
      data: { status: 'PENDING' },
    });
    res.status(200).json({ transaction: updated, message: 'Retry queued' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
