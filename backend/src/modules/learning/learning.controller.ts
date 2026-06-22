import { Controller, Post, Get, Body, UseGuards, Request, Param, Patch, Delete, Query } from '@nestjs/common';
import { LearningService } from './learning.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateLearningDto } from './dto/create-learning.dto';
import { UpdateLearningDto } from './dto/update-learning.dto';

@Controller('learning')
export class LearningController {
  constructor(private learningService: LearningService) {}

  @Post('share')
  @UseGuards(JwtAuthGuard)
  async shareLeaming(@Body() createDto: CreateLearningDto, @Request() req) {
    return this.learningService.createLearning(req.user.id, createDto);
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  async getLearningFeed(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('projectId') projectId?: string,
    @Request() req,
  ) {
    return this.learningService.getLearningFeed(
      req.user.id,
      page,
      limit,
      projectId,
    );
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  async searchLearnings(
    @Query('keyword') keyword: string,
    @Query('projectId') projectId?: string,
    @Request() req,
  ) {
    return this.learningService.searchLearnings(
      req.user.id,
      keyword,
      projectId,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getLearning(@Param('id') id: string, @Request() req) {
    return this.learningService.getLearning(id, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateLearning(
    @Param('id') id: string,
    @Body() updateDto: UpdateLearningDto,
    @Request() req,
  ) {
    return this.learningService.updateLearning(id, req.user.id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteLearning(@Param('id') id: string, @Request() req) {
    return this.learningService.deleteLearning(id, req.user.id);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async likeLearning(@Param('id') id: string, @Request() req) {
    return this.learningService.likeLearning(id, req.user.id);
  }

  @Get('tags/list')
  @UseGuards(JwtAuthGuard)
  async getTags(@Query('projectId') projectId?: string) {
    return this.learningService.getAvailableTags(projectId);
  }
}
