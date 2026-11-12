import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '@modules/auth/guards/optional-jwt.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@modules/auth/decorators/roles.decorator';

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    @UseGuards(OptionalJwtAuthGuard)
    async create(@Req() req: any, @Body() createOrderDto: CreateOrderDto) {
        const userId = req.user?.userId || null;
        let cartId = req.headers['x-cart-id'] || req.cookies?.cartId;
        if (userId) cartId = `user:${userId}`;
        return this.ordersService.create(
            userId,
            createOrderDto,
            cartId,
            req.headers['user-agent'],
            { clearCart: createOrderDto.metodoPago !== 'TARJETA' },
        );
    }

    @Get('numero/:numeroPedido')
    @UseGuards(JwtAuthGuard)
    async findByNumero(@Param('numeroPedido') numeroPedido: string, @Req() req: any) {
        return this.ordersService.findByNumero(numeroPedido, req.user.userId, req.user.rol);
    }

    @Get('track/:token')
    async findByTrackingToken(@Param('token') token: string) {
        return this.ordersService.findByTrackingToken(token);
    }

    @Get('shipping')
    async calculateShipping(@Query('comunaId') comunaId: string, @Query('metodo') metodo: string) {
        return this.ordersService.calculateShipping(comunaId, metodo);
    }

    @Get('status-info')
    async getStatusInfo() {
        return this.ordersService.getStatusInfo();
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(@Req() req: any) {
        return this.ordersService.findAll(req.user);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('id') id: string, @Req() req: any) {
        return this.ordersService.findOne(id, req.user.userId, req.user.rol);
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'MODERADOR')
    async updateStatus(@Param('id') id: string, @Body('estado') estado: string, @Req() req: any) {
        return this.ordersService.updateStatus(id, estado as any, req.user.userId, req.user.rol);
    }

    @Patch(':id/payment-status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'MODERADOR')
    async updatePaymentStatus(
        @Param('id') id: string,
        @Body() dto: UpdatePaymentStatusDto,
        @Req() req: any,
    ) {
        return this.ordersService.updatePaymentStatus(
            id,
            dto.estadoPago,
            req.user.userId,
            req.user.rol,
        );
    }
}