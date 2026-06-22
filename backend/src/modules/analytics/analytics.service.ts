import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { UserActivity } from './entities/user-activity.entity';
import { QueryMetric } from './entities/query-metric.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(UserActivity)
    private userActivityRepository: Repository<UserActivity>,
    @InjectRepository(QueryMetric)
    private queryMetricRepository: Repository<QueryMetric>,
    @InjectModel('userActivities')
    private userActivityModel: Model<any>,
  ) {}

  async getDashboardSummary(userId?: number) {
    try {
      const [activeUsers, totalUsers, totalQueries, totalLearnings] =
        await Promise.all([
          this.getActiveUsers(),
          this.getTotalUsers(),
          this.queryMetricRepository.count(),
          this.getDocumentCount('learnings'),
        ]);

      const satisfactionRate = await this.getSatisfactionRate('30d');

      return {
        activeUsers: activeUsers.count,
        totalUsers: totalUsers.count,
        totalQueries: totalQueries,
        totalLearnings: totalLearnings,
        satisfactionRate: satisfactionRate.rate,
        timestamp: new Date(),
      };
    } catch (error) {
      throw new HttpException(
        'Failed to get dashboard summary',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getActiveUsers() {
    try {
      // Users active in last 24 hours
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const activeUsers = await this.userActivityRepository
        .createQueryBuilder('activity')
        .select('COUNT(DISTINCT activity.userId)', 'count')
        .where('activity.timestamp > :timestamp', {
          timestamp: twentyFourHoursAgo,
        })
        .getRawOne();

      return {
        count: parseInt(activeUsers.count) || 0,
        period: '24h',
      };
    } catch (error) {
      throw new HttpException(
        'Failed to get active users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTotalUsers() {
    try {
      // This would typically join with users table
      const totalUsers = await this.userActivityRepository
        .createQueryBuilder('activity')
        .select('COUNT(DISTINCT activity.userId)', 'count')
        .getRawOne();

      return {
        count: parseInt(totalUsers.count) || 0,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to get total users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getQueriesAsked(period: string = '7d') {
    try {
      const startDate = this.getPeriodStartDate(period);

      const queryCount = await this.queryMetricRepository
        .createQueryBuilder('metric')
        .select('COUNT(*)', 'count')
        .where('metric.createdAt > :startDate', { startDate })
        .getRawOne();

      // Get daily breakdown
      const dailyBreakdown = await this.queryMetricRepository
        .createQueryBuilder('metric')
        .select('DATE(metric.createdAt)', 'date')
        .addSelect('COUNT(*)', 'count')
        .where('metric.createdAt > :startDate', { startDate })
        .groupBy('DATE(metric.createdAt)')
        .orderBy('date', 'ASC')
        .getRawMany();

      return {
        period,
        totalQueries: parseInt(queryCount.count) || 0,
        dailyBreakdown: dailyBreakdown.map((d) => ({
          date: d.date,
          count: parseInt(d.count),
        })),
      };
    } catch (error) {
      throw new HttpException(
        'Failed to get queries data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getLearningsShared(period: string = '7d') {
    try {
      const startDate = this.getPeriodStartDate(period);

      const learnings = await this.userActivityModel
        .find({
          action: 'learning_shared',
          timestamp: { $gte: startDate },
        })
        .select('timestamp');

      const learningsByDay = {};
      learnings.forEach((learning) => {
        const date = learning.timestamp.toISOString().split('T')[0];
        learningsByDay[date] = (learningsByDay[date] || 0) + 1;
      });

      return {
        period,
        totalLearnings: learnings.length,
        dailyBreakdown: Object.entries(learningsByDay).map(([date, count]) => ({
          date,
          count,
        })),
      };
    } catch (error) {
      throw new HttpException(
        'Failed to get learnings data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUsageTrends(period: string = '30d') {
    try {
      const startDate = this.getPeriodStartDate(period);

      const activities = await this.userActivityModel
        .find({ timestamp: { $gte: startDate } })
        .select('timestamp action');

      const trends = {
        troubleshooting: [],
        documents: [],
        learning: [],
        signals: [],
      };

      const dailyData = {};

      activities.forEach((activity) => {
        const date = activity.timestamp.toISOString().split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = {
            troubleshooting: 0,
            documents: 0,
            learning: 0,
            signals: 0,
          };
        }

        if (activity.action.includes('query')) dailyData[date].troubleshooting++;
        if (activity.action.includes('document'))
          dailyData[date].documents++;
        if (activity.action.includes('learning')) dailyData[date].learning++;
        if (activity.action.includes('signal')) dailyData[date].signals++;
      });

      return {
        period,
        trends: Object.entries(dailyData).map(([date, data]) => ({
          date,
          ...data,
        })),
      };
    } catch (error) {
      throw new HttpException(
        'Failed to get usage trends',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTopQueries(limit: number = 10) {
    try {
      const topQueries = await this.queryMetricRepository
        .find({
          order: { views: 'DESC' },
          take: limit,
          select: ['id', 'question', 'views', 'helpfulCount'],
        });

      return {
        limit,
        queries: topQueries.map((q) => ({
          queryId: q.id,
          question: q.question,
          views: q.views,
          helpful: q.helpfulCount,
        })),
      };
    } catch (error) {
      throw new HttpException(
        'Failed to get top queries',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getSatisfactionRate(period: string = '30d') {
    try {
      const startDate = this.getPeriodStartDate(period);

      const metrics = await this.queryMetricRepository
        .createQueryBuilder('metric')
        .select('COUNT(*)', 'total')
        .addSelect('SUM(CASE WHEN metric.helpful = true THEN 1 ELSE 0 END)', 'helpful')
        .where('metric.createdAt > :startDate', { startDate })
        .getRawOne();

      const total = parseInt(metrics.total) || 0;
      const helpful = parseInt(metrics.helpful) || 0;
      const rate = total > 0 ? ((helpful / total) * 100).toFixed(2) : 0;

      return {
        period,
        rate: parseFloat(rate),
        totalQueries: total,
        helpfulQueries: helpful,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to get satisfaction rate',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getFeatureUsage() {
    try {
      const activities = await this.userActivityModel.find().select('action');

      const usageMap = {
        troubleshooting: 0,
        documentComparison: 0,
        documentReview: 0,
        learningSharing: 0,
        signalMapping: 0,
      };

      activities.forEach((activity) => {
        if (activity.action.includes('query')) usageMap.troubleshooting++;
        if (activity.action === 'document_compare')
          usageMap.documentComparison++;
        if (activity.action === 'document_review') usageMap.documentReview++;
        if (activity.action === 'learning_shared')
          usageMap.learningSharing++;
        if (activity.action === 'signal_uploaded') usageMap.signalMapping++;
      });

      const total = Object.values(usageMap).reduce((a, b) => a + b, 0);

      return {
        features: Object.entries(usageMap).map(([feature, count]) => ({
          feature,
          count,
          percentage: ((count / total) * 100).toFixed(2),
        })),
        totalUsage: total,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to get feature usage',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async recordActivity(
    userId: number,
    action: string,
    metadata?: any,
  ) {
    try {
      const activity = new this.userActivityModel({
        userId,
        action,
        metadata,
        timestamp: new Date(),
      });
      await activity.save();
    } catch (error) {
      console.error('Error recording activity:', error);
    }
  }

  async recordQueryMetric(
    userId: number,
    question: string,
    helpful: boolean,
  ) {
    try {
      const metric = this.queryMetricRepository.create({
        userId,
        question,
        helpful,
        views: 1,
        helpfulCount: helpful ? 1 : 0,
      });
      await this.queryMetricRepository.save(metric);
    } catch (error) {
      console.error('Error recording query metric:', error);
    }
  }

  private getPeriodStartDate(period: string): Date {
    const now = new Date();
    const periodMap = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };

    const days = periodMap[period] || 7;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    return startDate;
  }

  private async getDocumentCount(collection: string): Promise<number> {
    // This would query the appropriate collection
    return 0;
  }
}
