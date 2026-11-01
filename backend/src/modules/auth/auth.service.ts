import { Injectable, Inject, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CartService } from '@modules/sales/cart/cart.service';
import { LoyaltyService } from '@modules/loyalty/loyalty.service';
import { splitPersonName } from '@/lib/normalize-name';

@Injectable()
export class AuthService {
    constructor(
        @Inject('PrismaClient') private prisma: any,
        private jwtService: JwtService,
        private cartService: CartService,
        private loyalty: LoyaltyService,
    ) { }

    // Vincula pedidos de invitado al usuario por coincidencia de email
    private async vincularPedidos(userId: string, email: string) {
        try {
            await this.prisma.pedido.updateMany({
                where: {
                    emailDestinatario: { equals: email, mode: 'insensitive' },
                    usuarioId: null,
                },
                data: { usuarioId: userId },
            });
        } catch {
            // No bloquear el login/registro si falla la vinculación
        }
    }

    // Crea el cupón de bienvenida personal (10%, mín $10.000, 1 uso, 30 días)
    private async crearCuponBienvenida(userId: string) {
        const sufijo = Math.random().toString(36).slice(2, 8).toUpperCase();
        const fechaFin = new Date();
        fechaFin.setMonth(fechaFin.getMonth() + 1);
        try {
            await this.prisma.descuento.create({
                data: {
                    nombre: 'Cupón de bienvenida 10%',
                    codigo: `BIENVENIDA-${sufijo}`,
                    tipo: 'PORCENTAJE',
                    valor: 10,
                    objetivo: 'TODO',
                    activo: true,
                    valorMinimoPedido: 10000,
                    limiteUso: 1,
                    limiteUsoPorUsuario: 1,
                    fechaFin,
                    usuarioId: userId,
                },
            });
        } catch {
            // Si colisiona el código, no bloquear el registro
        }
    }

    async validateUser(email: string, password: string) {
        const user = await this.prisma.usuario.findUnique({ where: { email } });
        if (user && (await bcrypt.compare(password, user.password))) {
            const { password: _, ...result } = user;
            return result;
        }
        return null;
    }

    async findById(userId: string) {
        const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('Usuario no encontrado');
        const { password: _, ...result } = user;
        return result;
    }

    private getTokens(userId: string, email: string, rol: string) {
        const payload = { sub: userId, email, rol };
        return {
            access_token: this.jwtService.sign(payload, { expiresIn: '15m' }),
            refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
        };
    }

    async login(loginDto: LoginDto, anonCartId?: string) {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        if (!user) throw new UnauthorizedException('Credenciales incorrectas');
        if (anonCartId && anonCartId.startsWith('anon_')) {
            await this.cartService.mergeCarts(anonCartId, user.id);
        }
        // Vincula pedidos de invitado hechos con este email (escenario C)
        await this.vincularPedidos(user.id, user.email);
        const tokens = this.getTokens(user.id, user.email, user.rol);
        return { ...tokens, user };
    }

    async refresh(userId: string) {
        const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
        if (!user) throw new UnauthorizedException('Usuario no válido');
        return this.getTokens(user.id, user.email, user.rol);
    }

    async register(registerDto: RegisterDto) {
        const { email, password, primerNombre, primerApellido, segundoNombre, segundoApellido } = registerDto;
        const hashedPassword = await bcrypt.hash(password, 10);

        const nombre = splitPersonName(primerNombre, segundoNombre);
        const apellido = splitPersonName(primerApellido, segundoApellido);

        const newUser = await this.prisma.usuario.create({
            data: {
                email,
                password: hashedPassword,
                rol: 'CLIENTE',
                estado: 'ACTIVO',
                primerNombre: nombre.first as string,
                segundoNombre: nombre.second,
                primerApellido: apellido.first as string,
                segundoApellido: apellido.second,
                perfilCliente: {
                    create: {},
                },
            },
            include: { perfilCliente: true },
        });

        // Beneficios de bienvenida + vinculación de compras previas de invitado
        await this.crearCuponBienvenida(newUser.id);
        await this.loyalty.bonificarBienvenida(newUser.id);
        await this.vincularPedidos(newUser.id, newUser.email);

        const { password: _, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    }
}
