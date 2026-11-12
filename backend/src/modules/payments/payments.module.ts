import { Module } from '@nestjs/common';
import { CartModule } from '@modules/sales/cart/cart.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeProvider } from './providers/stripe.provider';

@Module({
  imports: [CartModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeProvider],
})
export class PaymentsModule {}
