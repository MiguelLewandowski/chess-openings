import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

export class RegisterDto {
  @ApiProperty({ example: 'student@example.com' })
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string

  // There is no password recovery flow yet, so the floor is 8 characters to keep accounts
  // from being trivially guessable while testers cannot reset on their own.
  @ApiProperty({ example: 'securepass123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'A senha precisa ter no mínimo 8 caracteres.' })
  password: string

  // Documented as optional and typed as optional, but @IsString() alone rejected a missing
  // name — registering without one returned 400.
  @ApiProperty({ example: 'João Silva', required: false })
  @IsOptional()
  @IsString()
  name?: string
}
