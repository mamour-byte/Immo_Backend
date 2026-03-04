import { Module } from '@nestjs/common';
import { Asset3DService } from './assets3d.service';
import { Asset3DController } from './assets3d.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [Asset3DController],
  providers: [Asset3DService, PrismaService],
})
export class Asset3DModule {}
