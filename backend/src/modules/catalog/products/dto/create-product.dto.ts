import { IsString, IsInt, IsOptional, IsBoolean, IsArray, Min, MaxLength, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nombre!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    slug!: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsInt()
    @Min(0)
    @Type(() => Number)
    precio!: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    precioComparacion?: number | null;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    imagenes?: string[];

    @IsOptional()
    @IsString()
    imagenPrincipal?: string;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    novedad?: boolean;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    destacado?: boolean;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    activo?: boolean;

    @IsString()
    @IsNotEmpty()
    categoriaId!: string;
}