import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { DevolucionesService } from './devoluciones.service';
import { SolicitarDevolucionDto } from './dto/solicitar-devolucion.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@modules/auth/decorators/roles.decorator';

@Controller('devoluciones')
@UseGuards(JwtAuthGuard)
export class DevolucionesController {
    constructor(private readonly devolucionesService: DevolucionesService) { }

    // Cliente
    @Post('solicitar')
    solicitar(@Req() req: any, @Body() dto: SolicitarDevolucionDto) {
        return this.devolucionesService.solicitar(req.user.userId, dto);
    }

    @Get('mias')
    mias(@Req() req: any) {
        return this.devolucionesService.getMias(req.user.userId);
    }

    @Get('pedido/:pedidoId')
    porPedido(@Param('pedidoId') pedidoId: string, @Req() req: any) {
        return this.devolucionesService.getByPedido(pedidoId, req.user.userId, req.user.rol);
    }

    // Admin
    @Get()
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'MODERADOR')
    findAll() {
        return this.devolucionesService.findAll();
    }

    @Get(':id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'MODERADOR')
    findOne(@Param('id') id: string) {
        return this.devolucionesService.findOne(id);
    }

    @Patch(':id/estado')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'MODERADOR')
    updateEstado(@Param('id') id: string, @Body('estado') estado: 'APROBADA' | 'RECHAZADA') {
        return this.devolucionesService.updateEstado(id, estado);
    }

    @Post(':id/procesar')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'MODERADOR')
    procesar(@Param('id') id: string) {
        return this.devolucionesService.procesar(id);
    }

    @Post(':id/reponer-stock')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'MODERADOR')
    reponerStock(@Param('id') id: string) {
        return this.devolucionesService.reponerStock(id);
    }
}
