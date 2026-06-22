import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { Document } from './entities/document.entity';
import { DocumentReview } from './entities/document-review.entity';
import { Comparison } from './entities/comparison.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, DocumentReview, Comparison]),
    HttpModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
