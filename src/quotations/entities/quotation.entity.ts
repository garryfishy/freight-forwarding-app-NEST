import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne, OneToMany } from 'typeorm'
import { CustomerPosition, PackingList, ProductType, RfqStatus, RouteType, ShipmentService, ShipmentType, ShipmentVia } from 'src/enums/enum'
import { Bid } from 'src/bids/entities/bid.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { QuotationFile } from 'src/quotation-files/entities/quotation-file.entity';
import { Shipment } from 'src/shipments/entities/shipment.entity';
import { Invoice } from 'src/invoices/entities/invoice.entity';

@Entity({ name: 't_quotations' })
export class Quotation {
  @PrimaryGeneratedColumn({
    name: 'id',
  })
  id: number;

  @Column({
    name: 'customer_id',
  })
  customerId: string;

  @Column({
    name: 'rfq_number',
    unique: true,
  })
  rfqNumber: string;

  // shipping section
  @Column({
    name: 'shipment_via',
    type: 'enum',
    enum: ShipmentVia,
  })
  shipmentVia: ShipmentVia;

  @Column({
    name: 'shipment_service',
    type: 'enum',
    enum: ShipmentService,
  })
  shipmentService: ShipmentService;

  @Column({
    name: 'country_from',
  })
  countryFrom: string;

  @Column({
    name: 'city_from',
  })
  cityFrom: string;

  // if shipmentService.includes('Door')
  @Column({
    name: 'address_from',
    length: 500,
  })
  addressFrom: string;

  // if shipmentService.includes('Door')
  @Column({
    name: 'zipcode_from',
    length: 10,
  })
  zipcodeFrom: string;

  @Column({
    name: 'country_to',
  })
  countryTo: string;

  @Column({
    name: 'city_to',
  })
  cityTo: string;

  // if shipmentService.includes('Door')
  @Column({
    name: 'address_to',
    length: 500,
  })
  addressTo: string;

  // if shipmentService.includes('Door')
  @Column({
    name: 'zipcode_to',
    length: 10,
  })
  zipcodeTo: string;

  @Column({
    name: 'customer_position',
    type: 'enum',
    enum: CustomerPosition,
  })
  customerPosition: CustomerPosition;

  @Column({
    name: 'route_type',
    type: 'enum',
    enum: RouteType,
  })
  routeType: RouteType;

  @Column({
    name: 'shipment_date',
  })
  shipmentDate: string;

  // shipment type section
  @Column({
    name: 'shipment_type',
    type: 'enum',
    enum: ShipmentType,
  })
  shipmentType: ShipmentType;

  @Column({
    name: 'packing_list',
    type: 'json',
  })
  packingList: PackingList[];

  @Column({
    name: 'total_qty'
  })
  totalQty: number;
  
  @Column({
    name: 'estimated_total_weight'
  })
  estimatedTotalWeight: number;

  @Column({
    type: 'bigint'
  })
  volumetric: number;
  
  // if shipmentType.includes('FCL')
  @Column({
    name: 'container_type',
  })
  containerType: string;

  // if shipmentType.includes('FCL')
  @Column({
    name: 'container_option',
  })
  containerOption: string;

  // if containerType == 'Reefer'
  @Column()
  temperature: number;

  // product type section
  @Column({
    name: 'product_type',
    type: 'enum',
    enum: ProductType,
  })
  productType: ProductType;

  @Column({
    name: 'kind_of_goods',
  })
  kindOfGoods: string;

  @Column({
    name: 'value_of_goods',
  })
  valueOfGoods: number;

  @Column({
    name: 'hs_code',
  })
  hsCode: string;

  @Column({
    name: 'po_number',
    nullable: true,
  })
  poNumber: string;

  // if productType == 'Dangerous
  @Column({
    name: 'un_number',
  })
  unNumber: string;

  @Column({
    length: 500,
  })
  description: string;

  // additional section
  @Column({
    length: 500,
    nullable: true,
  })
  remark: string;

  @Column({
    name: 'origin_customs_clearance',
    type: 'boolean',
    default: false,
  })
  originCustomsClearance: boolean;

  @Column({
    name: 'destination_customs_clearance',
    type: 'boolean',
    default: false,
  })
  destinationCustomsClearance: boolean;

  @Column({
    name: 'estimate_storage',
    type: 'boolean',
    default: false,
  })
  estimateStorage: boolean;

  @Column({
    name: 'rfq_status',
    type: 'enum',
    enum: RfqStatus,
    default: RfqStatus.WAITING,
  })
  rfqStatus: RfqStatus;

  @Column({
    name: 'assigned_to',
    nullable: true
  })
  assignedTo: number;

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
  @OneToOne(() => Bid, (bid) => bid.quotation)
  bid: Bid;

  @ManyToOne(() => Customer, (customer) => customer.quotations)
  @JoinColumn([{ name: 'customer_id', referencedColumnName: 'customerId' }])
  customer: Customer;

  @OneToMany(() => QuotationFile, (quotationFile) => quotationFile.quotation)
  quotationFiles: QuotationFile[];

  @OneToOne(() => Shipment)
  shipment: Shipment;

  @OneToOne(() => Invoice)
  invoice: Invoice;

}
