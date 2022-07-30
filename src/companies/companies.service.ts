import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { UpdateCompanyDto } from 'src/settings/dtos/update-company.dto'
import { Repository } from 'typeorm'

import { Company } from './entities/company.entity'
@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company) private companyRepo: Repository<Company>
  ) {}
    
  async findByName(name: string) {
    const company = await this.companyRepo.findOne({ name })
    return company
  }

  async findById(id: number) {
    return await this.companyRepo.findOne({ id })
  }

  async update(userId: number, id: number, body: UpdateCompanyDto) {
    const company = await this.findById(id)
    if (!company) {
      throw new NotFoundException()
    }

    company.name = body.name
    company.address = body.address
    company.email = body.email
    company.phoneCode = body.phoneCode
    company.phoneNumber = body.phoneNumber
    company.npwp = body.npwp
    company.updatedByUserId = userId

   return  await this.companyRepo.save(company)
  }

  async updatePhoto(userId: number, id: number, photo: string){
    const company = await this.companyRepo.findOne({id})
    if(!company){
      throw new NotFoundException()
    }

    company.logo = photo
    company.updatedByUserId = userId

    return await this.companyRepo.save(company)
  }

  async changeColor(color: string, id: number, userId: number){
    try {
      const company = await this.findById(id)
      if(company){
        company.themeColor = color
        company.updatedByUserId = userId
        return await this.companyRepo.save(company)
      }
    } catch (error) {
      throw error
    }
  }

  async createQuotationNote(userId, companyId, quotationNotes){
    try {
      const company = await this.companyRepo.findOne({ id: companyId })
      Object.assign(company, { quotationNotes, updatedByUserId: userId })
      return await this.companyRepo.save(company)
    } catch(error) {
      throw error
    }
  }

  async getQuotationNote(companyId: number){
    try {
      const quotationNotes = await this.companyRepo.findOne({ id: companyId })
      return quotationNotes
    } catch(error) {
      throw error
    }
  }

  async getCompanyProfile(companyId: number) {
    
    const company = await this.companyRepo
    .createQueryBuilder('company')
    .leftJoinAndSelect('company.paymentAdvices', 'paymentAdvices', 'paymentAdvices.status = :status')
    .leftJoinAndSelect('paymentAdvices.bank', 'bank')
    .leftJoinAndSelect('paymentAdvices.currency', 'currency')
    .select(['company.id', 'company.name', 'company.address', 'company.email', 'company.phoneCode', 'company.phoneNumber', 'company.npwp', 'company.fileContainer', 'company.logo', 'company.themeColor', 'company.quotationNotes', 'company.updatedByUserId', 'paymentAdvices', 'bank.name', 'currency.name'])
    .where('company.id = :id', { id: companyId, status: 1 })
    .getOne()

    return company
  }

  async getLogo(id: number){
    try {
      return await this.companyRepo
      .createQueryBuilder('company')
      .select(['company.logo'])
      .where('company.id = :id', { id })
      .getOne()

    } catch (error) {
      throw error
    }
  }

} 