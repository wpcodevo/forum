import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Observable, of } from "rxjs";
import { catchError, map } from "rxjs/operators";

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  // Override handleRequest to not throw error when no token is present
  handleRequest<TUser = any>(_err: any, user: any): TUser {
    // If there's an error or no user, just return undefined instead of throwing
    // This allows the route to proceed without authentication
    // The user will be undefined if no valid token is present
    return user;
  }

  // Override canActivate to allow the request to proceed even without a token
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Try to authenticate, but if it fails (no token or invalid token), 
    // we still allow the request to proceed
    const result = super.canActivate(context);
    if (result instanceof Promise) {
      return result.then(() => true).catch(() => true);
    }
    if (result instanceof Observable) {
      return result.pipe(
        map(() => true),
        catchError(() => of(true))
      );
    }
    // If it's a boolean, return true to allow the request
    return true;
  }
}

