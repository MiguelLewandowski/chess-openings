import { ApiProperty } from '@nestjs/swagger'

export class UserDto {
  @ApiProperty() id: string
  @ApiProperty() email: string
  @ApiProperty({ nullable: true }) name: string | null
  @ApiProperty() role: string
  @ApiProperty({ nullable: true }) styleArchetype: string | null
  @ApiProperty() xp: number
  @ApiProperty() streak: number
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT bearer token, valid for 7 days' })
  token: string

  @ApiProperty({ type: UserDto })
  user: UserDto
}
