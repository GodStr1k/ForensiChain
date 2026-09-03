import prisma from './utils/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Reusable hashes for our seeding data
const dummyHashes = [
  "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
  "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b20d1c1a2f",
  "a3dced427d14d33a1e2f778f8cb080b0bf10a6d83961dd3c1ac88b59b20d1c1a3b",
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "5891b5b522d5df086d0ff0b110fbd9d21bb4fc7163af34d08286a2e846f6be03",
  "f1234dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9112",
  "6f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b20d1c1a33",
  "b3dced427d14d33a1e2f778f8cb080b0bf10a6d83961dd3c1ac88b59b20d1c1a44",
];

async function main() {
  console.log("Cleaning database...");
  await prisma.blockchainTransaction.deleteMany();
  await prisma.custodyEvent.deleteMany();
  await prisma.evidenceVersion.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.caseMember.deleteMany();
  await prisma.case.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seeding users...");
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Forensic1!', salt);
  const adminHash = await bcrypt.hash('Admin1234!', salt);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@forensichain.com',
      password: adminHash,
      name: 'Director Arthur Vance',
      role: 'ADMIN',
      wallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Hardhat Account #0
    },
  });

  const john = await prisma.user.create({
    data: {
      email: 'john@forensichain.com',
      password: passwordHash,
      name: 'John Doe',
      role: 'LEAD_INVESTIGATOR',
      wallet: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Hardhat Account #1
    },
  });

  const sarah = await prisma.user.create({
    data: {
      email: 'sarah@forensichain.com',
      password: passwordHash,
      name: 'Sarah Jenkins',
      role: 'INVESTIGATOR',
      wallet: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Hardhat Account #2
    },
  });

  const alex = await prisma.user.create({
    data: {
      email: 'alex@forensichain.com',
      password: passwordHash,
      name: 'Alex Rivera',
      role: 'INVESTIGATOR',
      wallet: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // Hardhat Account #3
    },
  });

  const emily = await prisma.user.create({
    data: {
      email: 'emily@forensichain.com',
      password: passwordHash,
      name: 'Emily Chen',
      role: 'INVESTIGATOR',
      wallet: '0x15d34AAf54a67C68101F3096d24825972B2B5a68', // Hardhat Account #4
    },
  });

  console.log("Seeding cases...");
  const casesData = [
    {
      caseNumber: 'CASE-2026-0001',
      name: 'Corporate Espionage Incident - Project Eclipse',
      description: 'Investigating suspected data exfiltration of critical R&D files by a rogue engineer prior to departure.',
      caseType: 'IP_THEFT',
      priority: 'HIGH',
      incidentDate: new Date('2026-02-10T08:30:00Z'),
      location: 'HQ Server Room & Remote VPN',
      leadInvestigatorId: john.id,
      members: [sarah.id, alex.id],
    },
    {
      caseNumber: 'CASE-2026-0002',
      name: 'Ransomware Attack - LockBit Subvariant',
      description: 'Post-incident analysis of ransomware delivery vector and lateral movement in the logistics sub-network.',
      caseType: 'MALWARE',
      priority: 'CRITICAL',
      incidentDate: new Date('2026-02-15T22:15:00Z'),
      location: 'Logistics Endpoint Subnet',
      leadInvestigatorId: sarah.id,
      members: [john.id, emily.id],
    },
    {
      caseNumber: 'CASE-2026-0003',
      name: 'Insider Trading & Fraud Investigation',
      description: 'Audit of corporate email archives and messaging logs for trade secrets leaked ahead of Q3 earnings reports.',
      caseType: 'FRAUD',
      priority: 'MEDIUM',
      incidentDate: new Date('2026-02-18T10:00:00Z'),
      location: 'Finance Dept Accounts',
      leadInvestigatorId: john.id,
      members: [emily.id],
    },
    {
      caseNumber: 'CASE-2026-0004',
      name: 'Unauthorized Domain Access Auditing',
      description: 'Investigating credential harvesting campaign and subsequent unauthorized logins targeting Domain Controllers.',
      caseType: 'UNAUTHORIZED_ACCESS',
      priority: 'HIGH',
      incidentDate: new Date('2026-02-22T04:12:00Z'),
      location: 'Primary Active Directory Server',
      leadInvestigatorId: alex.id,
      members: [sarah.id],
    },
    {
      caseNumber: 'CASE-2026-0005',
      name: 'Phishing Campaign & Token Hijacking',
      description: 'Incident response for malicious Microsoft 365 OAuth app registration used to bypass Multi-Factor Authentication.',
      caseType: 'PHISHING',
      priority: 'MEDIUM',
      incidentDate: new Date('2026-02-24T14:45:00Z'),
      location: 'Sales Team Tenants',
      leadInvestigatorId: emily.id,
      members: [john.id],
    },
    {
      caseNumber: 'CASE-2026-0006',
      name: 'External Threat Actor Data Leak',
      description: 'Analyzing dark web database listing containing proprietary customer support transcripts and user hashes.',
      caseType: 'DATA_LEAK',
      priority: 'CRITICAL',
      incidentDate: new Date('2026-02-25T01:30:00Z'),
      location: 'External Deep Web Monitor',
      leadInvestigatorId: sarah.id,
      members: [alex.id],
    },
    {
      caseNumber: 'CASE-2026-0007',
      name: 'SCADA System Endpoint Intrusion',
      description: 'Investigating anomalous PLC instruction sets sent to fluid controller monitors at the water treatment plant.',
      caseType: 'SCADA',
      priority: 'CRITICAL',
      incidentDate: new Date('2026-02-26T11:00:00Z'),
      location: 'Water Plant Substation 4',
      leadInvestigatorId: alex.id,
      members: [john.id, sarah.id, emily.id],
    },
    {
      caseNumber: 'CASE-2026-0008',
      name: 'Mobile Spyware Infiltration',
      description: 'Forensic extraction of an executive mobile device suspected of holding Pegasus-like active surveillance software.',
      caseType: 'MOBILE_FORENSICS',
      priority: 'HIGH',
      incidentDate: new Date('2026-02-27T09:20:00Z'),
      location: 'Executive iPhone 15 Pro',
      leadInvestigatorId: emily.id,
      members: [sarah.id],
    },
  ];

  const createdCases: any[] = [];

  for (const c of casesData) {
    const newCase = await prisma.case.create({
      data: {
        caseNumber: c.caseNumber,
        name: c.name,
        description: c.description,
        caseType: c.caseType,
        priority: c.priority,
        incidentDate: c.incidentDate,
        location: c.location,
        leadInvestigatorId: c.leadInvestigatorId,
      },
    });

    for (const memId of c.members) {
      await prisma.caseMember.create({
        data: {
          caseId: newCase.id,
          userId: memId,
        },
      });
    }

    createdCases.push(newCase);
  }

  console.log("Seeding evidence items & custody events...");
  const evidenceTemplate = [
    { filename: 'ram_dump_eclipse.raw', mimeType: 'application/octet-stream', size: 16777216, type: 'Memory Dump' },
    { filename: 'syslog_vpn_logs.txt', mimeType: 'text/plain', size: 489210, type: 'Log File' },
    { filename: 'wireshark_capture.pcap', mimeType: 'application/octet-stream', size: 5242880, type: 'Network PCAP' },
    { filename: 'finance_ledger_exfiltrated.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 89040, type: 'Spreadsheet' },
    { filename: 'email_archive_john_doe.pst', mimeType: 'application/octet-stream', size: 250000000, type: 'Email Archive' },
    { filename: 'disk_image_rogue_vm.dd', mimeType: 'application/octet-stream', size: 1520030040, type: 'Disk Image' },
    { filename: 'registry_hives_system.zip', mimeType: 'application/zip', size: 12489020, type: 'Registry Export' },
    { filename: 'phishing_payload_invoice.pdf.exe', mimeType: 'application/x-msdownload', size: 320500, type: 'Executable Payload' },
  ];

  const actors = [john, sarah, alex, emily];
  let evidenceCounter = 1;

  for (let i = 0; i < 30; i++) {
    const parentCase = createdCases[i % createdCases.length];
    const template = evidenceTemplate[i % evidenceTemplate.length];
    const actor = actors[i % actors.length];

    const evidenceNumber = `EVD-${String(evidenceCounter++).padStart(6, '0')}`;
    const hash = dummyHashes[i % dummyHashes.length];

    const evidence = await prisma.evidence.create({
      data: {
        evidenceNumber,
        caseId: parentCase.id,
        filename: `${i}_${template.filename}`,
        mimeType: template.mimeType,
        size: template.size,
        storagePath: `C:\\Users\\GodStr1k\\.gemini\\antigravity\\scratch\\forensichain\\storage\\${evidenceNumber}_${template.filename}`,
        originalHash: hash,
        currentHash: hash,
        currentVersion: 1,
        status: i % 7 === 0 ? 'INTEGRITY_FAILURE' : 'VERIFIED',
        createdById: actor.id,
      },
    });

    await prisma.evidenceVersion.create({
      data: {
        evidenceId: evidence.id,
        version: 1,
        hash,
        operation: 'UPLOAD',
        createdById: actor.id,
      },
    });

    // Create a chronological chain of custody events for each evidence
    const event1 = {
      evidenceId: evidence.id,
      eventType: 'EVIDENCE_REGISTERED',
      actorId: actor.id,
      timestamp: new Date(parentCase.createdAt.getTime() + 1000 * 60 * 10), // 10 mins later
    };
    const hash1 = crypto.createHash('sha256').update(JSON.stringify(event1) + 'GENESIS').digest('hex');
    const tx1 = '0x' + crypto.randomBytes(32).toString('hex');

    await prisma.custodyEvent.create({
      data: {
        evidenceId: evidence.id,
        eventType: 'EVIDENCE_REGISTERED',
        actorId: actor.id,
        description: `Evidence initial registration: ${evidence.filename}`,
        eventHash: hash1,
        previousEventHash: null,
        blockchainTxId: tx1,
        timestamp: event1.timestamp,
      },
    });

    await prisma.blockchainTransaction.create({
      data: {
        txHash: tx1,
        eventType: 'EVIDENCE_REGISTERED',
        caseId: parentCase.id,
        evidenceId: evidence.id,
        actorWallet: actor.wallet || '0x0000000000000000000000000000000000000000',
        status: 'CONFIRMED',
        timestamp: event1.timestamp,
      },
    });

    if (i % 2 === 0) {
      // Add access event
      const anotherActor = actors[(i + 1) % actors.length];
      const event2 = {
        evidenceId: evidence.id,
        eventType: 'EVIDENCE_ACCESSED',
        actorId: anotherActor.id,
        timestamp: new Date(event1.timestamp.getTime() + 1000 * 60 * 60 * 2), // 2 hrs later
      };
      const hash2 = crypto.createHash('sha256').update(JSON.stringify(event2) + hash1).digest('hex');
      const tx2 = '0x' + crypto.randomBytes(32).toString('hex');

      await prisma.custodyEvent.create({
        data: {
          evidenceId: evidence.id,
          eventType: 'EVIDENCE_ACCESSED',
          actorId: anotherActor.id,
          description: 'Evidence records opened in analysis terminal',
          eventHash: hash2,
          previousEventHash: hash1,
          blockchainTxId: tx2,
          timestamp: event2.timestamp,
        },
      });

      await prisma.blockchainTransaction.create({
        data: {
          txHash: tx2,
          eventType: 'EVIDENCE_ACCESSED',
          caseId: parentCase.id,
          evidenceId: evidence.id,
          actorWallet: anotherActor.wallet || '0x0000000000000000000000000000000000000000',
          status: 'CONFIRMED',
          timestamp: event2.timestamp,
        },
      });

      if (i % 4 === 0) {
        // Add analysis event
        const event3 = {
          evidenceId: evidence.id,
          eventType: 'EVIDENCE_ANALYZED',
          actorId: anotherActor.id,
          timestamp: new Date(event2.timestamp.getTime() + 1000 * 60 * 30), // 30 mins later
        };
        const hash3 = crypto.createHash('sha256').update(JSON.stringify(event3) + hash2).digest('hex');
        const tx3 = '0x' + crypto.randomBytes(32).toString('hex');

        await prisma.custodyEvent.create({
          data: {
            evidenceId: evidence.id,
            eventType: 'EVIDENCE_ANALYZED',
            actorId: anotherActor.id,
            description: 'Analyzed with Autopsy & Volatility — Extracting network descriptors and process metrics',
            eventHash: hash3,
            previousEventHash: hash2,
            blockchainTxId: tx3,
            timestamp: event3.timestamp,
          },
        });

        await prisma.blockchainTransaction.create({
          data: {
            txHash: tx3,
            eventType: 'EVIDENCE_ANALYZED',
            caseId: parentCase.id,
            evidenceId: evidence.id,
            actorWallet: anotherActor.wallet || '0x0000000000000000000000000000000000000000',
            status: 'CONFIRMED',
            timestamp: event3.timestamp,
          },
        });
      }

      if (i % 6 === 0) {
        // Add transfer event
        const targetActor = actors[(i + 2) % actors.length];
        const event4 = {
          evidenceId: evidence.id,
          eventType: 'EVIDENCE_TRANSFERRED',
          actorId: targetActor.id,
          timestamp: new Date(event2.timestamp.getTime() + 1000 * 60 * 60 * 24), // 24 hrs later
        };
        const hash4 = crypto.createHash('sha256').update(JSON.stringify(event4) + hash2).digest('hex');
        const tx4 = '0x' + crypto.randomBytes(32).toString('hex');

        await prisma.custodyEvent.create({
          data: {
            evidenceId: evidence.id,
            eventType: 'EVIDENCE_TRANSFERRED',
            actorId: anotherActor.id,
            description: `Transferred custody to ${targetActor.name}. Reason: Dedicated malware analysis environment needed`,
            eventHash: hash4,
            previousEventHash: hash2,
            blockchainTxId: tx4,
            timestamp: event4.timestamp,
          },
        });

        await prisma.blockchainTransaction.create({
          data: {
            txHash: tx4,
            eventType: 'EVIDENCE_TRANSFERRED',
            caseId: parentCase.id,
            evidenceId: evidence.id,
            actorWallet: anotherActor.wallet || '0x0000000000000000000000000000000000000000',
            status: 'CONFIRMED',
            timestamp: event4.timestamp,
          },
        });
      }
    }
  }

  console.log("Seeding complete! Admin credentials: admin@forensichain.com / Admin1234!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
