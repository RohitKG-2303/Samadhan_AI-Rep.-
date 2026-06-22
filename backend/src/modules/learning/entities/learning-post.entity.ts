import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('learning_posts')
export class LearningPost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  mongoId: string;

  @Column()
  projectId: string;

  @Column()
  title: string;

  @Column()
  category: string;

  @Column({ default: 0 })
  views: number;

  @Column({ default: 0 })
  likes: number;

  @CreateDateColumn()
  createdAt: Date;
}
