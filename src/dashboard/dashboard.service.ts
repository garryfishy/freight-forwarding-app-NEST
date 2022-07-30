import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OtifStatus, RevenueKind, RfqStatus, ShipmentStatus } from 'src/enums/enum';
import { Quotation } from 'src/quotations/entities/quotation.entity';
import { User } from 'src/users/entities/user.entity';
import { Brackets, getConnection, Repository } from 'typeorm';
import { format, getMonth, getYear, subMonths } from 'date-fns';
import { Revenue } from 'src/revenues/entities/revenue.entity';
import { Shipment } from 'src/shipments/entities/shipment.entity';
import { Helper } from 'src/helpers/helper' 

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Quotation) private quotationRepo: Repository<Quotation>,
    @InjectRepository(Revenue) private revenueRepo: Repository<Revenue>,
    @InjectRepository(Shipment) private shipmentRepo: Repository<Shipment>,
    private helper: Helper,
  ) {}

  async getModifiedRevenueData(currentUser: User, thisMonth: number) {
    const thisYear = new Date().getFullYear()

    return await getConnection()
      .createQueryBuilder()
      .from((qb3) => {
        return qb3
          .subQuery()
          .from(Revenue, 'r2')
          .select([
            'r2.id AS id',
            'r2.orderNumber AS orderNumber',
            'r2.otifStatus AS otifStatus',
            'r2.year AS year',
            'r2.month AS month',
            'r2.settled AS settled',
            'ROW_NUMBER() OVER (PARTITION BY r2.orderNumber ORDER BY r2.year DESC, r2.month DESC) AS n'
          ])
          .where((qb2) => {
            const query = qb2
              .subQuery()
              .from(Revenue, 'r1')
              .select(['max(r1.id)'])
              .where((qb1) => {
                const orderNumbers = qb1
                  .subQuery()
                  .from(Revenue, 'r')
                  .select(['r.orderNumber AS orderNumber'])
                  .innerJoin('r.shipment', 's')
                  .innerJoin('s.customer', 'c')
                  .innerJoin('s.quotation', 'q')
                  .where(
                    `c.affiliation = :affiliation 
                    AND c.companyId = :companyId
                    AND q.createdByCompanyId = :companyId
                    AND s.status = :status 
                    AND r.year = :thisYear
                    AND r.month = :thisMonth`,
                    { 
                      affiliation: currentUser.affiliation,
                      companyId: currentUser.companyId, 
                      status: 1,
                      thisYear, 
                      thisMonth,
                      otifStatus: [
                        OtifStatus.REJECTED,
                        OtifStatus.CANCELLED
                      ]
                    }
                  )
                  .groupBy('r.orderNumber')
                  .getQuery()

                return 'r1.orderNumber IN' + orderNumbers
              })
              // .andWhere('r1.otifStatus NOT IN (:...otifStatus)')

              if (thisMonth === 1) {
                // year <= 2022 
                // if year = 2022 => month = 1
                // else year < 2022 => month <= 12
                query.andWhere(
                  `((r1.year = :thisYear AND r1.month = :thisMonth)
                  OR (r1.year < :thisYear AND r1.month <= :month))`, 
                  { thisYear, thisMonth, month: 12 }
                )
              } else {
                query.andWhere(
                  `(r1.year <= :thisYear AND r1.month <= :thisMonth)`, 
                  { thisYear, thisMonth }
                )
              }

            const ids = query
              .setParameter('otifStatus', [
                OtifStatus.REJECTED,
                OtifStatus.CANCELLED
              ])
              .groupBy('r1.month')
              .addGroupBy('r1.orderNumber')
              .getQuery()

            return 'r2.id IN' + ids
          })

      }, 'x')
      .select()
      .where('x.n <= :value', { value: 2 })
      .getRawMany()
  }

  async getRevenueByMonth(currentUser: User, month: number) {
    const { revenue } = await this.revenueRepo
      .createQueryBuilder('r')
      .select(['SUM(r.settled) AS revenue'])
      .innerJoin('r.shipment', 's')
      .innerJoin('s.customer', 'c')
      .innerJoin('s.quotation', 'q')
      .where(
        `c.affiliation = :affiliation 
        AND c.companyId = :companyId
        AND q.createdByCompanyId = :companyId
        AND s.status = :status 
        AND r.otifStatus = :otifStatus
        AND r.kind = :kind
        AND r.month = :month
        AND r.year = :year`, 
        { 
          affiliation: currentUser.affiliation,
          companyId: currentUser.companyId, 
          status: 1,
          month,
          year: new Date().getFullYear(),
          otifStatus: OtifStatus.SCHEDULED,
          kind: RevenueKind.PROGRESSION,
        }
      )
      .getRawOne()

    return Math.round(revenue)
  }

  async getSummary(currentUser: User) {
    const thisMonthStartDate = format(new Date(), 'yyyy-MM-01');

    // Number of Request (Total Request) 
    let totalRequestData = await this.quotationRepo
      .createQueryBuilder('q')
      .innerJoin('q.customer', 'c')
      .select(['count(q.rfqNumber) as count'])
      .where(
        `c.affiliation = :affiliation 
        AND c.companyId = :companyId
        AND q.rfqStatus IN (:...rfqStatus) 
        AND q.createdByCompanyId = :companyId
        AND q.status = :status`,
        {
          affiliation: currentUser.affiliation,
          companyId: currentUser.companyId,
          status: 1,
          rfqStatus: [RfqStatus.SUBMITTED, RfqStatus.COMPLETED], 
        },
      )
      .getRawOne();

    const totalRequest = parseInt(totalRequestData.count, 10) || 0;

    // Completed Request
    let completedRequestData = await this.shipmentRepo
      .createQueryBuilder('s')
      .innerJoin('s.customer', 'c')
      .innerJoin('s.quotation', 'q')
      .select(['count(s.id) as count'])
      .where(
        `c.affiliation = :affiliation 
        AND c.companyId = :companyId
        AND q.rfqStatus = :rfqStatus 
        AND q.createdByCompanyId = :companyId
        AND q.status = :status
        AND s.shipmentStatus = :shipmentStatus
        AND s.otifStatus = :otifStatus
        AND s.createdByCompanyId = :companyId
        AND s.status = :status`,
        {
          affiliation: currentUser.affiliation,
          companyId: currentUser.companyId,
          status: 1,
          shipmentStatus: ShipmentStatus.COMPLETE,
          otifStatus: OtifStatus.COMPLETE,
          rfqStatus: RfqStatus.COMPLETED, 
        },
      )
      .getRawOne();

    const completedRequest = parseInt(completedRequestData.count, 10) || 0;
    
    // Ongoing Shipment
    let ongoingShipmentData = await this.shipmentRepo
      .createQueryBuilder('s')
      .innerJoin('s.customer', 'c')
      .innerJoin('s.quotation', 'q')
      .innerJoin('s.shipmentOtifs', 'so', 'so.otifStatus = s.otifStatus')
      .select(['count(s.id) as count'])
      .where(
        `c.affiliation = :affiliation 
        AND c.companyId = :companyId
        AND q.createdByCompanyId = :companyId
        AND q.status = :status
        AND s.otifStatus IN (:...otifStatus) 
        AND s.shipmentStatus = :shipmentStatus
        AND s.createdByCompanyId = :companyId
        AND s.status = :status
        AND so.status = :status`,
        {
          affiliation: currentUser.affiliation,
          companyId: currentUser.companyId,
          status: 1,
          otifStatus: [
            OtifStatus.PICKUP, 
            OtifStatus.ORIGIN_LOCAL_HANDLING,
            OtifStatus.DEPARTURE,
            OtifStatus.ARRIVAL,
            OtifStatus.DESTINATION_LOCAL_HANDLING,
            OtifStatus.DELIVERY
          ],
          shipmentStatus: ShipmentStatus.ONGOING,
        },
      )
      .getRawOne();

    const ongoingShipment = parseInt(ongoingShipmentData.count, 10) || 0;

    // This Month Revenue (mtd) 
    const thisMonth = new Date().getMonth() + 1
    // const revenue = await this.getRevenueByMonth(currentUser, thisMonth)

    const revenueData = await this.getModifiedRevenueData(currentUser, thisMonth)

    const revenue = this.helper.getRevenueByMonth(revenueData);

    return {
      totalRequest,
      completedRequest, // complete shipment
      ongoingShipment,
      revenue,
    };
  }

  // (graphic) revenue per month  
  async getRevenue(currentUser: User, year: number) {
    /*
    let revenueData = await this.revenueRepo
      .createQueryBuilder('r')
      .select(['SUM(r.settled) AS revenue, month'])
      .innerJoin('r.shipment', 's')
      .innerJoin('s.customer', 'c')
      .innerJoin('s.quotation', 'q')
      .where(
        `c.affiliation = :affiliation 
        AND c.companyId = :companyId
        AND q.createdByCompanyId = :companyId
        AND s.status = :status 
        AND r.otifStatus = :otifStatus
        AND r.kind = :kind
        AND r.year = :year`, 
        { 
          affiliation: currentUser.affiliation,
          companyId: currentUser.companyId, 
          status: 1,
          year,
          otifStatus: OtifStatus.SCHEDULED,
          kind: RevenueKind.PROGRESSION,
        }
      )
      .groupBy('month')
      .getRawMany()

    const data = new Array(12).fill(0)
    for (let obj of revenueData) {
      data[obj.month - 1] = Math.round(obj.revenue)
    }
    */

    let revenueData = await this.revenueRepo
      .createQueryBuilder('r2')
      .select([
        'r2.id AS id',
        'r2.orderNumber AS orderNumber',
        'r2.otifStatus AS otifStatus',
        'r2.month AS month',
        'r2.settled AS settled'
      ])
      .where((qb2) => {
        const ids = qb2
          .subQuery()
          .from(Revenue, 'r1')
          .select(['max(r1.id)'])
          .where((qb1) => {
            const ids = qb1
              .subQuery()
              .from(Revenue, 'r')
              .select(['max(r.id)'])
              .innerJoin('r.shipment', 's')
              .innerJoin('s.customer', 'c')
              .innerJoin('s.quotation', 'q')
              .where(
                `c.affiliation = :affiliation 
                AND c.companyId = :companyId
                AND q.createdByCompanyId = :companyId
                AND s.status = :status 
                AND r.year = :year`,
                { 
                  affiliation: currentUser.affiliation,
                  companyId: currentUser.companyId, 
                  status: 1,
                  year, 
                  otifStatus: [
                    OtifStatus.REJECTED,
                    OtifStatus.CANCELLED
                  ]
                }
              )
              .groupBy('r.month')
              .addGroupBy('r.orderNumber')
              .addGroupBy('r.otifStatus')
              .getQuery()

            return 'r1.id IN ' + ids
          })
          .groupBy('r1.month')
          .addGroupBy('r1.orderNumber')
          .getQuery()

        return 'r2.id IN' + ids
      })
      .orderBy('r2.year', 'DESC')
      .addOrderBy('r2.month', 'DESC')
      .addOrderBy('r2.orderNumber', 'DESC')
      .addOrderBy('r2.id', 'DESC')
      .getRawMany()

    // get index(es) of each order number
    const groupedData = []
    for (let i = 0; i < revenueData.length; i++) {
      let indexes = [i]

      const isExist = groupedData.find(el => el.orderNumber === revenueData[i].orderNumber)
      if (isExist) {
        continue
      }

      for (let j = i + 1; j < revenueData.length; j++) {
        if (!isExist && revenueData[i].orderNumber === revenueData[j].orderNumber) {
          indexes.push(j)
        }
      }

      groupedData.push({ 
        orderNumber: revenueData[i].orderNumber, 
        indexes 
      })
    }

    // get revenue in each month
    const data = new Array(12).fill(0)
    for (let obj of groupedData) {
      obj.indexes.reverse().forEach((el, i, arr) => {
        const value = revenueData[el].settled - (!i ? 0 : revenueData[arr[i-1]].settled)  
        data[+revenueData[el].month - 1] += Math.round(value)
      })
    }

    // generate months
    const labels = []
    for (let i = 0; i < 12; i ++) {
      const month = format(new Date(2000, i, 1), 'MMM')
      labels.push(month)
    }

    return {
      labels,
      datasets: [{ label: 'Revenue', data }],
    }
    
  }
    
  // (graphic) shipment per month (booked, ongoing, complete)
  async getShipment(currentUser: User, year: number) {
    let shipmentData = await this.shipmentRepo
      .createQueryBuilder('s')
      .innerJoin('s.customer', 'c')
      .innerJoin('s.quotation', 'q')
      .leftJoin('s.shipmentOtifs', 'so')
      .select([
        's.shipmentStatus AS shipmentStatus', 
        'COALESCE (s.orderNumber, so.orderNumber) AS orderNumber ', 
        `IF (
          s.otifStatus = 'BOOKED', 
          DATE_FORMAT(s.createdAt, '%Y-%m-%d'), 
          COALESCE (
            COALESCE(so.documentDate, '') , COALESCE (so.pickupDate, '')
          )
        ) AS otifDate`])
      .where(
        `c.affiliation = :affiliation 
        AND c.companyId = :companyId
        AND q.createdByCompanyId = :companyId
        AND q.status = :status
        AND NOT s.shipmentStatus = :shipmentStatus
        AND s.createdByCompanyId = :companyId
        AND s.status = :status`
      )
      .having('YEAR(otifDate) = :year')
      .setParameters({
        affiliation: currentUser.affiliation,
        companyId: currentUser.companyId,
        status: 1,
        shipmentStatus: ShipmentStatus.FAILED,
        year
      })
      .groupBy('orderNumber')
      .addGroupBy('s.shipmentStatus')
      .getRawMany();

    const labels = []
    for (let i = 0; i < 12; i ++) {
      const month = format(new Date(2000, i, 1), 'MMM')
      labels.push(month)
    }

    const waitingData = new Array(12).fill(0)
    const ongoingData = new Array(12).fill(0)
    const completeData = new Array(12).fill(0)
    for (let i = 0; i < 12; i++) {
      shipmentData.forEach((obj) => {
        const month = +obj.otifDate.split('-')[1] - 1
        const status = obj.shipmentStatus
        if (i == month) {
          if (status === ShipmentStatus.WAITING) {
            waitingData[month]++
          } else if (status === ShipmentStatus.ONGOING) {
            ongoingData[month]++
          } else {
            completeData[month]++
          }
        }
      })
    }

    return {
      labels,
      datasets: [
        { label: 'Booked', data: waitingData }, 
        { label: 'On Progress', data: ongoingData }, 
        { label: 'Complete', data: completeData }
      ]
    }
  }

}
