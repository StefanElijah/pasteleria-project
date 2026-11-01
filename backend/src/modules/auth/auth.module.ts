import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { CartModule } from '@modules/sales/cart/cart.module';
import { LoyaltyModule } from '@modules/loyalty/loyalty.module';

@Module({
    imports: [
        PassportModule,
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 5 }]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
            }),
        }),
        CartModule,
        LoyaltyModule,
    ],
    providers: [AuthService, LocalStrategy, JwtStrategy, JwtRefreshStrategy],
    controllers: [AuthController],
})
export class AuthModule { }
