import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EstadoPedido } from '@prisma/client';

@Injectable()
export class EnviosService {
  constructor(@Inject('PrismaClient') private prisma: any) {}

  async findAll(page?: number, size?: number, estadoEnvio?: string) {
    const where: any = {};
    if (estadoEnvio) {
      const estados = estadoEnvio.split(',').filter(Boolean);
      where.estadoEnvio = estados.length === 1 ? estados[0] : { in: estados };
    }

    if (page !== undefined && size !== undefined) {
      const [content, totalElements] = await Promise.all([
        this.prisma.envio.findMany({
          where,
          include: { pedido: { include: { items: true, direccion: { include: { comuna: true, ciudad: true } } } } },
          orderBy: { createdAt: 'desc' },
          skip: page * size,
          take: size,
        }),
        this.prisma.envio.count({ where }),
      ]);
      return {
        content,
        totalPages: Math.ceil(totalElements / size),
        totalElements,
        page,
        size,
      };
    }

    return this.prisma.envio.findMany({
      where,
      include: { pedido: { include: { items: true, direccion: { include: { comuna: true, ciudad: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const envio = await this.prisma.envio.findUnique({
      where: { id },
      include: {
        pedido: {
          include: {
            items: { include: { producto: true } },
            direccion: { include: { comuna: { include: { region: true } }, ciudad: true } },
          },
        },
      },
    });
    if (!envio) throw new NotFoundException('Envío no encontrado');
    return envio;
  }

  async findByPedidoId(pedidoId: string) {
    const envio = await this.prisma.envio.findUnique({
      where: { pedidoId },
      include: {
        pedido: {
          include: {
            items: { include: { producto: true } },
            direccion: { include: { comuna: { include: { region: true } }, ciudad: true } },
          },
        },
      },
    });
    if (!envio) throw new NotFoundException('Envío no encontrado para ese pedido');
    return envio;
  }

  async findByTracking(numeroTracking: string) {
    const envio = await this.prisma.envio.findFirst({
      where: { numeroTracking },
      include: {
        pedido: {
          include: {
            items: { include: { producto: true } },
            direccion: { include: { comuna: { include: { region: true } }, ciudad: true } },
          },
        },
      },
    });
    if (!envio) throw new NotFoundException('No se encontró ningún envío con ese tracking');
    return envio;
  }

  async findProblemas() {
    return this.prisma.envio.findMany({
      where: {
        estadoEnvio: {
          in: ['INTENTO_FALLIDO', 'RETRASADO', 'DEVUELTO'],
        },
      },
      include: {
        pedido: {
          include: { items: true, direccion: { include: { comuna: true, ciudad: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async updateEstado(id: string, nuevoEstado: string) {
    const validStates = Object.values(EstadoPedido);
    if (!validStates.includes(nuevoEstado as EstadoPedido)) {
      throw new BadRequestException(`Estado inválido: ${nuevoEstado}`);
    }

    const envio = await this.prisma.envio.findUnique({ where: { id } });
    if (!envio) throw new NotFoundException('Envío no encontrado');

    const currentIndex = validStates.indexOf(envio.estadoEnvio);
    const newIndex = validStates.indexOf(nuevoEstado as EstadoPedido);

    if (newIndex < currentIndex) {
      throw new BadRequestException(
        `No se puede retroceder de ${envio.estadoEnvio} a ${nuevoEstado}`
      );
    }

    return this.prisma.envio.update({
      where: { id },
      data: { estadoEnvio: nuevoEstado as EstadoPedido },
      include: {
        pedido: {
          include: {
            items: { include: { producto: true } },
            direccion: { include: { comuna: { include: { region: true } }, ciudad: true } },
          },
        },
      },
    });
  }
}
