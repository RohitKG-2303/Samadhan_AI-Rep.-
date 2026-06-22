import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';

import { TroubleshootingController } from './troubleshooting.controller';
import { TroubleshootingService } from './troubleshooting.service';
import { Query } from './entities/query.entity';
import { Feedback } from './entities/feedback.entity';
import { QuerySchema } from './schemas/query.schema';
import { ConversationSchema } from './schemas/conversation.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([Query, Feedback]),
    MongooseModule.forFeature([
      { name: 'queries', schema: QuerySchema },
      { name: 'conversations', schema: ConversationSchema },
    ]),
    HttpModule,
  ],
  controllers: [TroubleshootingController],
  providers: [TroubleshootingService],
  exports: [TroubleshootingService],
})
export class TroubleshootingModule {}
