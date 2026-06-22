import { Controller, Post, Get, Body, UseGuards, Request, Param, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompareDocumentsDto } from './dto/compare-documents.dto';
import { ReviewDocumentDto } from './dto/review-document.dto';

@Controller('documents')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { projectId: string; title: string; description?: string },
    @Request() req,
  ) {
    return this.documentsService.uploadDocument(
      req.user.id,
      file,
      body.projectId,
      body.title,
      body.description,
    );
  }

  @Get('list')
  @UseGuards(JwtAuthGuard)
  async listDocuments(@Request() req) {
    return this.documentsService.listDocuments(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getDocument(@Param('id') id: string, @Request() req) {
    return this.documentsService.getDocument(id, req.user.id);
  }

  @Post('compare')
  @UseGuards(JwtAuthGuard)
  async compareDocuments(
    @Body() compareDto: CompareDocumentsDto,
    @Request() req,
  ) {
    return this.documentsService.compareDocuments(
      req.user.id,
      compareDto,
    );
  }

  @Post('review')
  @UseGuards(JwtAuthGuard)
  async reviewDocument(
    @Body() reviewDto: ReviewDocumentDto,
    @Request() req,
  ) {
    return this.documentsService.reviewDocument(
      req.user.id,
      reviewDto,
    );
  }

  @Get('review/:id')
  @UseGuards(JwtAuthGuard)
  async getReview(@Param('id') id: string, @Request() req) {
    return this.documentsService.getReview(id, req.user.id);
  }

  @Get('comparison/:id')
  @UseGuards(JwtAuthGuard)
  async getComparison(@Param('id') id: string, @Request() req) {
    return this.documentsService.getComparison(id, req.user.id);
  }
}
