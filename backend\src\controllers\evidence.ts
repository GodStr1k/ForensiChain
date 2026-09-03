import { Request, Response } from 'express';
import fs from 'fs';
import prisma from '../utils/prisma';
import { hashFile, hashString, buildEventHash } from '../utils/hash';
import { blockchainService } from '../services/blockchain';

// Generate evidence number: EVD-000001
async function generateEvidenceNumber(): Promise<string> {
  const count = await prisma.evidence.count();
  return `EVD-${String(count + 1).padStart(6, '0')}`;
}

// Get the last custody event hash for a given evidence
async function getLastEventHash(evidenceId: string): Promise<string | null> {
  const last = await prisma.custodyEvent.findFirst({
    where: { evidenceId },
    orderBy: { timestamp: 'desc' },
  });
  return last?.eventHash || null;
}

export const uploadEvidence = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { caseId } = req.body;
    const userId = (req as any).user.userId;

    // 1. Verify case exists
    const caseRecord = await prisma.case.findUnique({ where: { id: caseId } });
    if (!caseRecord) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    // 2. Calculate SHA-256 hash of the uploaded file (server-side, never trust client)
    const fileHash = await hashFile(req.file.path);

    // 3. Generate evidence number
    const evidenceNumber = await generateEvidenceNumber();

    // 4. Create Evidence record in DB
    const evidence = await prisma.evidence.create({
      data: {
        evidenceNumber,
        caseId,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        storagePath: req.file.path,
        originalHash: fileHash,
        currentHash: fileHash,
        currentVersion: 1,
        status: 'PENDING',
        createdById: userId,
      },
    });

    // 5. Create first version record
    await prisma.evidenceVersion.create({
      data: {
        evidenceId: evidence.id,
        version: 1,
        hash: fileHash,
        previousHash: null,
        operation: 'UPLOAD',
        createdById: userId,
      },
    });

    // 6. Build event hash (genesis event)
    const eventData = {
      evidenceId: evidence.id,
      eventType: 'EVIDENCE_REGISTERED',
      actorId: userId,
      hash: fileHash,
      timestamp: new Date().toISOString(),
    };
    const eventHash = buildEventHash(eventData, null);

    // 7. Register on blockchain (async — may succeed or fail)
    let blockchainTxId: string | undefined;
    let blockchainStatus = 'PENDING';
    try {
      const tx = await blockchainService.registerEvidence(
        caseRecord.caseNumber,
        evidence.evidenceNumber,
        fileHash,
        '',
        userId
      );
      blockchainTxId = tx.txHash;
      blockchainStatus = 'CONFIRMED';

      // Store blockchain tx
      await prisma.blockchainTransaction.create({
        data: {
          txHash: tx.txHash,
          eventType: 'EVIDENCE_REGISTERED',
          caseId,
          evidenceId: evidence.id,
          actorWallet: tx.actorWallet,
          status: 'CONFIRMED',
        },
      });

      // Update evidence status to VERIFIED
      await prisma.evidence.update({
        where: { id: evidence.id },
        data: { status: 'VERIFIED' },
      });
    } catch (err) {
      console.error('Blockchain registration failed:', err);
      // Store failed blockchain tx
      await prisma.blockchainTransaction.create({
        data: {
          txHash: `pending-${evidence.id}`,
          eventType: 'EVIDENCE_REGISTERED',
          caseId,
          evidenceId: evidence.id,
          actorWallet: '0x0000000000000000000000000000000000000000',
          status: 'FAILED',
        },
      });
    }

    // 8. Create custody event (always succeed even if blockchain fails)
    const custodyEvent = await prisma.custodyEvent.create({
      data: {
        evidenceId: evidence.id,
        eventType: 'EVIDENCE_REGISTERED',
        actorId: userId,
        description: `Evidence uploaded: ${req.file.originalname}`,
        eventHash,
        previousEventHash: null,
        blockchainTxId,
      },
    });

    const finalEvidence = await prisma.evidence.findUnique({
      where: { id: evidence.id },
      include: { createdBy: { select: { id: true, name: true } }, case: true },
    });

    res.status(201).json({
      evidence: finalEvidence,
      blockchainStatus,
      custodyEvent,
    });
  } catch (error) {
    console.error('Upload evidence error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEvidence = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const evidence = await prisma.evidence.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        case: true,
        versions: { orderBy: { version: 'desc' } },
        custodyEvents: {
          include: { actor: { select: { id: true, name: true } } },
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!evidence) {
      res.status(404).json({ error: 'Evidence not found' });
      return;
    }

    // Log access event
    const lastHash = await getLastEventHash(id);
    const eventData = {
      evidenceId: id,
      eventType: 'EVIDENCE_ACCESSED',
      actorId: userId,
      timestamp: new Date().toISOString(),
    };
    const eventHash = buildEventHash(eventData, lastHash);

    // Record access on blockchain
    let blockchainTxId: string | undefined;
    try {
      const tx = await blockchainService.recordAccess(evidence.evidenceNumber, evidence.currentHash, userId);
      blockchainTxId = tx.txHash;
      await prisma.blockchainTransaction.create({
        data: {
          txHash: tx.txHash,
          eventType: 'EVIDENCE_ACCESSED',
          caseId: evidence.caseId,
          evidenceId: id,
          actorWallet: tx.actorWallet,
          status: 'CONFIRMED',
        },
      });
    } catch (err) {
      console.error('Blockchain access record failed:', err);
    }

    await prisma.custodyEvent.create({
      data: {
        evidenceId: id,
        eventType: 'EVIDENCE_ACCESSED',
        actorId: userId,
        description: 'Evidence record accessed',
        eventHash,
        previousEventHash: lastHash,
        blockchainTxId,
      },
    });

    res.status(200).json({ evidence });
  } catch (error) {
    console.error('Get evidence error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEvidenceHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const events = await prisma.custodyEvent.findMany({
      where: { evidenceId: id },
      include: { actor: { select: { id: true, name: true } } },
      orderBy: { timestamp: 'asc' },
    });

    const txs = await prisma.blockchainTransaction.findMany({
      where: { evidenceId: id },
      orderBy: { timestamp: 'asc' },
    });

    res.status(200).json({ events, transactions: txs });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyEvidence = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded for verification' });
      return;
    }

    // 1. Hash the uploaded file
    const currentHash = await hashFile(req.file.path);

    // 2. Get the stored evidence
    const evidence = await prisma.evidence.findUnique({ where: { id } });
    if (!evidence) {
      res.status(404).json({ error: 'Evidence not found' });
      return;
    }

    const isVerified = currentHash === evidence.originalHash;

    // 3. Record verification event
    const lastHash = await getLastEventHash(id);
    const eventData = {
      evidenceId: id,
      eventType: 'EVIDENCE_VERIFIED',
      actorId: userId,
      result: isVerified ? 'VERIFIED' : 'INTEGRITY_FAILURE',
      timestamp: new Date().toISOString(),
    };
    const eventHash = buildEventHash(eventData, lastHash);

    let blockchainTxId: string | undefined;
    try {
      const tx = await blockchainService.recordVerification(
        evidence.evidenceNumber,
        evidence.originalHash,
        currentHash,
        isVerified,
        userId
      );
      blockchainTxId = tx.txHash;
      await prisma.blockchainTransaction.create({
        data: {
          txHash: tx.txHash,
          eventType: 'EVIDENCE_VERIFIED',
          caseId: evidence.caseId,
          evidenceId: id,
          actorWallet: tx.actorWallet,
          status: 'CONFIRMED',
        },
      });
    } catch (err) {
      console.error('Blockchain verification failed:', err);
    }

    await prisma.custodyEvent.create({
      data: {
        evidenceId: id,
        eventType: 'EVIDENCE_VERIFIED',
        actorId: userId,
        description: isVerified ? 'Integrity verification passed' : 'INTEGRITY FAILURE — hash mismatch',
        eventHash,
        previousEventHash: lastHash,
        blockchainTxId,
      },
    });

    // Update evidence status
    await prisma.evidence.update({
      where: { id },
      data: { status: isVerified ? 'VERIFIED' : 'INTEGRITY_FAILURE', currentHash },
    });

    // Clean up temp file
    fs.unlink(req.file.path, () => {});

    res.status(200).json({
      verified: isVerified,
      originalHash: evidence.originalHash,
      currentHash,
      message: isVerified
        ? 'Evidence integrity verified — hashes match'
        : 'INTEGRITY FAILURE — evidence has been modified',
    });
  } catch (error) {
    console.error('Verify evidence error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const analyzeEvidence = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const { analysisType, toolUsed, description, findings, severity } = req.body;

    const evidence = await prisma.evidence.findUnique({ where: { id } });
    if (!evidence) {
      res.status(404).json({ error: 'Evidence not found' });
      return;
    }

    const lastHash = await getLastEventHash(id);
    const eventData = {
      evidenceId: id,
      eventType: 'EVIDENCE_ANALYZED',
      actorId: userId,
      analysisType,
      toolUsed,
      findings,
      severity,
      timestamp: new Date().toISOString(),
    };
    const eventHash = buildEventHash(eventData, lastHash);

    let blockchainTxId: string | undefined;
    try {
      const tx = await blockchainService.recordAnalysis(
        evidence.evidenceNumber,
        evidence.currentHash,
        analysisType,
        userId
      );
      blockchainTxId = tx.txHash;
      await prisma.blockchainTransaction.create({
        data: {
          txHash: tx.txHash,
          eventType: 'EVIDENCE_ANALYZED',
          caseId: evidence.caseId,
          evidenceId: id,
          actorWallet: tx.actorWallet,
          status: 'CONFIRMED',
        },
      });
    } catch (err) {
      console.error('Blockchain analysis record failed:', err);
    }

    const custodyEvent = await prisma.custodyEvent.create({
      data: {
        evidenceId: id,
        eventType: 'EVIDENCE_ANALYZED',
        actorId: userId,
        description: `${analysisType} — Tool: ${toolUsed} — ${findings} [${severity}]`,
        eventHash,
        previousEventHash: lastHash,
        blockchainTxId,
      },
    });

    res.status(201).json({ custodyEvent });
  } catch (error) {
    console.error('Analyze evidence error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const transferEvidence = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const { toUserId, reason } = req.body;

    const evidence = await prisma.evidence.findUnique({ where: { id } });
    if (!evidence) {
      res.status(404).json({ error: 'Evidence not found' });
      return;
    }

    const toUser = await prisma.user.findUnique({ where: { id: toUserId } });
    if (!toUser) {
      res.status(404).json({ error: 'Target investigator not found' });
      return;
    }

    const lastHash = await getLastEventHash(id);
    const eventData = {
      evidenceId: id,
      eventType: 'EVIDENCE_TRANSFERRED',
      actorId: userId,
      toUserId,
      reason,
      timestamp: new Date().toISOString(),
    };
    const eventHash = buildEventHash(eventData, lastHash);

    let blockchainTxId: string | undefined;
    try {
      const tx = await blockchainService.recordTransfer(
        evidence.evidenceNumber,
        evidence.currentHash,
        userId,
        toUserId
      );
      blockchainTxId = tx.txHash;
      await prisma.blockchainTransaction.create({
        data: {
          txHash: tx.txHash,
          eventType: 'EVIDENCE_TRANSFERRED',
          caseId: evidence.caseId,
          evidenceId: id,
          actorWallet: tx.actorWallet,
          status: 'CONFIRMED',
        },
      });
    } catch (err) {
      console.error('Blockchain transfer record failed:', err);
    }

    const custodyEvent = await prisma.custodyEvent.create({
      data: {
        evidenceId: id,
        eventType: 'EVIDENCE_TRANSFERRED',
        actorId: userId,
        description: `Custody transferred to ${toUser.name}. Reason: ${reason}`,
        eventHash,
        previousEventHash: lastHash,
        blockchainTxId,
      },
    });

    res.status(201).json({ custodyEvent });
  } catch (error) {
    console.error('Transfer evidence error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
