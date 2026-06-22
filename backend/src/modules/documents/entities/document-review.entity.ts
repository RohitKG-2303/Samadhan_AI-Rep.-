import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Document } from './document.entity';

@Entity('document_reviews')
export class DocumentReview {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  documentId: number;

  @ManyToOne(() => Document)
  @JoinColumn({ name: 'documentId' })
  document: Document;

  @Column('simple-json')
  errors: any[];

  @Column('simple-json')
  inconsistencies: any[];

  @Column('simple-json')
  typos: any[];

  @Column('text', { nullable: true })
  summary: string;

  @CreateDateColumn()
  createdAt: Date;
}
