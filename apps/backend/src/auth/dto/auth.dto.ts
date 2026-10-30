import { IsOptional, IsString, Length, Matches } from 'class-validator'

export class RegisterDto {
  @IsString() @Length(3, 50) @Matches(/^[a-zA-Z0-9_]+$/) username!: string
  @IsString() @Length(8, 128) password!: string
  @IsOptional() @IsString() @Length(1, 80) displayName?: string
}
export class LoginDto {
  @IsString() username!: string
  @IsString() password!: string
}
export class RefreshDto {
  @IsString() refreshToken!: string
}
