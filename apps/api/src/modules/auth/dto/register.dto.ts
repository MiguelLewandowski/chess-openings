import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength } from 'class-validator'

export class RegisterDto {
  @ApiProperty({ example: 'student@example.com' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'securepass123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string

  @ApiProperty({ example: 'João Silva', required: false })
  @IsString()
  name?: string
}
