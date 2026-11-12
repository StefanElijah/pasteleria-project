import { IsEnum } from 'class-validator';
import { EstadoPago } from '@prisma/client';

export class UpdatePaymentStatusDto {
  @IsEnum(EstadoPago)
  estadoPago!: EstadoPago;
}
