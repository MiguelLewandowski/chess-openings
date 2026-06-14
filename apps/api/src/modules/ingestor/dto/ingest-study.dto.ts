import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsUrl, IsOptional, IsInt, IsArray, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class IngestStudyDto {
  @ApiProperty({ description: 'Lichess study URL', example: 'https://lichess.org/study/abc123' })
  @IsUrl()
  url: string

  @ApiProperty({ description: 'Opening name override', required: false, example: 'Italian Game' })
  @IsOptional()
  @IsString()
  openingName?: string

  @ApiProperty({ description: 'Import only the first N chapters', required: false, example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  chapterLimit?: number

  @ApiProperty({ description: 'Import only this chapter number (1-indexed)', required: false, example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  specificChapter?: number

  @ApiProperty({ description: 'Style tags for recommendation engine', required: false, example: ['tactical', 'open'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  styleTags?: string[]
}
