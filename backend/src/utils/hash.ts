import crypto from 'crypto';
import fs from 'fs';

/**
 * Compute SHA-256 hash of a file by path.
 * Returns hex string.
 */
export function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Compute SHA-256 hash of any string/buffer.
 */
export function hashString(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Build an event hash: SHA256(eventData + previousEventHash)
 */
export function buildEventHash(eventData: object, previousHash: string | null): string {
  const combined = JSON.stringify(eventData) + (previousHash || 'GENESIS');
  return hashString(combined);
}
