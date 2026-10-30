import { IsIn, IsOptional, IsString, Length, Matches } from 'class-validator'
export class CreateApplicationDto {
  @IsString() @Length(1, 100) name!: string
  @IsString() @Length(1, 80) @Matches(/^[a-z0-9-]+$/) slug!: string
  @IsIn(['development', 'staging', 'production']) environment!: 'development' | 'staging' | 'production'
  @IsOptional() @IsString() @Length(0, 500) description?: string
}
export class UpdateApplicationDto {
  @IsOptional() @IsString() @Length(1, 100) name?: string
  @IsOptional() @IsString() @Length(0, 500) description?: string
  @IsOptional() @IsIn(['active', 'disabled']) status?: string
}
