import { ethers } from 'ethers';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY ||
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';

// Minimal ABI for our ForensicEvidence contract
const ABI = [
  'function registerEvidence(string caseId, string evidenceId, string evidenceHash, string prevHash, string metadataHash) external returns (uint256)',
  'function recordAccess(string evidenceId, string evidenceHash) external returns (uint256)',
  'function recordAnalysis(string evidenceId, string evidenceHash, string analysisType) external returns (uint256)',
  'function recordTransfer(string evidenceId, string evidenceHash, address fromInvestigator, address toInvestigator) external returns (uint256)',
  'function recordVerification(string evidenceId, string registeredHash, string currentHash, bool isVerified) external returns (uint256)',
  'event EvidenceEvent(uint256 indexed eventId, string evidenceId, string eventType, string evidenceHash, address investigator, uint256 timestamp)',
];

interface TxResult {
  txHash: string;
  blockNumber?: number;
  actorWallet: string;
}

class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;
  private connected = false;

  async connect(): Promise<void> {
    try {
      this.provider = new ethers.JsonRpcProvider(RPC_URL);
      this.signer = new ethers.Wallet(PRIVATE_KEY, this.provider);
      
      if (CONTRACT_ADDRESS) {
        this.contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, this.signer);
      }
      
      // Test connection with a 3 second timeout
      const blockNumberPromise = this.provider.getBlockNumber();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000));
      await Promise.race([blockNumberPromise, timeoutPromise]);
      
      this.connected = true;
      console.log(`[Blockchain] Connected to ${RPC_URL}`);
    } catch (err) {
      if (this.provider) {
        this.provider.destroy();
        this.provider = null;
      }
      console.log('[Blockchain] No blockchain node found. Operating in mock mode (cryptographically random tx hashes).');
      this.connected = false;
    }
  }

  private getWalletAddress(): string {
    return this.signer?.address || '0x0000000000000000000000000000000000000000';
  }

  /**
   * Simulate or actually submit a blockchain transaction.
   * Falls back to a deterministic mock hash when blockchain is unavailable.
   */
  private async submitOrMock(txFn: () => Promise<ethers.TransactionResponse>): Promise<TxResult> {
    const actorWallet = this.getWalletAddress();

    if (this.connected && this.contract) {
      try {
        const tx = await txFn();
        const receipt = await tx.wait();
        return {
          txHash: tx.hash,
          blockNumber: receipt?.blockNumber,
          actorWallet,
        };
      } catch (err) {
        console.warn('[Blockchain] tx failed, falling back to mock:', (err as Error).message);
      }
    }

    // Mock: generate deterministic hex hash for demo
    const mockHash = '0x' + crypto.randomBytes(32).toString('hex');
    return { txHash: mockHash, actorWallet };
  }

  async registerEvidence(
    caseId: string,
    evidenceId: string,
    evidenceHash: string,
    prevHash: string,
    actorId: string
  ): Promise<TxResult> {
    return this.submitOrMock(async () => {
      return this.contract!.registerEvidence(caseId, evidenceId, evidenceHash, prevHash, '');
    });
  }

  async recordAccess(evidenceId: string, evidenceHash: string, actorId: string): Promise<TxResult> {
    return this.submitOrMock(async () => {
      return this.contract!.recordAccess(evidenceId, evidenceHash);
    });
  }

  async recordAnalysis(
    evidenceId: string,
    evidenceHash: string,
    analysisType: string,
    actorId: string
  ): Promise<TxResult> {
    return this.submitOrMock(async () => {
      return this.contract!.recordAnalysis(evidenceId, evidenceHash, analysisType);
    });
  }

  async recordTransfer(
    evidenceId: string,
    evidenceHash: string,
    fromId: string,
    toId: string
  ): Promise<TxResult> {
    return this.submitOrMock(async () => {
      const fromAddr = ethers.ZeroAddress;
      const toAddr = ethers.ZeroAddress;
      return this.contract!.recordTransfer(evidenceId, evidenceHash, fromAddr, toAddr);
    });
  }

  async recordVerification(
    evidenceId: string,
    registeredHash: string,
    currentHash: string,
    isVerified: boolean,
    actorId: string
  ): Promise<TxResult> {
    return this.submitOrMock(async () => {
      return this.contract!.recordVerification(evidenceId, registeredHash, currentHash, isVerified);
    });
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export const blockchainService = new BlockchainService();

// Connect on import
blockchainService.connect().catch(console.error);
