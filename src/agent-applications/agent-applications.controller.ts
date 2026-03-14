import {
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
