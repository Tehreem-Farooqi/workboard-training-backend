import { Injectable, ConflictException } from '@nestjs/common';

interface IdempotencyRecord {
  key: string;
  response: any;
  timestamp: number;
}

@Injectable()
export class IdempotencyService {
  private readonly cache = new Map<string, IdempotencyRecord>();
  private readonly ttlMs = 24 * 60 * 60 * 1000; // 24 hours

  async checkAndStore(
    key: string | undefined,
    operation: () => Promise<any>,
  ): Promise<any> {
    // If no idempotency key provided, execute normally
    if (!key) {
      return operation();
    }

    // Check if we've seen this key before
    const existing = this.cache.get(key);
    if (existing) {
      const age = Date.now() - existing.timestamp;
      if (age < this.ttlMs) {
        console.log(`[Idempotency] Returning cached response for key: ${key}`);
        return existing.response;
      } else {
        // Expired, remove it
        this.cache.delete(key);
      }
    }

    // Execute the operation
    const response = await operation();

    // Store the result
    this.cache.set(key, {
      key,
      response,
      timestamp: Date.now(),
    });

    // Cleanup old entries periodically
    this.cleanupExpired();

    return response;
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, record] of this.cache.entries()) {
      if (now - record.timestamp > this.ttlMs) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}
