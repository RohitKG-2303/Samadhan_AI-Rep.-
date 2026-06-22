import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('feedback')
export class Feedback {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  queryId: number;

  @Column()
  rating: number;

  @Column({ nullable: true, type: 'text' })
  correction: string;

  @Column()
  helpful: boolean;

  @CreateDateColumn()
  timestamp: Date;
}
