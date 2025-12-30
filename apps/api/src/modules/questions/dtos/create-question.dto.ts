import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength, MinLength } from "class-validator"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

export class CreateQuestionDto {
  @ApiProperty({ description: "Question title", minLength: 10, maxLength: 200 })
  @IsString()
  @MinLength(10, { message: "Title must be at least 10 characters long" })
  @MaxLength(200, { message: "Title must not exceed 200 characters" })
  title: string

  @ApiProperty({ description: "Question content", minLength: 30, maxLength: 10000 })
  @IsString()
  @MinLength(30, { message: "Content must be at least 30 characters long" })
  @MaxLength(10000, { message: "Content must not exceed 10000 characters" })
  content: string

  @ApiPropertyOptional({
    description: "Question tags",
    type: [String],
    maxItems: 5,
    example: ["javascript", "nestjs"]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5, { message: "You can add up to 5 tags only" })
  tags?: string[]
}