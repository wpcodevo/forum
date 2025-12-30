import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class updateQuestionDto {
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(200)
  title?: string

  @IsOptional()
  @IsString()
  @MinLength(30)
  @MaxLength(10000)
  content?: string
}