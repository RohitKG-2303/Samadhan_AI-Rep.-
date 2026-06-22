import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as AWS from 'aws-sdk';

import { Diagram } from './entities/diagram.entity';
import { SignalFlow } from './entities/signal-flow.entity';
import { Unit } from './entities/unit.entity';
import { AnalyzeSignalDto } from './dto/analyze-signal.dto';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

@Injectable()
export class SignalsService {
  constructor(
    @InjectRepository(Diagram)
    private diagramRepository: Repository<Diagram>,
    @InjectRepository(SignalFlow)
    private signalFlowRepository: Repository<SignalFlow>,
    @InjectRepository(Unit)
    private unitRepository: Repository<Unit>,
    private httpService: HttpService,
  ) {}

  async uploadDiagram(
    userId: number,
    file: Express.Multer.File,
    projectId: string,
    unitName: string,
    diagramType: string,
  ) {
    try {
      // Upload to S3
      const s3Key = `diagrams/${projectId}/${unitName}/${Date.now()}-${file.originalname}`;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      await s3.putObject(params).promise();
      const s3Url = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${s3Key}`;

      // Process diagram with ML service to extract connections
      const extractedData = await this.extractDiagramData(
        file,
        diagramType,
      );

      // Create or update unit
      let unit = await this.unitRepository.findOne({
        where: { projectId, name: unitName, userId },
      });

      if (!unit) {
        unit = this.unitRepository.create({
          userId,
          projectId,
          name: unitName,
          connections: [],
        });
        await this.unitRepository.save(unit);
      }

      // Create diagram record
      const diagram = this.diagramRepository.create({
        userId,
        projectId,
        unitId: unit.id,
        unitName,
        diagramType,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        s3Url,
        s3Key,
        extractedData: extractedData,
      });

      const savedDiagram = await this.diagramRepository.save(diagram);

      // Create signal flow records from extracted data
      if (extractedData.connections && extractedData.connections.length > 0) {
        for (const connection of extractedData.connections) {
          const signalFlow = this.signalFlowRepository.create({
            diagramId: savedDiagram.id,
            projectId,
            fromUnit: connection.from,
            toUnit: connection.to,
            signalType: connection.type,
            signalName: connection.name,
            voltage: connection.voltage,
            current: connection.current,
            description: connection.description,
          });
          await this.signalFlowRepository.save(signalFlow);
        }
      }

      return {
        diagramId: savedDiagram.id,
        unitName,
        fileName: savedDiagram.fileName,
        uploadedAt: savedDiagram.createdAt,
        connectionsFound: extractedData.connections?.length || 0,
        message: 'Diagram uploaded and processed successfully',
      };
    } catch (error) {
      throw new HttpException(
        'Failed to upload diagram: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getProjectSignalFlow(
    userId: number,
    projectId: string,
  ) {
    try {
      // Get all units in project
      const units = await this.unitRepository.find({
        where: { projectId, userId },
      });

      if (units.length === 0) {
        throw new HttpException(
          'No units found for this project',
          HttpStatus.NOT_FOUND,
        );
      }

      // Get all signal flows for this project
      const signalFlows = await this.signalFlowRepository.find({
        where: { projectId },
      });

      // Build graph structure for visualization
      const nodes = units.map((unit) => ({
        id: unit.id,
        label: unit.name,
        type: 'unit',
      }));

      const edges = signalFlows.map((flow) => ({
        id: flow.id,
        source: flow.fromUnit,
        target: flow.toUnit,
        label: flow.signalName || flow.signalType,
        signalType: flow.signalType,
        voltage: flow.voltage,
        current: flow.current,
      }));

      return {
        projectId,
        nodes,
        edges,
        metadata: {
          totalUnits: units.length,
          totalConnections: signalFlows.length,
        },
      };
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve signal flow: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async analyzeSignalFlow(
    userId: number,
    analyzeDto: AnalyzeSignalDto,
  ) {
    try {
      const { projectId, fromUnit, toUnit } = analyzeDto;

      // Get all paths from source to destination
      const paths = await this.findSignalPaths(
        projectId,
        fromUnit,
        toUnit,
      );

      // Analyze each path
      const analysis = paths.map((path) => ({
        path: path.path,
        distance: path.distance,
        signalTypes: path.signalTypes,
        totalVoltage: path.totalVoltage,
        potentialIssues: this.identifyPotentialIssues(path),
      }));

      return {
        projectId,
        fromUnit,
        toUnit,
        pathsFound: paths.length,
        analysis,
        recommendations: this.generateRecommendations(analysis),
      };
    } catch (error) {
      throw new HttpException(
        'Failed to analyze signal flow: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUnitConnections(
    userId: number,
    projectId: string,
  ) {
    try {
      const units = await this.unitRepository.find({
        where: { projectId, userId },
      });

      const connectionMap = {};

      for (const unit of units) {
        const incomingFlows = await this.signalFlowRepository.find({
          where: { toUnit: unit.name },
        });
        const outgoingFlows = await this.signalFlowRepository.find({
          where: { fromUnit: unit.name },
        });

        connectionMap[unit.name] = {
          unitId: unit.id,
          incoming: incomingFlows.map((f) => ({
            from: f.fromUnit,
            signalType: f.signalType,
            signalName: f.signalName,
          })),
          outgoing: outgoingFlows.map((f) => ({
            to: f.toUnit,
            signalType: f.signalType,
            signalName: f.signalName,
          })),
        };
      }

      return {
        projectId,
        totalUnits: units.length,
        connections: connectionMap,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve unit connections',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getDiagram(
    diagramId: string,
    userId: number,
  ) {
    try {
      const diagram = await this.diagramRepository.findOne({
        where: { id: parseInt(diagramId), userId },
      });

      if (!diagram) {
        throw new HttpException(
          'Diagram not found',
          HttpStatus.NOT_FOUND,
        );
      }

      const signalFlows = await this.signalFlowRepository.find({
        where: { diagramId: diagram.id },
      });

      return {
        diagramId: diagram.id,
        unitName: diagram.unitName,
        diagramType: diagram.diagramType,
        fileName: diagram.fileName,
        s3Url: diagram.s3Url,
        createdAt: diagram.createdAt,
        connections: signalFlows,
        extractedData: diagram.extractedData,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve diagram',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async extractDiagramData(
    file: Express.Multer.File,
    diagramType: string,
  ) {
    try {
      // Call ML service to extract connections from image/PDF
      const response = await firstValueFrom(
        this.httpService.post(
          'http://ml-services:5000/api/signals/analyze',
          {
            file: file.buffer.toString('base64'),
            type: file.mimetype,
            diagramType,
          },
        ),
      );
      return response.data.data || { connections: [] };
    } catch (error) {
      console.error('Error extracting diagram data:', error);
      return { connections: [] };
    }
  }

  private async findSignalPaths(
    projectId: string,
    fromUnit: string,
    toUnit: string,
  ): Promise<any[]> {
    // BFS to find paths from source to destination
    const flows = await this.signalFlowRepository.find({
      where: { projectId },
    });

    const adjacencyMap = {};
    flows.forEach((flow) => {
      if (!adjacencyMap[flow.fromUnit]) {
        adjacencyMap[flow.fromUnit] = [];
      }
      adjacencyMap[flow.fromUnit].push(flow);
    });

    const paths = [];
    const queue = [[fromUnit, [fromUnit]]];

    while (queue.length > 0) {
      const [current, path] = queue.shift();

      if (current === toUnit) {
        paths.push({
          path,
          distance: path.length - 1,
          signalTypes: flows
            .filter((f) => path.includes(f.fromUnit))
            .map((f) => f.signalType),
          totalVoltage: flows
            .filter((f) => path.includes(f.fromUnit))
            .reduce((sum, f) => sum + (f.voltage || 0), 0),
        });
      } else if (path.length < 10) {
        // Limit path depth
        if (adjacencyMap[current]) {
          adjacencyMap[current].forEach((flow) => {
            if (!path.includes(flow.toUnit)) {
              queue.push([flow.toUnit, [...path, flow.toUnit]]);
            }
          });
        }
      }
    }

    return paths;
  }

  private identifyPotentialIssues(path: any): string[] {
    const issues = [];

    if (path.distance > 5) {
      issues.push('Long signal path - may cause signal degradation');
    }

    if (path.signalTypes.includes('analog')) {
      issues.push('Analog signal - susceptible to noise');
    }

    return issues;
  }

  private generateRecommendations(analysis: any[]): string[] {
    const recommendations = [];

    if (analysis.length > 1) {
      recommendations.push(
        'Multiple signal paths detected - consider redundancy',
      );
    }

    const issues = analysis.flatMap((a) => a.potentialIssues);
    if (issues.length > 0) {
      recommendations.push(
        'Review signal integrity along detected paths',
      );
    }

    return recommendations;
  }
}
