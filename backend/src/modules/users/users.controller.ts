import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Patch('profile')
    updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
        return this.usersService.updateProfile(req.user.userId, dto);
    }

    @Get('cupones')
    getCupones(@Req() req: any) {
        return this.usersService.getCupones(req.user.userId);
    }

    @Get('puntos')
    getPuntos(@Req() req: any) {
        return this.usersService.getPuntos(req.user.userId);
    }
}
