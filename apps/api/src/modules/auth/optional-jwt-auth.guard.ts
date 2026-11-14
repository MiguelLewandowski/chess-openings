import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

// For public endpoints that show more to a logged-in student: a missing or invalid token
// lets the request through anonymously (req.user is null) instead of answering 401.
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(_error: unknown, user: TUser | false): TUser | null {
    return user || null
  }
}
