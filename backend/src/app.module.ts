import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from '@modules/catalog/products/products.module';
import { CategoriesModule } from '@modules/catalog/categories/categories.module';
import { RedisModule } from './redis/redis.module';
import { CartModule } from '@modules/sales/cart/cart.module';
import { RegionesModule } from './modules/locations/regiones/regiones.module';
import { ComunasModule } from './modules/locations/comunas/comunas.module';
import { CiudadesModule } from './modules/locations/ciudades/ciudades.module';
import { AddressesModule } from '@modules/sales/addresses/addresses.module';
import { OrdersModule } from '@modules/sales/orders/orders.module';
import { ShippingModule } from '@modules/sales/shipping/shipping.module';
import { EnviosModule } from '@modules/sales/envios/envios.module';
import { StatsModule } from './modules/stats/stats.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { CheckoutModule } from '@modules/sales/checkout/checkout.module';
import { UsersModule } from '@modules/users/users.module';
import { LoyaltyModule } from '@modules/loyalty/loyalty.module';
import { DiscountsModule } from '@modules/discounts/discounts.module';
import { PromocionesModule } from '@modules/promociones/promociones.module';
import { DevolucionesModule } from '@modules/sales/devoluciones/devoluciones.module';
import { PaymentsModule } from '@modules/payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    AuthModule,
    ProductsModule,
    CategoriesModule,
    CartModule,
    ComunasModule,
    CiudadesModule,
    RegionesModule,
    AddressesModule,
    OrdersModule,
    ShippingModule,
    EnviosModule,
    StatsModule,
    CloudinaryModule,
    CheckoutModule,
    UsersModule,
    LoyaltyModule,
    DiscountsModule,
    PromocionesModule,
    DevolucionesModule,
    PaymentsModule,
  ],
})
export class AppModule {}
