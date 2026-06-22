import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthModule } from './modules/auth/auth.module';
import { TroubleshootingModule } from './modules/troubleshooting/troubleshooting.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { LearningModule } from './modules/learning/learning.module';
import { SignalsModule } from './modules/signals/signals.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development',
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION },
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    AuthModule,
    TroubleshootingModule,
    DocumentsModule,
    LearningModule,
    SignalsModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
