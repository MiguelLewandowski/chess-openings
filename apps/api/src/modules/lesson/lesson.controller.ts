import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { LessonService } from './lesson.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('lessons')
@Controller('lessons')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lesson by id', description: 'Returns lesson detail including exercises and move tree.' })
  @ApiParam({ name: 'id', description: 'Lesson CUID identifier' })
  @ApiResponse({ status: 200, description: 'Lesson with exercises and moves.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Lesson not found.' })
  findOne(@Param('id') id: string) {
    return this.lessonService.findById(id)
  }
}
