import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';

import { LearningController } from './learning.controller';
import { LearningService } from './learning.service';
import { LearningPost } from './entities/learning-post.entity';
import { LearningSchema } from './schemas/learning.schema';
import { LearningTagSchema } from './schemas/learning-tag.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([LearningPost]),
    MongooseModule.forFeature([
      { name: 'learnings', schema: LearningSchema },
      { name: 'learningTags', schema: LearningTagSchema },
    ]),
    HttpModule,
  ],
  controllers: [LearningController],
  providers: [LearningService],
  exports: [LearningService],
})
export class LearningModule {}
