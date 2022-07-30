import { 
  Body, 
  Controller, 
  Delete, 
  Get, 
  Param, 
  ParseIntPipe, 
  Post, 
  Put, 
  Query, 
  Res, 
  UseGuards 
} from '@nestjs/common';
import { CreateCustomerDto } from '../customers/dtos/create-customer.dto';
import { CreateOriginDestinationDto } from '../origin-destination/dtos/create-origin-destination.dto';
import { UpdateOriginDestinationDto } from '../origin-destination/dtos/update-origin-destination.dto';
import { OriginDestinationService } from '../origin-destination/origin-destination.service';
import { CustomersService } from '../customers/customers.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { PriceComponentsService } from 'src/price-components/price-components.service';
import { CreatePriceComponentDto } from 'src/price-components/dtos/create-price-component.dto';
import { UpdatePriceComponentDto } from 'src/price-components/dtos/update-price-component.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { PhoneCodesService } from 'src/phone-codes/phone-codes.service';
import { ShipmentTypesService } from 'src/shipment-types/shipment-types.service';
import { PackagingTypesService } from 'src/packaging-types/packaging-types.service';
import { KindOfGoodsService } from 'src/kind-of-goods/kind-of-goods.service';
import { FclTypesService } from 'src/fcl-types/fcl-types.service';
import { CompaniesService } from 'src/companies/companies.service';
import { ProductType } from 'src/enums/enum';
import { UsersService } from 'src/users/users.service';
import { CreatePortDto } from 'src/ports/dtos/create-port.dto';
import { UpdatePortDto } from 'src/ports/dtos/update-port.dto';
import { PortsService } from 'src/ports/ports.service';
import { BanksService } from 'src/banks/banks.service';
import { CurrenciesService } from 'src/currencies/currencies.service';
@Controller('masterdata')
export class MasterdataController {
  constructor(
    private customersService: CustomersService,
    private routesService: OriginDestinationService,
    private priceCompService: PriceComponentsService,
    private phoneCodesService: PhoneCodesService,
    private portsService: PortsService,
    private readonly shipmentTypesService: ShipmentTypesService,
    private readonly packagingTypesService: PackagingTypesService,
    private readonly kindOfGoodsService: KindOfGoodsService,
    private readonly fclTypesService: FclTypesService,
    private readonly companiesService: CompaniesService,
    private readonly usersService: UsersService,
    private readonly banksService: BanksService,
    private readonly currenciesService: CurrenciesService,
  ) {}

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Get('customers')
  getAllCustomer(@CurrentUser() user: User) {
    return this.customersService.getAll(user);
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Get('customers/:page/:perpage')
  getCustomerPaged(
    @Param('page', ParseIntPipe) page: number,
    @Param('perpage', ParseIntPipe) perpage: number,
    @Query('filter') filter: string,
    @Query('sort') sort: string,
    @Query('createdAt') createdAt: string,
    @CurrentUser() user: User,
  ) {
    return this.customersService.getPaged(
      page,
      perpage,
      filter,
      sort,
      createdAt,
      user,
    );
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Get('customers/:id')
  getDetailCustomer(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.customersService.getDetail(id, user);
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Post('customers')
  createCustomer(@Body() data: CreateCustomerDto, @CurrentUser() user: User) {
    return this.customersService.create(data, user);
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Put('customers/:id')
  updateCustomer(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: CreateCustomerDto,
    @CurrentUser() user: User,
  ) {
    return this.customersService.update(id, data, user);
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Delete('customers/:id')
  deleteCustomer(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.customersService.delete(id, user);
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Get('origin-destination')
  getAllRoutes() {
    return this.routesService.getAll();
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Get('origin-destination/:page/:perpage')
  getRoutesPaged(
    @Param('page', ParseIntPipe) page: number,
    @Param('perpage', ParseIntPipe) perpage: number,
    @Query('filter') filter: string,
    @Query('sort') sort: string,
  ) {
    return this.routesService.getPaged(page, perpage, filter, sort);
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Get('origin-destination/countries')
  getCountries() {
    return this.routesService.getCountries();
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Get('origin-destination/countries/:countryCode/cities')
  getCitiesByCountry(@Param('countryCode') countryCode: string) {
    return this.routesService.getCitiesByCountry(countryCode);
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Get('origin-destination/:id')
  getDetailRoutes(@Param('id', ParseIntPipe) id: number) {
    return this.routesService.getDetail(id);
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Post('origin-destination')
  createOriginRoutes(
    @Body() data: CreateOriginDestinationDto,
    @CurrentUser() user: User,
  ) {
    return this.routesService.create(data, user);
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Put('origin-destination/:id')
  updateOriginRoutes(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateOriginDestinationDto,
    @CurrentUser() user: User,
  ) {
    return this.routesService.update(id, data, user);
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Delete('origin-destination/:id')
  deleteRoutes(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.routesService.delete(id, user);
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Get('price-component')
  getAllPriceComponent() {
    return this.priceCompService.getAll();
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Get('price-component/:page/:perpage')
  getPriceComponentPaged(
    @Param('page', ParseIntPipe) page: number,
    @Param('perpage', ParseIntPipe) perpage: number,
    @Query('filter') filter: string,
    @Query('sort') sort: string,
  ) {
    return this.priceCompService.getPaged(page, perpage, filter, sort);
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Get('price-component/:id')
  getDetailPriceComponent(@Param('id', ParseIntPipe) id: number) {
    return this.priceCompService.getDetail(id);
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Post('price-component')
  createPriceComponent(
    @Body() data: CreatePriceComponentDto,
    @CurrentUser() user: User,
  ) {
    return this.priceCompService.create(data, user);
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Put('price-component/:id')
  updatePriceComponent(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdatePriceComponentDto,
    @CurrentUser() user: User,
  ) {
    return this.priceCompService.update(id, data, user);
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Delete('price-component/:id')
  deletePriceComponent(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.priceCompService.delete(id, user);
  }

  @Get('phone-codes')
  getPhoneCodes() {
    return this.phoneCodesService.getAll();
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Get('shipment-types')
  getShipmentTypes() {
    return this.shipmentTypesService.getAll();
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Get('packaging-types/:shipmentTypeCode')
  getPackagingTypes(@Param('shipmentTypeCode') shipmentTypeCode: string) {
    return this.packagingTypesService.getAll(shipmentTypeCode);
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Get('kind-of-goods/:productType')
  getKindOfGoods(@Param('productType') productType: ProductType) {
    return this.kindOfGoodsService.getAll(productType);
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Get('fcl-types')
  getFclTypes() {
    return this.fclTypesService.getAll();
  }

  @Get('logo')
  getLogo() {
    return this.companiesService.getLogo(1);
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Get('users')
  getUsers(@CurrentUser() user: User) {
    return this.usersService.getUsers(user.companyId, user.affiliation);
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Get('ports')
  getAllPorts(@CurrentUser() user: User) {
    return this.portsService.getAll();
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Get('ports/:page/:perpage')
  getPortPaged(
    @Param('page', ParseIntPipe) page: number,
    @Param('perpage', ParseIntPipe) perpage: number,
    @Query('filter') filter: string,
    @Query('sort') sort: string,
  ) {
    return this.portsService.getPaged(
      page,
      perpage,
      filter,
      sort,
    );
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Get('ports/:id')
  getDetailPort(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.portsService.getDetail(id);
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Post('ports')
  createPort(@Body() data: CreatePortDto, @CurrentUser() user: User) {
    return this.portsService.create(data, user);
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Put('ports/:id')
  updatePort(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdatePortDto,
    @CurrentUser() user: User,
  ) {
    return this.portsService.update(id, data, user);
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Delete('ports/:id')
  deletePort(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.portsService.delete(id, user);
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Get('banks')
  async getAllBanks(@CurrentUser() user: User) {
    return await this.banksService.findAll(user.companyId)
  }

  @UseGuards(AuthGuard, JwtAuthGuard)
  @Get('currencies')
  async getAllCurrencies(@CurrentUser() user: User) {
    return await this.currenciesService.findAll(user.companyId)
  }

}
