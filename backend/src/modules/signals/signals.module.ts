import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { SignalsController } from './signals.controller';
import { SignalsService } from './signals.service';
import { Diagram } from './entities/diagram.entity';
import { SignalFlow } from './entities/signal-flow.entity';
import { Unit } from './entities/unit.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Diagram, SignalFlow, Unit]),
    HttpModule,
  ],
  controllers: [SignalsController],
  providers: [SignalsService],
  exports: [SignalsService],
})
export class SignalsModule {}
