import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('user_activities')
export class UserActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  action: string;

  @Column('simple-json', { nullable: true })
  metadata: any;

  @CreateDateColumn()
  timestamp: Date;
}
