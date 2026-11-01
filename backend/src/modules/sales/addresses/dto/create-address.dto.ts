import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoVivienda } from '@prisma/client';

export class CreateAddressDto {
    @IsString()
    @IsNotEmpty()
    calle!: string;

    @IsString()
    @IsNotEmpty()
    numero!: string;

    @IsOptional()
    @IsString()
    ciudadId?: string;

    @IsOptional()
    @IsString()
    codigoPostal?: string;

    @IsOptional()
    @IsString()
    telefono?: string;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    isDefault?: boolean;

    @IsOptional()
    @IsEnum(TipoVivienda)
    tipoVivienda?: TipoVivienda;

    @IsString()
    @IsNotEmpty()
    comunaId!: string;
}