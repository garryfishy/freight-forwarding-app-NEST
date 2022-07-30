export enum OtifStatus {
  BOOKED = 'BOOKED',
  SCHEDULED = 'SCHEDULED',
  PICKUP = 'PICKUP',
  ORIGIN_LOCAL_HANDLING = 'ORIGIN_LOCAL_HANDLING',
  DEPARTURE = 'DEPARTURE',
  ARRIVAL = 'ARRIVAL',
  DESTINATION_LOCAL_HANDLING = 'DESTINATION_LOCAL_HANDLING',
  DELIVERY = 'DELIVERY',
  COMPLETE = 'COMPLETE',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum ShipmentStatus {
  WAITING = 'WAITING',
  ONGOING = 'ONGOING',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
}

export enum ShipmentVia {
  AIR = 'Air',
  OCEAN = 'Ocean',
}

export enum ShipmentService {
  DTD = 'Door to Door',
  DTP = 'Door to Port',
  PTD = 'Port to Door',
  PTP = 'Port to Port',
}

export enum ShipmentType {
  AIRBREAKBULK = 'AIRBREAKBULK',
  AIRCARGO = 'AIRCARGO',
  AIRCOURIER = 'AIRCOURIER',
  SEABREAKBULK = 'SEABREAKBULK',
  SEALCL = 'SEALCL',
  SEAFCL20FT = 'SEAFCL20FT',
  SEAFCL40FT = 'SEAFCL40FT',
  SEAFCL45FT = 'SEAFCL45FT',
  SEAFCL40FTHC = 'SEAFCL40FTHC',
  SEAFCL20FR = 'SEAFCL20FR',
  SEAFCL40FR = 'SEAFCL40FR',
  SEAFCL40HREF = 'SEAFCL40HREF',
  SEAFCL20RF = 'SEAFCL20RF',
}

export enum PackagingType {
  BOX = 'Box',
  CARTON = 'Carton',
  CASE = 'Case',
  DRUM = 'Drum',
  PACKAGE = 'Package',
  PALLETE = 'Pallete',
  UNIT = 'Unit',
  CHARTER = 'Charter',
  CBM = 'CBM',
}

// used in entity not dto
export interface PackingList {
  packageQty: number;
  packagingType: PackagingType;
  weight: number;
  length: number;
  width: number;
  height: number;
}

// khusus SEAFCL
export enum ContainerOption {
  SOC = "Shipper's Own Container (SOC)",
  COC = "Carrier's Own Container (SOC)",
}

// khusus SEAFCL
export enum ContainerType {
  DRY = 'Dry',
  VENTILATE = 'Ventilate',
  REEFER = 'Reefer',
  OPEN_TOP = 'Open Top',
  ISO_TANK = 'ISO Tank',
  NOR = 'NOR',
}

// khusus SEABREAKBULK
enum UomSeaBreakbulk {
  PER_UNIT = 'Per Unit',
  PER_CHARTER = 'Per Charter',
  PER_CBM = 'Per CBM',
}

export enum ProductType {
  DANGEROUS = 'Dangerous',
  GENERAL = 'General',
  SPECIAL = 'Special',
}

export enum CustomerPosition {
  CONSIGNEE = 'Consignee',
  SHIPPER = 'Shipper',
}

export enum RouteType {
  INTERNATIONAL = 'International',
  DOMESTIC = 'Domestic',
}

export enum RfqStatus {
  WAITING = 'WAITING_FOR_BID', // Draft
  NEED_APPROVAL = 'NEED_APPROVAL', // Need Approval
  REJECTED = 'REJECTED', // Rejected
  SUBMITTED = 'BID_SUBMITTED', // Completed in request list n Pending in manage request
  COMPLETED = 'COMPLETED', // Completed
}

export enum Uom {
  PER_CBM = 'Per Cbm',
  PER_KG = 'Per KG',
  PER_CONTAINER = 'Per Container',
  PER_DOCUMENT = 'Per Document',
  PER_ITEM = 'Per Item',
  PER_SHIPMENT = 'Per Shipment',
  PER_TRIP_AIR = 'Per Trip (Air)',
  PER_BOX = 'Per Box',
  PER_BL = 'Per BL',
  PER_TRIP_FCL = 'Per Trip (FCL)', 
  PER_TRIP_LCL = 'Per Trip (LCL)'
}

export enum RevenueKind {
  ADJUSTMENT = 'Adjustment',
  PROGRESSION = 'Progression',
}

export enum RoleAccess {
  EDIT = 'EDIT',
  VIEW = 'VIEW'
}

export enum Action {
  MANAGE = 'manage',
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}

export enum Role {
  SUPER_ADMIN = 'SADM',
  ADMIN = 'admin',
  USER = 'user',
  MANAGER = 'manager',
  STAFF = 'staff'
}

export enum InvoiceStatus {
  PENDING = 'PENDING',
  ISSUED = 'ISSUED',
  SETTLED = 'SETTLED'
}