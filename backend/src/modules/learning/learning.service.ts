import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { LearningPost } from './entities/learning-post.entity';
import { CreateLearningDto } from './dto/create-learning.dto';
import { UpdateLearningDto } from './dto/update-learning.dto';

@Injectable()
export class LearningService {
  constructor(
    @InjectRepository(LearningPost)
    private learningPostRepository: Repository<LearningPost>,
    @InjectModel('learnings')
    private learningModel: Model<any>,
    @InjectModel('learningTags')
    private tagModel: Model<any>,
    private httpService: HttpService,
  ) {}

  async createLearning(userId: number, createDto: CreateLearningDto) {
    try {
      const {
        title,
        content,
        projectId,
        category,
        tags,
        issue,
        solution,
        keyTakeaways,
      } = createDto;

      // Format content according to project template
      const formattedContent = this.formatLearningContent({
        title,
        content,
        issue,
        solution,
        keyTakeaways,
      });

      // Create embeddings for semantic search
      const embeddings = await this.createEmbeddings(
        `${title} ${content}`,
      );

      // Save to MongoDB for flexible schema
      const learning = new this.learningModel({
        userId,
        title,
        formattedContent,
        projectId,
        category,
        tags,
        issue,
        solution,
        keyTakeaways,
        embeddings,
        likes: 0,
        views: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedLearning = await learning.save();

      // Also save metadata to PostgreSQL for analytics
      const learningPost = this.learningPostRepository.create({
        userId,
        projectId,
        mongoId: savedLearning._id.toString(),
        title,
        category,
      });
      await this.learningPostRepository.save(learningPost);

      return {
        learningId: savedLearning._id.toString(),
        title: savedLearning.title,
        createdAt: savedLearning.createdAt,
        message: 'Learning shared successfully',
        formattedDocument: formattedContent,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to create learning: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getLearningFeed(
    userId: number,
    page: number = 1,
    limit: number = 10,
    projectId?: string,
  ) {
    try {
      const skip = (page - 1) * limit;
      const query = projectId ? { projectId } : {};

      const learnings = await this.learningModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          '_id title projectId category tags createdAt updatedAt userId likes views issue',
        );

      const total = await this.learningModel.countDocuments(query);

      return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        learnings: learnings.map((l) => ({
          learningId: l._id.toString(),
          title: l.title,
          projectId: l.projectId,
          category: l.category,
          tags: l.tags,
          issue: l.issue,
          createdAt: l.createdAt,
          likes: l.likes,
          views: l.views,
        })),
      };
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve learning feed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async searchLearnings(
    userId: number,
    keyword: string,
    projectId?: string,
  ) {
    try {
      // Semantic search using embeddings
      const keywordEmbeddings = await this.createEmbeddings(keyword);

      const query: any = {
        $or: [
          { title: { $regex: keyword, $options: 'i' } },
          { content: { $regex: keyword, $options: 'i' } },
          { tags: { $in: [keyword] } },
        ],
      };

      if (projectId) {
        query.projectId = projectId;
      }

      const results = await this.learningModel
        .find(query)
        .limit(20)
        .select(
          '_id title projectId category tags createdAt userId likes issue',
        );

      return {
        keyword,
        resultsCount: results.length,
        results: results.map((l) => ({
          learningId: l._id.toString(),
          title: l.title,
          projectId: l.projectId,
          category: l.category,
          tags: l.tags,
          issue: l.issue,
        })),
      };
    } catch (error) {
      throw new HttpException(
        'Failed to search learnings',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getLearning(learningId: string, userId: number) {
    try {
      const learning = await this.learningModel.findById(learningId);

      if (!learning) {
        throw new HttpException(
          'Learning not found',
          HttpStatus.NOT_FOUND,
        );
      }

      // Increment views
      learning.views = (learning.views || 0) + 1;
      await learning.save();

      return {
        learningId: learning._id.toString(),
        title: learning.title,
        formattedContent: learning.formattedContent,
        projectId: learning.projectId,
        category: learning.category,
        tags: learning.tags,
        issue: learning.issue,
        solution: learning.solution,
        keyTakeaways: learning.keyTakeaways,
        createdAt: learning.createdAt,
        updatedAt: learning.updatedAt,
        likes: learning.likes,
        views: learning.views,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve learning',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateLearning(
    learningId: string,
    userId: number,
    updateDto: UpdateLearningDto,
  ) {
    try {
      const learning = await this.learningModel.findOne({
        _id: learningId,
        userId,
      });

      if (!learning) {
        throw new HttpException(
          'Learning not found or unauthorized',
          HttpStatus.NOT_FOUND,
        );
      }

      Object.assign(learning, updateDto);
      learning.updatedAt = new Date();
      await learning.save();

      return {
        learningId: learning._id.toString(),
        message: 'Learning updated successfully',
      };
    } catch (error) {
      throw new HttpException(
        'Failed to update learning',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteLearning(learningId: string, userId: number) {
    try {
      const result = await this.learningModel.deleteOne({
        _id: learningId,
        userId,
      });

      if (result.deletedCount === 0) {
        throw new HttpException(
          'Learning not found or unauthorized',
          HttpStatus.NOT_FOUND,
        );
      }

      // Delete from PostgreSQL metadata
      await this.learningPostRepository.delete({ mongoId: learningId });

      return { message: 'Learning deleted successfully' };
    } catch (error) {
      throw new HttpException(
        'Failed to delete learning',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async likeLearning(learningId: string, userId: number) {
    try {
      const learning = await this.learningModel.findById(learningId);

      if (!learning) {
        throw new HttpException(
          'Learning not found',
          HttpStatus.NOT_FOUND,
        );
      }

      learning.likes = (learning.likes || 0) + 1;
      await learning.save();

      return {
        learningId: learning._id.toString(),
        likes: learning.likes,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to like learning',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAvailableTags(projectId?: string) {
    try {
      const query = projectId ? { projectId } : {};
      const tags = await this.tagModel.find(query).select('name');

      return {
        tags: tags.map((t) => t.name),
        count: tags.length,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve tags',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private formatLearningContent(data: any): string {
    return `
# ${data.title}

## Problem Statement
${data.issue || 'N/A'}

## Solution
${data.solution || 'N/A'}

## Details
${data.content || 'N/A'}

## Key Takeaways
${data.keyTakeaways ? data.keyTakeaways.map((k) => `- ${k}`).join('\n') : 'N/A'}
    `;
  }

  private async createEmbeddings(text: string): Promise<number[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.post('http://ml-services:5000/api/embeddings/create', {
          text,
        }),
      );
      return response.data.embeddings;
    } catch (error) {
      console.error('Error creating embeddings:', error);
      return [];
    }
  }
}
