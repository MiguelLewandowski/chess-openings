import { Controller, Post, Patch, Get, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { AuthResponseDto, UserDto } from './dto/auth-response.dto'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { JwtAuthGuard } from './jwt-auth.guard'

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; role: string }
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new student account' })
  @ApiResponse({ status: 201, description: 'Returns a JWT token and the created user.', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'Email already in use.' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate and get a JWT token' })
  @ApiResponse({ status: 200, description: 'Returns a JWT token and the user.', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the authenticated user with fresh stats (xp, streak)' })
  @ApiResponse({ status: 200, description: 'Current user.', type: UserDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  me(@Request() req: AuthenticatedRequest) {
    return this.authService.findById(req.user.userId)
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the authenticated user profile (e.g. style archetype)' })
  @ApiResponse({ status: 200, description: 'Updated user.', type: UserDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  updateProfile(@Body() dto: UpdateProfileDto, @Request() req: AuthenticatedRequest) {
    return this.authService.updateProfile(req.user.userId, dto.styleArchetype)
  }
}
