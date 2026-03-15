import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { AgentApplicationsService } from './agent-applications.service';
import { ApplyAgentDto } from './dto/apply-agent.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AgentApplicationStatus } from '@prisma/client';
import { UpdateAgentApplicationDto } from './dto/update-agent-application.dto';
import { ReviewAgentApplicationDto } from './dto/review-agent-application.dto';
import { Request as ExpressRequest } from 'express';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { agentApplicationsStorage } from '../cloudinary/cloudinary-storage';
import { ApplyAgentFullDto } from './dto/apply-agent-full.dto';

type RequestWithUser = ExpressRequest & {
  user: { id: number; role: string };
};

@Controller('agent-applications')
export class AgentApplicationsController {
  constructor(private readonly service: AgentApplicationsService) {}

  @Post('apply')
  apply(@Body() dto: ApplyAgentDto) {
    return this.service.apply(dto);
  }

  private static readonly MAX_UPLOAD_BYTES =
    Number(process.env.MAX_AGENT_DOC_BYTES) > 0
      ? Number(process.env.MAX_AGENT_DOC_BYTES)
      : 8 * 1024 * 1024; // 8MB

  private static readonly uploadOptions = {
    storage: agentApplicationsStorage,
    limits: {
      files: 6,
      fileSize: AgentApplicationsController.MAX_UPLOAD_BYTES,
    },
    fileFilter: (req: any, file: any, cb: any) => {
      const ok = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
      ].includes(file?.mimetype);
      if (!ok) return cb(new BadRequestException('Format non supporté (jpg, png, webp, pdf).'), false);
      return cb(null, true);
    },
  };

  @Post('apply-full')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profilePhoto', maxCount: 1 },
        { name: 'idDocument', maxCount: 1 },
        { name: 'tradeRegister', maxCount: 1 },
        { name: 'professionalCard', maxCount: 1 },
        { name: 'agencyLogo', maxCount: 1 },
        { name: 'agencyPhoto', maxCount: 1 },
      ],
      AgentApplicationsController.uploadOptions,
    ),
  )
  applyFull(
    @Body() dto: ApplyAgentFullDto,
    @UploadedFiles()
    files: {
      profilePhoto?: Express.Multer.File[];
      idDocument?: Express.Multer.File[];
      tradeRegister?: Express.Multer.File[];
      professionalCard?: Express.Multer.File[];
      agencyLogo?: Express.Multer.File[];
      agencyPhoto?: Express.Multer.File[];
    },
  ) {
    return this.service.applyFull(dto, files || {});
  }

  @Post('me/apply')
  @UseGuards(JwtAuthGuard)
  applyMe(@Req() req: RequestWithUser, @Body() dto: UpdateAgentApplicationDto) {
    return this.service.applyForExistingUser(req.user.id, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: RequestWithUser) {
    return this.service.getMine(req.user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(@Req() req: RequestWithUser, @Body() dto: UpdateAgentApplicationDto) {
    return this.service.updateMine(req.user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  list(@Query('status') status?: AgentApplicationStatus) {
    return this.service.list(status);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
    @Body() dto: ReviewAgentApplicationDto,
  ) {
    return this.service.approve(id, req.user.id, dto?.decisionNote);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
    @Body() dto: ReviewAgentApplicationDto,
  ) {
    return this.service.reject(id, req.user.id, dto?.decisionNote);
  }
}
