import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';

import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { UserActivity } from './entities/user-activity.entity';
import { QueryMetric } from './entities/query-metric.entity';
import { UserActivitySchema } from './schemas/user-activity.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserActivity, QueryMetric]),
    MongooseModule.forFeature([
      { name: 'userActivities', schema: UserActivitySchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
