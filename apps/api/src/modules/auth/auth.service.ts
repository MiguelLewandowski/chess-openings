import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../../infrastructure/prisma.service'
import * as bcrypt from 'bcryptjs'
import type { RegisterDto } from './dto/register.dto'
import type { LoginDto } from './dto/login.dto'
import type { AuthResponseDto, UserDto } from './dto/auth-response.dto'

type UserRecord = {
  id: string
  email: string
  name: string | null
  role: string
  styleArchetype: string | null
  xp: number
  streak: number
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (existing) throw new ConflictException('Email already in use.')

    const hashed = await bcrypt.hash(dto.password, 10)
    const user = await this.prisma.user.create({
      data: { email: dto.email, password: hashed, name: dto.name },
    })

    return this.buildAuthResponse(user)
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user?.password) throw new UnauthorizedException('Invalid credentials.')

    const valid = await bcrypt.compare(dto.password, user.password)
    if (!valid) throw new UnauthorizedException('Invalid credentials.')

    return this.buildAuthResponse(user)
  }

  async findById(userId: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new UnauthorizedException('User not found.')
    return this.toUserDto(user)
  }

  async updateProfile(userId: string, styleArchetype: string): Promise<UserDto> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { styleArchetype },
    })
    return this.toUserDto(user)
  }

  private buildAuthResponse(user: UserRecord): AuthResponseDto {
    const token = this.jwt.sign({ sub: user.id, email: user.email, role: user.role })
    return { token, user: this.toUserDto(user) }
  }

  private toUserDto(user: UserRecord): UserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      styleArchetype: user.styleArchetype,
      xp: user.xp,
      streak: user.streak,
    }
  }
}
