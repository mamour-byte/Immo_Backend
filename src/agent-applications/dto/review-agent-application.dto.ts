import { IsOptional, IsString } from 'class-validator';

export class ReviewAgentApplicationDto {
  @IsOptional()
  @IsString()
  decisionNote?: string;
}

