import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { OptionalJwtAuthGuard } from '@modules/auth/guards/optional-jwt.guard';
import { PaymentsService } from './payments.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('stripe/checkout-session')
  @UseGuards(OptionalJwtAuthGuard)
  async createStripeCheckout(
    @Req() req: any,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.paymentsService.createStripeCheckout(
      req.user?.userId || null,
      dto.pedidoId,
      dto.token,
    );
  }

  @Get('stripe/session/:sessionId')
  async getStripeSession(
    @Param('sessionId') sessionId: string,
    @Query('token') token?: string,
  ) {
    return this.paymentsService.getStripeSession(sessionId, token);
  }

  @Post('stripe/webhook')
  @HttpCode(200)
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException('No se recibió el cuerpo del webhook');
    }
    return this.paymentsService.handleStripeWebhook(req.rawBody, signature);
  }
}
