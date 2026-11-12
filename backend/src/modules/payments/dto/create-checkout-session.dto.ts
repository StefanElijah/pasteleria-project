import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsString()
  @IsNotEmpty()
  pedidoId!: string;

  @IsOptional()
  @IsString()
  token?: string;
}
