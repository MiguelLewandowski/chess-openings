import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './jwt.strategy'
import { JwtAuthGuard } from './jwt-auth.guard'
import { getSessionSecret } from '../../common/env'

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      // Async so the secret is read when the module initializes, not when this file is
      // imported — otherwise a missing variable would throw during module resolution and
      // hide the real error behind a Nest bootstrap trace.
      useFactory: () => ({
        secret: getSessionSecret(),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [JwtAuthGuard, JwtModule, PassportModule],
})
export class AuthModule {}
