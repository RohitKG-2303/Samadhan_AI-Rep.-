import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as AWS from 'aws-sdk';

import { Document } from './entities/document.entity';
import { DocumentReview } from './entities/document-review.entity';
import { Comparison } from './entities/comparison.entity';
import { CompareDocumentsDto } from './dto/compare-documents.dto';
import { ReviewDocumentDto } from './dto/review-document.dto';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(DocumentReview)
    private reviewRepository: Repository<DocumentReview>,
    @InjectRepository(Comparison)
    private comparisonRepository: Repository<Comparison>,
    private httpService: HttpService,
  ) {}

  async uploadDocument(
    userId: number,
    file: Express.Multer.File,
    projectId: string,
    title: string,
    description?: string,
  ) {
    try {
      // Upload to S3
      const s3Key = `documents/${projectId}/${Date.now()}-${file.originalname}`;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      await s3.putObject(params).promise();
      const s3Url = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${s3Key}`;

      // Parse document using ML service
      const parsedContent = await this.parseDocument(file);

      // Create document record
      const document = this.documentRepository.create({
        userId,
        projectId,
        title,
        description,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        s3Url,
        s3Key,
        content: parsedContent,
      });

      const savedDocument = await this.documentRepository.save(document);

      // Trigger embedding creation asynchronously
      this.createEmbeddings(savedDocument.id, parsedContent);

      return {
        documentId: savedDocument.id,
        title: savedDocument.title,
        fileName: savedDocument.fileName,
        uploadedAt: savedDocument.createdAt,
        message: 'Document uploaded successfully',
      };
    } catch (error) {
      throw new HttpException(
        'Failed to upload document: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async listDocuments(userId: number) {
    try {
      const documents = await this.documentRepository.find({
        where: { userId },
        select: ['id', 'title', 'projectId', 'fileName', 'createdAt', 'fileSize'],
        order: { createdAt: 'DESC' },
      });

      return {
        count: documents.length,
        documents,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to list documents',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getDocument(documentId: string, userId: number) {
    try {
      const document = await this.documentRepository.findOne({
        where: { id: parseInt(documentId), userId },
      });

      if (!document) {
        throw new HttpException(
          'Document not found',
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        id: document.id,
        title: document.title,
        description: document.description,
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        content: document.content,
        createdAt: document.createdAt,
        s3Url: document.s3Url,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve document',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async compareDocuments(
    userId: number,
    compareDto: CompareDocumentsDto,
  ) {
    try {
      const { doc1Id, doc2Id, highlightFormat } = compareDto;

      // Get both documents
      const [doc1, doc2] = await Promise.all([
        this.documentRepository.findOne({ where: { id: doc1Id, userId } }),
        this.documentRepository.findOne({ where: { id: doc2Id, userId } }),
      ]);

      if (!doc1 || !doc2) {
        throw new HttpException(
          'One or both documents not found',
          HttpStatus.NOT_FOUND,
        );
      }

      // Call ML service for comparison
      const comparisonResult = await firstValueFrom(
        this.httpService.post('http://ml-services:5000/api/documents/compare', {
          doc1: doc1.content,
          doc2: doc2.content,
        }),
      );

      const differences = comparisonResult.data.differences;

      // Create comparison record
      const comparison = this.comparisonRepository.create({
        userId,
        doc1Id,
        doc2Id,
        differences: differences,
        comparisonType: highlightFormat || 'table',
      });

      const savedComparison = await this.comparisonRepository.save(comparison);

      return {
        comparisonId: savedComparison.id,
        doc1: { id: doc1.id, title: doc1.title },
        doc2: { id: doc2.id, title: doc2.title },
        differences: this.formatDifferences(differences, highlightFormat),
        summary: this.generateComparisonSummary(differences),
      };
    } catch (error) {
      throw new HttpException(
        'Failed to compare documents: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async reviewDocument(
    userId: number,
    reviewDto: ReviewDocumentDto,
  ) {
    try {
      const { documentId } = reviewDto;

      // Get document
      const document = await this.documentRepository.findOne({
        where: { id: documentId, userId },
      });

      if (!document) {
        throw new HttpException(
          'Document not found',
          HttpStatus.NOT_FOUND,
        );
      }

      // Call ML service for review and error detection
      const reviewResult = await firstValueFrom(
        this.httpService.post('http://ml-services:5000/api/documents/review', {
          content: document.content,
          title: document.title,
        }),
      );

      const errors = reviewResult.data.errors || [];

      // Create review record
      const review = this.reviewRepository.create({
        userId,
        documentId,
        errors: errors,
        inconsistencies: reviewResult.data.inconsistencies || [],
        typos: reviewResult.data.typos || [],
        summary: reviewResult.data.summary || '',
      });

      const savedReview = await this.reviewRepository.save(review);

      return {
        reviewId: savedReview.id,
        documentTitle: document.title,
        totalIssuesFound: errors.length,
        issues: {
          errors: errors,
          inconsistencies: reviewResult.data.inconsistencies || [],
          typos: reviewResult.data.typos || [],
        },
        summary: reviewResult.data.summary,
        recommendations: this.generateRecommendations(errors),
      };
    } catch (error) {
      throw new HttpException(
        'Failed to review document: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getReview(reviewId: string, userId: number) {
    try {
      const review = await this.reviewRepository.findOne({
        where: { id: parseInt(reviewId), userId },
        relations: ['document'],
      });

      if (!review) {
        throw new HttpException(
          'Review not found',
          HttpStatus.NOT_FOUND,
        );
      }

      return review;
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve review',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getComparison(comparisonId: string, userId: number) {
    try {
      const comparison = await this.comparisonRepository.findOne({
        where: { id: parseInt(comparisonId), userId },
        relations: ['doc1', 'doc2'],
      });

      if (!comparison) {
        throw new HttpException(
          'Comparison not found',
          HttpStatus.NOT_FOUND,
        );
      }

      return comparison;
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve comparison',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async parseDocument(file: Express.Multer.File): Promise<string> {
    try {
      // Call ML service to parse PDF/document
      const response = await firstValueFrom(
        this.httpService.post(
          'http://ml-services:5000/api/documents/parse',
          { file: file.buffer.toString('base64'), type: file.mimetype },
        ),
      );
      return response.data.content;
    } catch (error) {
      console.error('Error parsing document:', error);
      return '';
    }
  }

  private async createEmbeddings(
    documentId: number,
    content: string,
  ) {
    try {
      // Call ML service to create embeddings asynchronously
      // This would typically be a background job
      await firstValueFrom(
        this.httpService.post('http://ml-services:5000/api/embeddings/create', {
          documentId,
          text: content,
        }),
      );
    } catch (error) {
      console.error('Error creating embeddings:', error);
    }
  }

  private formatDifferences(
    differences: any[],
    format: string = 'table',
  ) {
    if (format === 'table') {
      return {
        format: 'table',
        columns: ['Section', 'Document 1', 'Document 2', 'Difference Type'],
        rows: differences.map((diff) => ([
          diff.section || 'N/A',
          diff.value1 || '',
          diff.value2 || '',
          diff.type || 'modification',
        ])),
      };
    } else if (format === 'highlighted') {
      return {
        format: 'highlighted',
        doc1Highlighted: this.highlightText(differences, 'doc1'),
        doc2Highlighted: this.highlightText(differences, 'doc2'),
      };
    }
    return differences;
  }

  private highlightText(differences: any[], docVersion: string): string {
    let highlighted = '';
    differences.forEach((diff) => {
      const value = docVersion === 'doc1' ? diff.value1 : diff.value2;
      highlighted += `<span class="highlight-${diff.type || 'modified'}">${value}</span>`;
    });
    return highlighted;
  }

  private generateComparisonSummary(differences: any[]) {
    const typeCount = {};
    differences.forEach((diff) => {
      const type = diff.type || 'modification';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    return {
      totalDifferences: differences.length,
      byType: typeCount,
    };
  }

  private generateRecommendations(errors: any[]) {
    return errors.map((error) => ({
      issue: error.message,
      severity: error.severity || 'medium',
      suggestion: this.getSuggestion(error),
    }));
  }

  private getSuggestion(error: any): string {
    if (error.type === 'typo') {
      return `Did you mean: ${error.suggestion}`;
    } else if (error.type === 'inconsistency') {
      return `Please ensure consistency with: ${error.reference}`;
    } else if (error.type === 'missing') {
      return `This section is missing required information`;
    }
    return 'Please review this section';
  }
}
