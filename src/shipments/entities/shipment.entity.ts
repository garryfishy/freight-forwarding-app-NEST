import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne, OneToMany } from 'typeorm'
import { OtifStatus, ShipmentService, ShipmentStatus } from 'src/enums/enum'
import { Quotation } from 'src/quotations/entities/quotation.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { ShipmentOtif } from 'src/shipment-otifs/entities/shipment-otif.entity';
import { ShipmentFile } from 'src/shipment-files/entities/shipment-file.entity';
import { Revenue } from 'src/revenues/entities/revenue.entity';
import { Invoice } from 'src/invoices/entities/invoice.entity';
import { ShipmentSelllingPrice } from 'src/shipment-selling-prices/entities/shipment-selling-price.entity';

@Entity({ name: 't_shipments' })
export class Shipment {
  @PrimaryGeneratedColumn({
    name: 'id',
  })
  id: number;

  @Column({
    name: 'rfq_number',
    unique: true,
  })
  rfqNumber: string;
  
  @Column({
    name: 'order_number',
    unique: true,
  })
  orderNumber: string;

  @Column({
    name: 'customer_id',
  })
  customerId: string;

  @Column({
    name: 'shipment_status',
    type: 'enum',
    enum: ShipmentStatus,
    default: ShipmentStatus.WAITING
  })
  shipmentStatus: ShipmentStatus;

  @Column({
    name: 'otif_status',
    type: 'enum',
    enum: OtifStatus,
    default: OtifStatus.BOOKED,
  })
  otifStatus: OtifStatus;
  
  @Column({
    name: 'shipment_service',
    type: 'enum',
    enum: ShipmentService,
  })
  shipmentService: ShipmentService;

  // carrier information
  @Column({
    name: 'shipping_line',
  })
  shippingLine: string;

  @Column()
  vendor: string;

  @Column({
    name: 'master_bl',
    nullable: true,
  })
  masterBl: string;

  @Column({
    name: 'master_bl_type',
    nullable: true,
  })
  masterBlType: string;

  @Column({
    name: 'house_bl',
    nullable: true,
  })
  houseBl: string;

  @Column({
    name: 'house_bl_type',
    nullable: true,
  })
  houseBlType: string;

  @Column({
    nullable: true,
  })
  terms: string;

  // shipper
  @Column({
    name: 'shipper_name',
  })
  shipperName: string;

  @Column({
    name: 'shipper_company',
  })
  shipperCompany: string;

  @Column({
    name: 'shipper_phone_code',
  })
  shipperPhoneCode: string;


  @Column({
    name: 'shipper_phone',
  })
  shipperPhone: string;

  @Column({
    name: 'shipper_tax_id',
  })
  shipperTaxId: string;

  @Column({
    name: 'shipper_email',
  })
  shipperEmail: string;

  @Column({
    name: 'shipper_zip_code',
  })
  shipperZipCode: string;

  @Column({
    name: 'shipper_address',
    length: 500,
  })
  shipperAddress: string;

  // consignee
  @Column({
    name: 'consignee_name',
  })
  consigneeName: string;

  @Column({
    name: 'consignee_company',
  })
  consigneeCompany: string;

  @Column({
    name: 'consignee_phone_code',
  })
  consigneePhoneCode: string;

  @Column({
    name: 'consignee_phone',
  })
  consigneePhone: string;

  @Column({
    name: 'consignee_tax_id',
  })
  consigneeTaxId: string;

  @Column({
    name: 'consignee_email',
  })
  consigneeEmail: string;

  @Column({
    name: 'consignee_zip_code',
  })
  consigneeZipCode: string;

  @Column({
    name: 'consignee_address',
    length: 500,
  })
  consigneeAddress: string;

  @Column({
    default: 1,
  })
  status: number;

  @Column({
    name: 'created_by_company_id',
  })
  createdByCompanyId: number;

  @Column({
    name: 'created_by_user_id',
  })
  createdByUserId: number;

  @Column({
    name: 'updated_by_user_id',
    nullable: true,
  })
  updatedByUserId: number;

  @Column({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'datetime',
    onUpdate: 'CURRENT_TIMESTAMP',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  // Relation
  @OneToOne(() => Quotation)
  @JoinColumn([{ name: 'rfq_number', referencedColumnName: 'rfqNumber' }])
  quotation: Quotation;

  @ManyToOne(() => Customer, (customer) => customer.quotations)
  @JoinColumn([{ name: 'customer_id', referencedColumnName: 'customerId' }])
  customer: Customer;

  @OneToMany(() => ShipmentOtif, (shipmentOtif) => shipmentOtif.shipment)
  shipmentOtifs: ShipmentOtif[];

  @OneToMany(() => ShipmentFile, (shipmentFile) => shipmentFile.shipment)
  shipmentFiles: ShipmentFile[];

  @OneToMany(() => Revenue, (revenue) => revenue.shipment)
  revenues: Revenue[];

  @OneToOne(() => Invoice, (invoice) => invoice.shipment)
  invoice: Invoice;
  
  @OneToMany(() => ShipmentSelllingPrice, (shipmentSelllingPrice) => shipmentSelllingPrice.orderNumber)
  shipmentSellingPrice: ShipmentSelllingPrice[];
}