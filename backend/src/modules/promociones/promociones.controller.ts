import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PromocionesService } from './promociones.service';
import { CreatePromocionDto } from './dto/create-promocion.dto';
import { UpdatePromocionDto } from './dto/update-promocion.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@modules/auth/decorators/roles.decorator';

@Controller('promociones')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MODERADOR')
export class PromocionesController {
    constructor(private readonly promocionesService: PromocionesService) { }

    @Post()
    create(@Body() dto: CreatePromocionDto) {
        return this.promocionesService.create(dto);
    }

    @Post('validar')
    validar(@Body() dto: CreatePromocionDto) {
        return this.promocionesService.validarSolapamiento(dto);
    }

    @Get()
    findAll() {
        return this.promocionesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.promocionesService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdatePromocionDto) {
        return this.promocionesService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.promocionesService.remove(id);
    }
}
