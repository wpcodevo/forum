import { IsIn, IsNumber, IsString, MaxLength, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateAnswerDto {
  @ApiProperty({ description: "Answer content", minLength: 30, maxLength: 10000 })
  @IsString()
  @MinLength(30, { message: "Answer must be at least 30 characters long" })
  @MaxLength(10000, { message: "Answer must not exceed 10000 characters" })
  content: string
}

export class VoteAnswerDto {
  @ApiProperty({
    description: "Vote value",
    enum: [-1, 0, 1],
    example: 1
  })
  @IsNumber()
  @IsIn([-1, 0, 1], { message: "Vote value must be -1 (downvote), 0 (remove vote), or 1 (upvote)" })
  value: number
}