import { Observable, throwError, timer } from 'rxjs';
import { mergeMap, retryWhen, tap } from 'rxjs/operators';

export interface RetryConfig {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

export function retryWithBackoff(config: RetryConfig = {}) {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    retryableErrors = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'],
  } = config;

  return <T>(source: Observable<T>) =>
    source.pipe(
      retryWhen((errors) =>
        errors.pipe(
          mergeMap((error, index) => {
            const attempt = index + 1;

            // Check if error is retryable
            const isRetryable =
              retryableErrors.some((code) => error.code === code) ||
              error.status === 503 ||
              error.status === 504;

            if (attempt >= maxAttempts || !isRetryable) {
              console.error(
                `[Retry] Max attempts (${maxAttempts}) reached or non-retryable error`,
                error,
              );
              return throwError(() => error);
            }

            const delay = delayMs * Math.pow(backoffMultiplier, index);
            console.log(
              `[Retry] Attempt ${attempt}/${maxAttempts} - retrying in ${delay}ms`,
            );

            return timer(delay);
          }),
        ),
      ),
    );
}
