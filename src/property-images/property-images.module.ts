// property-image.module.ts
import { Module } from '@nestjs/common';
import { PropertyImageService } from './property-images.service';
import { PropertyImageController } from './property-images.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PropertyImageController],
  providers: [PropertyImageService, PrismaService],
})
export class PropertyImageModule {}
