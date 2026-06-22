import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('queries')
export class Query {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ nullable: true })
  projectId: string;

  @Column('text')
  question: string;

  @Column('text')
  answer: string;

  @Column('simple-json', { nullable: true })
  sources: any[];

  @Column({ nullable: true })
  conversationId: string;

  @Column({ default: 0 })
  userRating: number;

  @Column({ default: false })
  isFeedbackGiven: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
