import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { AgentProfileType } from '@prisma/client';

export class ApplyAgentFullDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  // Personal
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsEnum(AgentProfileType)
  profileType!: AgentProfileType;

  // Professional
  @IsOptional()
  @IsString()
  agencyName?: string;

  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(0)
  yearsExperience?: number;

  @IsOptional()
  @IsString()
  activityZone?: string;

  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(0)
  managedPropertiesCount?: number;

  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @IsOptional()
  @IsString()
  facebookUrl?: string;

  // Public contact
  @IsString()
  @IsNotEmpty()
  whatsapp!: string;

  @IsString()
  @IsNotEmpty()
  publicPhone!: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore
    }
    return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
  })
  @IsArray()
  @IsString({ each: true })
  languages!: string[];

  @IsString()
  @IsNotEmpty()
  publicDescription!: string;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  acceptedTerms!: boolean;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  certifiedTrue!: boolean;
}

