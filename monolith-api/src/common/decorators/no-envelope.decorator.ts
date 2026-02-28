import { SetMetadata } from '@nestjs/common';
import { NO_ENVELOPE_KEY } from '../interceptors/response-envelope.interceptor';

export const NoEnvelope = () => SetMetadata(NO_ENVELOPE_KEY, true);
