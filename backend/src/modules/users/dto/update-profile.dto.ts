import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    primerNombre?: string;

    @IsOptional()
    @IsString()
    segundoNombre?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    primerApellido?: string;

    @IsOptional()
    @IsString()
    segundoApellido?: string;

    @IsOptional()
    @IsString()
    telefono?: string;
}
