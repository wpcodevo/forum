import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Skip throttling for OPTIONS requests (CORS preflight)
    // These are automatically sent by browsers and shouldn't count against rate limits
    if (request.method === 'OPTIONS') {
      return true;
    }

    return super.shouldSkip(context);
  }
}

