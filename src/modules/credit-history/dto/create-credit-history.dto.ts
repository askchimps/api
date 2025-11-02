import { IsString, IsNumber, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCreditHistoryDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  organisation_id: number;

  @IsNumber()
  change_amount: number;

  @IsString()
  change_type: string; // 'increment', 'decrement', 'set'

  @IsString()
  change_field: string; // 'conversation_credits', 'message_credits', 'call_credits'

  @IsNumber()
  prev_value: number;

  @IsNumber()
  new_value: number;

  @IsString()
  reason: string;
}
