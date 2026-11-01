import {
    IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min,
    IsBoolean, IsArray, IsDateString,
} from 'class-validator';
import { TipoDescuento, ObjetivoDescuento } from '@prisma/client';

export class CreateDiscountDto {
    @IsString()
    @IsNotEmpty()
    nombre!: string;

    @IsOptional()
    @IsString()
    codigo?: string;

    @IsEnum(TipoDescuento)
    tipo!: TipoDescuento;

    @IsInt()
    @Min(0)
    valor!: number;

    @IsOptional()
    @IsEnum(ObjetivoDescuento)
    objetivo?: ObjetivoDescuento;

    @IsOptional()
    @IsDateString()
    fechaInicio?: string;

    @IsOptional()
    @IsDateString()
    fechaFin?: string;

    @IsOptional()
    @IsBoolean()
    activo?: boolean;

    @IsOptional()
    @IsInt()
    @Min(0)
    valorMinimoPedido?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    limiteUso?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    limiteUsoPorUsuario?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    productoIds?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    categoriaIds?: string[];
}
