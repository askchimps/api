import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { SyncUserDTO } from './dto/sync.dto';

@Controller({
  path: 'user',
  version: '1',
})
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('sync')
  async sync(@Body() data: SyncUserDTO) {
    return this.userService.sync(data);
  }
}
