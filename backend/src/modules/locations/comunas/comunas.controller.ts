import { Controller, Get, Param, Query } from '@nestjs/common';
import { ComunasService } from './comunas.service';

@Controller('comunas')
export class ComunasController {
    constructor(private readonly comunasService: ComunasService) { }

    @Get()
    async findAll(@Query('regionId') regionId?: string, @Query('ciudadId') ciudadId?: string) {
        return this.comunasService.findAll(regionId, ciudadId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.comunasService.findOne(id);
    }
}