import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            price: true,
            purpose: true,
            rentalMode: true,
            status: true,
            city: { select: { name: true } },
            district: { select: { name: true } },
            agent: { select: { id: true, fullName: true, email: true, phone: true } },
          },
        },
      },
    });
  }

  markRead(id: number, read = true) {
    return this.prisma.message.update({
      where: { id },
      data: { read },
    });
  }
}
