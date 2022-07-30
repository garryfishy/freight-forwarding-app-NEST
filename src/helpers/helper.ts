import { BadRequestException } from "@nestjs/common";
import { format } from "date-fns";
import { InvoiceStatus, OtifStatus, ShipmentService } from "src/enums/enum";
import { QuotationFile } from "src/quotation-files/entities/quotation-file.entity";
import { ShipmentFile } from "src/shipment-files/entities/shipment-file.entity";
import { SubmitShipmentOtifDto } from "src/shipment-otifs/dtos/submit-shipment-otif.dto";
import { ShipmentOtif } from "src/shipment-otifs/entities/shipment-otif.entity";

export class Helper {
  generateShipmentTypeCode(shipmentType: string) {
    const code: { [key: string]: string } = {
      AIRBREAKBULK: '0203',
      AIRCOURIER: '0202',
      AIRCARGO: '0201',
      SEABREAKBULK: '0103',
      SEALCL: '0102',
    }

    return code[shipmentType] || '0101';
  }

  transformRfqOrOrderNumber(rfqOrOrderNumber: string) {
    // RFQ-068-20220412-JKT-JKT-0001 => RFQ/068/20220412-JKT-JKT-0001
    // ORD-068-20220412-0001-0102 => ORD/068/20220412-0001-0102
    const [ code, clientId, ...detail ] = rfqOrOrderNumber.split('-')
    return `${code}/${clientId}/${detail.join('-')}`
  }

  checkOtif(shipmentService: string, otifStatus: string, otifStatusTo: string, invoiceStatus: string) {
    const permittedOtif: string[] = [
      OtifStatus.BOOKED,
      OtifStatus.SCHEDULED,
      OtifStatus.PICKUP,
      OtifStatus.ORIGIN_LOCAL_HANDLING,
      OtifStatus.DEPARTURE
    ]

    if (otifStatusTo === 'REJECTED' || otifStatusTo === 'CANCELLED') {
      if (permittedOtif.includes(otifStatus) && 
        (!invoiceStatus || invoiceStatus === InvoiceStatus.PENDING)
      ) { 
      // if (otifStatus === 'BOOKED' || otifStatus === 'SCHEDULED') {
        return [ otifStatusTo, 'FAILED' ]
      } 
      throw new BadRequestException('Shipment can be Rejected/Cancelled as shipment status before Arrival and invoice is Pending')
    }    

    const otifStatusData: { [key: string]: string[] } = {
      'Door to Door': [
        'BOOKED',
        'SCHEDULED', 
        'PICKUP', 
        'ORIGIN_LOCAL_HANDLING',
        'DEPARTURE',
        'ARRIVAL',
        'DESTINATION_LOCAL_HANDLING',
        'DELIVERY',
        'COMPLETE'
      ],
      'Door to Port': [
        'BOOKED',
        'SCHEDULED', 
        'PICKUP', 
        'ORIGIN_LOCAL_HANDLING',
        'DEPARTURE',
        'ARRIVAL',
        'COMPLETE'
      ],
      'Port to Door': [
        'BOOKED',
        'SCHEDULED',
        'DEPARTURE',
        'ARRIVAL',
        'DESTINATION_LOCAL_HANDLING',
        'DELIVERY',
        'COMPLETE'
      ],
      'Port to Port': [
        'BOOKED',
        'SCHEDULED', 
        'DEPARTURE',
        'ARRIVAL',
        'COMPLETE'
      ],
    }

    const shipmentStatusData = {
      BOOKED: 'WAITING',
      SCHEDULED: 'WAITING', 
      PICKUP: 'ONGOING', 
      ORIGIN_LOCAL_HANDLING: 'ONGOING',
      DEPARTURE: 'ONGOING',
      ARRIVAL: 'ONGOING',
      DESTINATION_LOCAL_HANDLING: 'ONGOING',
      DELIVERY: 'ONGOING',
      COMPLETE: 'COMPLETE',
    }

    const nextIndex = otifStatusData[shipmentService].indexOf(otifStatus) + 1
    const isOtifValid = otifStatusTo === otifStatusData[shipmentService][nextIndex]

    if (!isOtifValid) {
      throw new BadRequestException('Please submit otif sequentially')
    }
    
    return [ otifStatusTo, shipmentStatusData[otifStatusTo] ]
  }

  toformat12h(date) {
    const formattedDate = new Date(date)
    .toLocaleString('id-ID', {
      year: 'numeric', month: '2-digit', day: '2-digit', 
      hourCycle: 'h12', hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
    
    const reversedDate = formattedDate.split(' ')[0].split('/').reverse().join('-')
    const modifiedTime = formattedDate.split(' ')[1].split('.').join(':')
    const meridiem = formattedDate.split(' ')[2]

    return `${reversedDate} ${modifiedTime} ${meridiem}`

  }

  mapOtifBody(otifStatus: OtifStatus, body: SubmitShipmentOtifDto | ShipmentOtif) {
    const payload = {}

    if (otifStatus === OtifStatus.CANCELLED || otifStatus === OtifStatus.REJECTED) {
      Object.assign(payload, {
        reasonFailed: body.reasonFailed,
      })
    } else if (otifStatus === OtifStatus.SCHEDULED) {
      Object.assign(payload, {
        documentDate: body.documentDate,
        etd: body.etd,
        etdTime: body.etdTime,
        eta: body.eta,
        etaTime: body.etaTime,
      })

    } else if (otifStatus === OtifStatus.PICKUP) {
      Object.assign(payload, {
        pickupDate: body.pickupDate,
        pickupTime: body.pickupTime,
        location: body.location,
        driverName: body.driverName,
        driverPhone: body.driverPhone,
        vehiclePlateNumber: body.vehiclePlateNumber,
        grossWeight: body.grossWeight,
        nettWeight: body.nettWeight,
        activity: body.activity,
      })
    } else if (otifStatus === OtifStatus.ORIGIN_LOCAL_HANDLING) {
      Object.assign(payload, {
        documentDate: body.documentDate,
        noPeb: body.noPeb,
        location: body.location,
        activity: body.activity,
      })
    } else if (otifStatus === OtifStatus.DEPARTURE) {
      Object.assign(payload, {
        documentDate: body.documentDate,
        location: body.location,
        portOfLoading: body.portOfLoading,
        voyageName: body.voyageName,
        voyageNumber: body.voyageNumber,
        containerNumber: body.containerNumber,
        grossWeight: body.grossWeight,
        nettWeight: body.nettWeight,
        activity: body.activity,
      })
    } else if (otifStatus === OtifStatus.ARRIVAL) {
      Object.assign(payload, {
        documentDate: body.documentDate,
        location: body.location,
        portOfDischarge: body.portOfDischarge,
        activity: body.activity,
      })
    } else {
      Object.assign(payload, {
        documentDate: body.documentDate,
        location: body.location,
        activity: body.activity,
      })
    }

    return payload
  }

  mapOtifResponse(shipmentOtifs: ShipmentOtif[]) {
    const response = []

    for (let otif of shipmentOtifs) {
      const payload = this.mapOtifBody(otif.otifStatus, otif)
      Object.assign(payload, {
        otifStatus: otif.otifStatus,
        createdAt: format(otif.createdAt, 'yyyy-MM-dd HH:mm:ss'), 
        updatedAt: format(otif.updatedAt, 'yyyy-MM-dd HH:mm:ss'),
        status: otif.status
      })

      response.push(payload)
    }

    return response
  }

  mapFileResponse(files: ShipmentFile[] | QuotationFile[]) {
    const response = []

    for (let file of files) {
      response.push({
        id: file.id,
        fileContainer: file.fileContainer,
        fileName: file.fileName,
        originalName: file.originalName,
        url: file.url,
        createdAt: format(file.createdAt, 'yyyy-MM-dd HH:mm:ss'),
      })
    }

    return response
  }

  getProgressionPercentage(shipmentService: ShipmentService, otifStatus: OtifStatus) {
    const zeroPercentage = [
      OtifStatus.BOOKED,
      OtifStatus.COMPLETE,
      OtifStatus.CANCELLED,
      OtifStatus.REJECTED
    ]
    if (zeroPercentage.includes(otifStatus)) {
      return 0
    }

    const progressionPercentageData: { [key: string]: { [key: string]: number } } = {
      'Door to Door': {
        'SCHEDULED': 10, 
        'PICKUP': 10, 
        'ORIGIN_LOCAL_HANDLING': 15,
        'DEPARTURE': 35,
        'ARRIVAL': 5,
        'DESTINATION_LOCAL_HANDLING': 15,
        'DELIVERY': 10
      },
      'Door to Port': {
        'SCHEDULED': 10, 
        'PICKUP': 10, 
        'ORIGIN_LOCAL_HANDLING': 15,
        'DEPARTURE': 55,
        'ARRIVAL': 10
      },
      'Port to Door': {
        'SCHEDULED': 10,
        'DEPARTURE': 60,
        'ARRIVAL': 5,
        'DESTINATION_LOCAL_HANDLING': 15,
        'DELIVERY': 10
      },
      'Port to Port': {
        'SCHEDULED': 10, 
        'DEPARTURE': 80,
        'ARRIVAL': 10
      },
    }

    return progressionPercentageData[shipmentService][otifStatus]
  }

  getRevenueByMonth(revenueData: any[]) {
    let revenue = 0

    const arr = []

    for (let i = 0; i < revenueData.length; i++) {
      let currentOrderNumber = revenueData[i].orderNumber
      
      const currentOrderNumberRevenues = [revenueData[i].settled]

      const isDone = arr.find(el => el === currentOrderNumber)
      if (isDone) {
        continue
      }

      arr.push(currentOrderNumber)
      
      for (let j = i + 1; j < revenueData.length; j++) {
        if (currentOrderNumberRevenues.length === 2) {
          break
        }
        
        if (revenueData[j].orderNumber === currentOrderNumber) {  
          currentOrderNumberRevenues.push(revenueData[j].settled)
        }
      }

      revenue += +currentOrderNumberRevenues[0]
      revenue -= +currentOrderNumberRevenues[1] || 0
    }

    return Math.round(revenue)
  }
}