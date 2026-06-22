import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  async getDashboardSummary(@Request() req) {
    return this.analyticsService.getDashboardSummary(req.user.id);
  }

  @Get('active-users')
  @UseGuards(JwtAuthGuard)
  async getActiveUsers() {
    return this.analyticsService.getActiveUsers();
  }

  @Get('total-users')
  @UseGuards(JwtAuthGuard)
  async getTotalUsers() {
    return this.analyticsService.getTotalUsers();
  }

  @Get('queries-asked')
  @UseGuards(JwtAuthGuard)
  async getQueriesAsked(@Query('period') period: string = '7d') {
    return this.analyticsService.getQueriesAsked(period);
  }

  @Get('learnings-shared')
  @UseGuards(JwtAuthGuard)
  async getLearningsShared(@Query('period') period: string = '7d') {
    return this.analyticsService.getLearningsShared(period);
  }

  @Get('usage-trends')
  @UseGuards(JwtAuthGuard)
  async getUsageTrends(@Query('period') period: string = '30d') {
    return this.analyticsService.getUsageTrends(period);
  }

  @Get('top-queries')
  @UseGuards(JwtAuthGuard)
  async getTopQueries(@Query('limit') limit: number = 10) {
    return this.analyticsService.getTopQueries(limit);
  }

  @Get('satisfaction-rate')
  @UseGuards(JwtAuthGuard)
  async getSatisfactionRate(@Query('period') period: string = '30d') {
    return this.analyticsService.getSatisfactionRate(period);
  }

  @Get('feature-usage')
  @UseGuards(JwtAuthGuard)
  async getFeatureUsage() {
    return this.analyticsService.getFeatureUsage();
  }
}
