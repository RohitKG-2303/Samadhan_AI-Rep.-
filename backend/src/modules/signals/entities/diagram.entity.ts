import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Unit } from './unit.entity';

@Entity('diagrams')
export class Diagram {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  projectId: string;

  @Column()
  unitId: number;

  @Column()
  unitName: string;

  @Column()
  diagramType: string; // 'wiring', 'schematic', 'electrical'

  @Column()
  fileName: string;

  @Column()
  fileSize: number;

  @Column()
  mimeType: string;

  @Column()
  s3Url: string;

  @Column()
  s3Key: string;

  @Column('simple-json', { nullable: true })
  extractedData: any;

  @ManyToOne(() => Unit)
  @JoinColumn({ name: 'unitId' })
  unit: Unit;

  @CreateDateColumn()
  createdAt: Date;
}
