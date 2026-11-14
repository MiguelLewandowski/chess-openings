import { ApiProperty } from '@nestjs/swagger'
import { IsIn } from 'class-validator'
import { OPENING_STYLES, type OpeningStyle } from '@chess-openings/domain'

export class ChooseOpeningStyleDto {
  @ApiProperty({ enum: OPENING_STYLES, description: 'The path the student wants to follow in this opening.', example: 'TACTICAL' })
  @IsIn(OPENING_STYLES)
  style: OpeningStyle
}

export class OpeningChoiceDto {
  @ApiProperty({ example: 'abertura-do-bispo' }) family: string
  @ApiProperty({ enum: OPENING_STYLES }) style: OpeningStyle
}
