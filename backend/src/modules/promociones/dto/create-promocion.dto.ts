import {
    IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min, Max,
    IsBoolean, IsArray, IsDateString,
} from 'class-validator';
import { ObjetivoPromocion } from '@prisma/client';

export class CreatePromocionDto {
    @IsString()
    @IsNotEmpty()
    nombre!: string;

    @IsInt()
    @Min(1)
    @Max(200)
    bonoPorcentaje!: number;

    @IsOptional()
    @IsEnum(ObjetivoPromocion)
    objetivo?: ObjetivoPromocion;

    @IsOptional()
    @IsDateString()
    fechaInicio?: string;

    @IsOptional()
    @IsDateString()
    fechaFin?: string;

    @IsOptional()
    @IsInt()
    prioridad?: number;

    @IsOptional()
    @IsBoolean()
    activo?: boolean;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    productoIds?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    categoriaIds?: string[];
}
