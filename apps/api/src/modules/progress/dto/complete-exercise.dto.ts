import { ApiProperty } from '@nestjs/swagger'
import { IsInt, Min, Max } from 'class-validator'

export class CompleteExerciseDto {
  @ApiProperty({ description: 'SM-2 quality rating from 0 (blackout) to 5 (perfect).', minimum: 0, maximum: 5, example: 4 })
  @IsInt()
  @Min(0)
  @Max(5)
  quality: number
}
