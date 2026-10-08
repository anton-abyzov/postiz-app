import { Type } from 'class-transformer';
import {
  IsArray,
  IsDefined,
  IsIn,
  IsInt,
  IsBoolean,
  IsObject,
  Matches,
  ValidateIf,
  IsString,
  Max,
  Min,
  ValidateNested,
  IsOptional,
} from 'class-validator';

export class Collaborators {
  @IsDefined()
  @IsString()
  label: string;
}

export class InstagramAudio {
  @ValidateIf((o, value) => value !== undefined)
  @IsIn(['music', 'original_sound'])
  audioType?: 'music' | 'original_sound';

  @ValidateIf((o, value) => value !== undefined)
  @IsBoolean()
  use_for_ads?: boolean;

  @IsDefined()
  @IsString()
  @Matches(/^[1-9]\d*$/)
  id: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  artist?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @ValidateIf((o, value) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(100)
  audio_volume?: number;

  @ValidateIf((o, value) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(100)
  video_volume?: number;
}
export class InstagramDto {
  @IsIn(['post', 'story'])
  @IsDefined()
  post_type: 'post' | 'story';

  @IsOptional()
  is_trial_reel?: boolean;

  @IsIn(['MANUAL', 'SS_PERFORMANCE'])
  @IsOptional()
  graduation_strategy?: 'MANUAL' | 'SS_PERFORMANCE';

  @Type(() => Collaborators)
  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  collaborators: Collaborators[];

  @Type(() => InstagramAudio)
  @IsObject()
  @ValidateNested()
  @IsOptional()
  audio?: InstagramAudio;
}
