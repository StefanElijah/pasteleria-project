import { Module } from '@nestjs/common';
import { DevolucionesService } from './devoluciones.service';
import { DevolucionesController } from './devoluciones.controller';
import { LoyaltyModule } from '@modules/loyalty/loyalty.module';

@Module({
    imports: [LoyaltyModule],
    controllers: [DevolucionesController],
    providers: [DevolucionesService],
})
export class DevolucionesModule { }
