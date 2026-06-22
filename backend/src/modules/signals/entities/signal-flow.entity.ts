import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('signal_flows')
export class SignalFlow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  diagramId: number;

  @Column()
  projectId: string;

  @Column()
  fromUnit: string;

  @Column()
  toUnit: string;

  @Column({ nullable: true })
  signalType: string; // 'digital', 'analog', 'power', etc.

  @Column({ nullable: true })
  signalName: string;

  @Column({ nullable: true, type: 'float' })
  voltage: number;

  @Column({ nullable: true, type: 'float' })
  current: number;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}
