import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
  ValidateIf,
  IsDefined,
} from 'class-validator';

export enum CreditType {
  CONVERSATION = 'conversation',
  MESSAGE = 'message',
  CALL = 'call',
}

export enum CreditOperation {
  INCREMENT = 'increment',
  DECREMENT = 'decrement',
  SET = 'set',
}

export class PatchCreditsDto {
  @IsEnum(CreditType)
  credit_type: CreditType;

  @IsEnum(CreditOperation)
  operation: CreditOperation;

  // For increment/decrement: positive number (floats allowed)
  @Transform(({ value }) => parseFloat(value))
  @ValidateIf(
    (o) =>
      o.operation === CreditOperation.INCREMENT ||
      o.operation === CreditOperation.DECREMENT,
  )
  @IsDefined({
    message: 'amount is required for increment/decrement operations',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'amount must be a number' })
  @Min(0.000000001, { message: 'amount must be greater than 0' })
  amount?: number;

  // For set: non-negative number (floats allowed)
  @Transform(({ value }) => parseFloat(value))
  @ValidateIf((o) => o.operation === CreditOperation.SET)
  @IsDefined({ message: 'value is required for set operation' })
  @Type(() => Number)
  @IsNumber({}, { message: 'value must be a number' })
  @Min(0, { message: 'value must be a non-negative number' })
  value?: number;
}
