import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { CartModule } from '@modules/sales/cart/cart.module';
import { LoyaltyModule } from '@modules/loyalty/loyalty.module';

@Module({
  imports: [CartModule, LoyaltyModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule { }