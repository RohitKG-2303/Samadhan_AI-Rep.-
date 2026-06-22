import { Controller, Post, Get, Body, UseGuards, Request, Param, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SignalsService } from './signals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyzeSignalDto } from './dto/analyze-signal.dto';

@Controller('signals')
export class SignalsController {
  constructor(private signalsService: SignalsService) {}

  @Post('upload-schematic')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadSchematic(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { projectId: string; unitName: string; diagramType: string },
    @Request() req,
  ) {
    return this.signalsService.uploadDiagram(
      req.user.id,
      file,
      body.projectId,
      body.unitName,
      body.diagramType,
    );
  }

  @Get(':projectId')
  @UseGuards(JwtAuthGuard)
  async getSignalFlow(
    @Param('projectId') projectId: string,
    @Request() req,
  ) {
    return this.signalsService.getProjectSignalFlow(
      req.user.id,
      projectId,
    );
  }

  @Post('analyze')
  @UseGuards(JwtAuthGuard)
  async analyzeSignalFlow(
    @Body() analyzeDto: AnalyzeSignalDto,
    @Request() req,
  ) {
    return this.signalsService.analyzeSignalFlow(
      req.user.id,
      analyzeDto,
    );
  }

  @Get('units/:projectId')
  @UseGuards(JwtAuthGuard)
  async getUnitConnections(
    @Param('projectId') projectId: string,
    @Request() req,
  ) {
    return this.signalsService.getUnitConnections(
      req.user.id,
      projectId,
    );
  }

  @Get('diagram/:diagramId')
  @UseGuards(JwtAuthGuard)
  async getDiagram(
    @Param('diagramId') diagramId: string,
    @Request() req,
  ) {
    return this.signalsService.getDiagram(diagramId, req.user.id);
  }
}
