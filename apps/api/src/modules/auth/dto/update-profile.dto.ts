import { ApiProperty } from '@nestjs/swagger'
import { IsString, MinLength } from 'class-validator'

export class UpdateProfileDto {
  @ApiProperty({ example: 'tactical', description: 'Style archetype from the style quiz' })
  @IsString()
  @MinLength(1)
  styleArchetype: string
}
