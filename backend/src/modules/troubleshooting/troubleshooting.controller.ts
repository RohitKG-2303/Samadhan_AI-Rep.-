import { Controller, Post, Get, Body, UseGuards, Request, Param } from '@nestjs/common';
import { TroubleshootingService } from './troubleshooting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AskQuestionDto } from './dto/ask-question.dto';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';

@Controller('troubleshooting')
export class TroubleshootingController {
  constructor(private troubleshootingService: TroubleshootingService) {}

  @Post('ask')
  @UseGuards(JwtAuthGuard)
  async askQuestion(@Body() askQuestionDto: AskQuestionDto, @Request() req) {
    return this.troubleshootingService.processQuery(
      req.user.id,
      askQuestionDto,
    );
  }

  @Post('feedback')
  @UseGuards(JwtAuthGuard)
  async submitFeedback(
    @Body() feedbackDto: SubmitFeedbackDto,
    @Request() req,
  ) {
    return this.troubleshootingService.recordFeedback(
      req.user.id,
      feedbackDto,
    );
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getChatHistory(@Request() req) {
    return this.troubleshootingService.getUserChatHistory(req.user.id);
  }

  @Get('conversation/:conversationId')
  @UseGuards(JwtAuthGuard)
  async getConversation(
    @Param('conversationId') conversationId: string,
    @Request() req,
  ) {
    return this.troubleshootingService.getConversation(
      conversationId,
      req.user.id,
    );
  }
}
