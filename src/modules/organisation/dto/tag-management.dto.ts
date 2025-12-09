import { IsArray, IsInt, IsNotEmpty, ArrayMinSize, ArrayUnique } from 'class-validator';
import { Type } from 'class-transformer';

export class ManageChatTagsDto {
    @IsNotEmpty()
    @IsArray()
    @ArrayMinSize(1)
    @ArrayUnique()
    @IsInt({ each: true })
    @Type(() => Number)
    tag_ids: number[];
}
