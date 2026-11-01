import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class DevolucionItemDto {
    @IsString()
    @IsNotEmpty()
    itemPedidoId!: string;

    @IsInt()
    @Min(1)
    cantidad!: number;
}

export class SolicitarDevolucionDto {
    @IsString()
    @IsNotEmpty()
    pedidoId!: string;

    @IsOptional()
    @IsString()
    motivo?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DevolucionItemDto)
    items!: DevolucionItemDto[];
}
