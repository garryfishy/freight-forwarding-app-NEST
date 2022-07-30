import { Injectable, Res, HttpStatus } from "@nestjs/common";
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { Response } from 'express';
@Injectable()
export class WhatsappService{
    constructor(
        private httpService: HttpService
    ){}
    
    async sendMessage(phone: string, message: string, response?: any){
        try {
            const axiosConfig: AxiosRequestConfig = {
                method: 'post',
                url: process.env.WABLAS_URL,
                headers: {
                    Authorization: process.env.WABLAS_API_KEY
                },
                data: {
                    phone,
                    message
                },
                validateStatus: function (status: number) {
                  return status === 200;
                }
              };

              this.httpService.request(axiosConfig)
              .toPromise()
              .then(r => {
                let res = {};
                res['statusCode'] = HttpStatus.OK;
                res['message'] = ['success'];
                res['data'] = r.data;
                if(response){
                    response
                    .status(HttpStatus.OK)
                    .send(res);
                }
              }).catch(err => {
                console.log(console.log (err))
            })
        } catch (error) {
            throw error
        }
    }

    async sendReminder(phone: string, message: string){
        try {
            const axiosConfig: AxiosRequestConfig = {
                method: 'post',
                url: process.env.WABLAS_URL,
                headers: { Authorization: process.env.WABLAS_API_KEY },
                data: { phone, message },
                validateStatus: (status: number) => status === 200,
            };

            await this.httpService.request(axiosConfig).toPromise()
        } catch (error) {
            throw error
        }
    }
}