import { Injectable } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { SesService } from '@nextnm/nestjs-ses';
import { SesEmailOptions } from '@nextnm/nestjs-ses'
import * as Mustache from 'mustache'
import * as fs from 'fs'
import { MailDto } from './dtos/mail.dto';
import * as ejs from 'ejs'

const confirmation = fs.readFileSync('./src/mail/template/confirmation.html', 'utf8')	
const forgotPassword = fs.readFileSync('./src/mail/template/forgot-pass.html', 'utf8')	
const quotation = fs.readFileSync('./src/mail/template/quotation.html', 'utf8')
const newPassword = fs.readFileSync('./src/mail/template/manage-user-create.html', 'utf-8')
// const otifNotification = fs.readFileSync('./src/mail/template/otif-notification.html', 'utf8')
@Injectable()
export class MailService {
  
 
  constructor(private sesService: SesService) {}


  async sendUserConfirmation(user: MailDto,type:string) {
    user.url = process.env.NODE_ENV === 'production' ? process.env.URL_FE_PROD : process.env.URL_FE_DEV
    user.endpoint = type === 'register' ? 'verify-account' : type === 'forgot-password' ? 'update-password' : 'create-password'
    const options: SesEmailOptions = {
      from:'no-reply@andalin.com',
      to:user.email,
      subject: type === 'register' ? 'Confirmation Email' : type === 'forgot-password' ? 'Reset Password' : 'Create New Password' ,
      html: type === 'register' ? Mustache.render(confirmation, user) : type === 'forgot-password' ? Mustache.render(forgotPassword, user) : Mustache.render(newPassword, user)	
    };
    await this.sesService.sendEmail(options)
  }

  async sendOtifNotification(body) {
    const data = {
      host: process.env.NODE_ENV === 'production' ? process.env.URL_FE_PROD : process.env.URL_FE_DEV,
      path: '',
      ...body
    }
    const options: SesEmailOptions = {
      from: 'no-reply@andalin.com',
      to: body.email,
      subject: 'Shipment Movement Notification',
      // html: Mustache.render(otifNotification, data)	
    };
    await this.sesService.sendEmail(options)
  }

  async shareQuotationEmail(data:any){
    try {

      const options: SesEmailOptions = {
        from: 'no-reply@andalin.com',
        to: data.email,
        subject: `Your company's quotation`,
        html: Mustache.render(quotation, data.company)
      } 
      let send = await this.sesService.sendEmail(options)
      if(send){
        return true
      }
     
    } catch (error) {
      throw error      
    }
  }
}
