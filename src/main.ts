import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { config } from 'aws-sdk';
import { json } from 'body-parser'
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

const whitelist = [
  '.andalin.com',
  'http://localhost:3000', 
  'http://localhost:8080',
  'https://devsaas-cardig.andalin.com/',
  'https://devsaas-cardig.andalin.com',
  'https://uatsaas-cardig.andalin.com/',
  'https://uatsaas-cardig.andalin.com',
  'https://stagingsaas-cardig.andalin.com/',
  'https://stagingsaas-cardig.andalin.com',
  'https://spadevsaas-cardig.andalin.com/',
  'https://spadevsaas-cardig.andalin.com',
  'https://dev-smu.cardig.com/',
  'https://dev-smu.cardig.com',
  'https://demo-smu.cardig.com/',
  'https://demo-smu.cardig.com',
  'https://staging-smu.cardig.com/',
  'https://staging-smu.cardig.com',
];

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: (origin, callback) => {
      if (origin && whitelist.indexOf(origin) !== -1) {
        callback(null, true);
        return;
      } else if (!origin) {
        callback(null, true);
        return;
      }
      callback(new Error('Not Allowed by Cors'));
    },
  })
  
  const configService = app.get(ConfigService);
  config.update({
    accessKeyId: configService.get('AWS_ACCESS_KEY'),
    secretAccessKey: configService.get('AWS_SECRET_KEY'),
    region: configService.get('AWS_REGION'),
  });
  app.use(json({ limit: '10mb'}))
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
//   app.useGlobalFilters(new AllExceptionsFilter())
  app.setGlobalPrefix('api/v1');
  await app.listen(process.env.PORT);
}
bootstrap();
