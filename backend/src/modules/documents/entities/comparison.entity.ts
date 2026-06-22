import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Document } from './document.entity';

@Entity('comparisons')
export class Comparison {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  doc1Id: number;

  @Column()
  doc2Id: number;

  @ManyToOne(() => Document)
  @JoinColumn({ name: 'doc1Id' })
  doc1: Document;

  @ManyToOne(() => Document)
  @JoinColumn({ name: 'doc2Id' })
  doc2: Document;

  @Column('simple-json')
  differences: any[];

  @Column({ default: 'table' })
  comparisonType: string;

  @CreateDateColumn()
  createdAt: Date;
}
