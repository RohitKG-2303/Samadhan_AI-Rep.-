import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { Query } from './entities/query.entity';
import { Feedback } from './entities/feedback.entity';
import { AskQuestionDto } from './dto/ask-question.dto';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';

@Injectable()
export class TroubleshootingService {
  constructor(
    @InjectRepository(Query)
    private queryRepository: Repository<Query>,
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
    @InjectModel('queries')
    private queryModel: Model<any>,
    @InjectModel('conversations')
    private conversationModel: Model<any>,
    private httpService: HttpService,
  ) {}

  async processQuery(userId: number, askQuestionDto: AskQuestionDto) {
    const { question, projectId, conversationId } = askQuestionDto;

    try {
      // Step 1: Create/Get conversation
      let conversation = conversationId
        ? await this.conversationModel.findById(conversationId)
        : null;

      if (!conversation) {
        conversation = new this.conversationModel({
          userId,
          projectId,
          startedAt: new Date(),
          messages: [],
        });
        await conversation.save();
      }

      // Step 2: Get embeddings from ML service
      const embeddingsResponse = await firstValueFrom(
        this.httpService.post('http://ml-services:5000/api/embeddings/create', {
          text: question,
        }),
      );
      const queryEmbeddings = embeddingsResponse.data.embeddings;

      // Step 3: Retrieve relevant documents from vector DB
      // In production, this would query Pinecone
      const relevantDocuments = await this.retrieveRelevantDocuments(
        queryEmbeddings,
        projectId,
      );

      // Step 4: Generate answer using LLM
      const answer = await this.generateAnswer(
        question,
        relevantDocuments,
      );

      // Step 5: Save query and response
      const query = this.queryRepository.create({
        userId,
        projectId,
        question,
        answer: answer.response,
        sources: answer.sources,
        conversationId: conversation._id.toString(),
      });
      await this.queryRepository.save(query);

      // Step 6: Update conversation
      conversation.messages.push(
        {
          role: 'user',
          content: question,
          timestamp: new Date(),
        },
        {
          role: 'assistant',
          content: answer.response,
          sources: answer.sources,
          timestamp: new Date(),
        },
      );
      conversation.updatedAt = new Date();
      await conversation.save();

      return {
        conversationId: conversation._id.toString(),
        queryId: query.id,
        question,
        answer: answer.response,
        sources: answer.sources,
        stepwiseGuide: answer.stepwiseGuide,
        timestamp: new Date(),
      };
    } catch (error) {
      throw new HttpException(
        'Failed to process query: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async recordFeedback(userId: number, feedbackDto: SubmitFeedbackDto) {
    const { queryId, rating, correction, helpful } = feedbackDto;

    try {
      // Save feedback
      const feedback = this.feedbackRepository.create({
        userId,
        queryId,
        rating,
        correction,
        helpful,
        timestamp: new Date(),
      });
      await this.feedbackRepository.save(feedback);

      // Update query rating
      await this.queryRepository.update(
        { id: queryId },
        {
          userRating: rating,
          isFeedbackGiven: true,
        },
      );

      // Trigger retraining if feedback is negative (in background)
      if (!helpful) {
        this.triggerRetrainingPipeline(queryId, correction);
      }

      return {
        message: 'Feedback recorded successfully',
        feedbackId: feedback.id,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to record feedback',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserChatHistory(userId: number) {
    try {
      const conversations = await this.conversationModel
        .find({ userId })
        .select('_id projectId startedAt updatedAt messages')
        .sort({ updatedAt: -1 })
        .limit(20);

      return conversations.map((conv) => ({
        conversationId: conv._id.toString(),
        projectId: conv.projectId,
        messageCount: conv.messages.length,
        startedAt: conv.startedAt,
        updatedAt: conv.updatedAt,
        lastMessage: conv.messages[conv.messages.length - 1]?.content,
      }));
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve chat history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getConversation(conversationId: string, userId: number) {
    try {
      const conversation = await this.conversationModel.findOne({
        _id: conversationId,
        userId,
      });

      if (!conversation) {
        throw new HttpException(
          'Conversation not found',
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        conversationId: conversation._id.toString(),
        projectId: conversation.projectId,
        messages: conversation.messages,
        startedAt: conversation.startedAt,
        updatedAt: conversation.updatedAt,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve conversation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async retrieveRelevantDocuments(
    embeddings: number[],
    projectId: string,
  ) {
    // In production, query Pinecone or similar vector DB
    // For now, return mock data
    return [
      {
        id: '1',
        title: 'Getting Started Guide',
        content: 'Sample documentation content',
        relevanceScore: 0.95,
        section: 'Introduction',
      },
    ];
  }

  private async generateAnswer(
    question: string,
    documents: any[],
  ) {
    try {
      // Call OpenAI API with context from documents
      const response = await firstValueFrom(
        this.httpService.post(process.env.OPENAI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions', {
          model: process.env.OPENAI_MODEL || 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are Samadhan_AI, an intelligent project assistant. Answer the following question based on the provided documentation. Provide step-by-step troubleshooting if applicable. Format your response clearly with sections and bullet points.`,
            },
            {
              role: 'user',
              content: `Context from documentation:\n${documents.map((d) => d.content).join('\n\n')}\n\nQuestion: ${question}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }, {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }),
      );

      const content = response.data.choices[0].message.content;

      return {
        response: content,
        sources: documents.map((d) => ({
          title: d.title,
          section: d.section,
          relevanceScore: d.relevanceScore,
        })),
        stepwiseGuide: this.extractStepwiseGuide(content),
      };
    } catch (error) {
      throw new HttpException(
        'Failed to generate answer: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private extractStepwiseGuide(content: string) {
    // Parse content to extract numbered steps
    const stepPattern = /(\d+)\.\s+([^\n]+)/g;
    const steps = [];
    let match;

    while ((match = stepPattern.exec(content)) !== null) {
      steps.push({
        step: parseInt(match[1]),
        description: match[2],
      });
    }

    return steps.length > 0 ? steps : null;
  }

  private triggerRetrainingPipeline(
    queryId: number,
    correction: string,
  ) {
    // Asynchronously trigger ML retraining
    // This would typically send data to an ML service for model fine-tuning
    console.log(`Triggering retraining for query ${queryId}`);
  }
}
