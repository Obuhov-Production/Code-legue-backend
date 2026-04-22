import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SendContactDto {
  @IsIn(['problem', 'join_team'])
  type: 'problem' | 'join_team';

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

  /** problem */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  /** join_team */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  budget?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  level?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  details?: string;
}
