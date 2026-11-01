import { Controller, Get, Param, Query } from '@nestjs/common';
import { CiudadesService } from './ciudades.service';

@Controller('ciudades')
export class CiudadesController {
    constructor(private readonly ciudadesService: CiudadesService) { }

    @Get()
    async findAll(@Query('regionId') regionId?: string) {
        return this.ciudadesService.findAll(regionId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.ciudadesService.findOne(id);
    }

    @Get(':id/comunas')
    async getComunas(@Param('id') id: string) {
        return this.ciudadesService.findComunasByCiudad(id);
    }
}
