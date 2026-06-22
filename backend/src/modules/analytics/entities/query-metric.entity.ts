import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('query_metrics')
export class QueryMetric {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column('text')
  question: string;

  @Column({ default: false })
  helpful: boolean;

  @Column({ default: 0 })
  views: number;

  @Column({ default: 0 })
  helpfulCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
