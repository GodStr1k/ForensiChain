import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// Generate case number: CASE-YYYY-NNNN
async function generateCaseNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.case.count();
  return `CASE-${year}-${String(count + 1).padStart(4, '0')}`;
}

export const createCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, caseType, priority, incidentDate, location, additionalInvestigators } = req.body;
    const userId = (req as any).user.userId;

    const caseNumber = await generateCaseNumber();

    const newCase = await prisma.case.create({
      data: {
        caseNumber,
        name,
        description,
        caseType,
        priority,
        incidentDate: new Date(incidentDate),
        location,
        leadInvestigatorId: userId,
      },
      include: {
        leadInvestigator: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { evidence: true, members: true } },
      },
    });

    // Add additional investigators if any
    if (additionalInvestigators && additionalInvestigators.length > 0) {
      await prisma.caseMember.createMany({
        data: additionalInvestigators.map((uid: string) => ({ caseId: newCase.id, userId: uid })),
      });
    }

    res.status(201).json({ case: newCase });
  } catch (error) {
    console.error('Create case error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCases = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const role = (req as any).user.role;

    // ADMIN sees all; others see cases they lead or are members of
    const cases = await prisma.case.findMany({
      where: role === 'ADMIN' ? {} : {
        OR: [
          { leadInvestigatorId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        leadInvestigator: { select: { id: true, name: true, email: true } },
        _count: { select: { evidence: true, members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ cases });
  } catch (error) {
    console.error('Get cases error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const foundCase = await prisma.case.findUnique({
      where: { id },
      include: {
        leadInvestigator: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        evidence: {
          include: {
            createdBy: { select: { id: true, name: true } },
            _count: { select: { custodyEvents: true, versions: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { evidence: true, members: true } },
      },
    });

    if (!foundCase) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    res.status(200).json({ case: foundCase });
  } catch (error) {
    console.error('Get case error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status, name, description, priority } = req.body;

    const updatedCase = await prisma.case.update({
      where: { id },
      data: { status, name, description, priority },
      include: {
        leadInvestigator: { select: { id: true, name: true, email: true } },
        _count: { select: { evidence: true, members: true } },
      },
    });

    res.status(200).json({ case: updatedCase });
  } catch (error) {
    console.error('Update case error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
