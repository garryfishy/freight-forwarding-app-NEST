import { Quotation } from 'src/quotations/entities/quotation.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity({ name: 't_quotation_files' })
export class QuotationFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'rfq_number',
  })
  rfqNumber: string;

  @Column({
    name: 'file_container',
  })
  fileContainer: string;

  @Column({
    name: 'file_name',
  })
  fileName: string;
  
  @Column({
    name: 'original_name',
  })
  originalName: string;

  @Column()
  url: string;

  @Column({
    name: 'created_by_user_id',
  })
  createdByUserId: number;

  @Column({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  // Relation
  @ManyToOne(() => Quotation, (quotation) => quotation.quotationFiles)
  @JoinColumn({ name: 'rfq_number', referencedColumnName: 'rfqNumber' })
  quotation: Quotation;

}
