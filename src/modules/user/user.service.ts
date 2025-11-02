import { PinoLoggerService } from '@modules/common/logger/pinoLogger.service';
import { PrismaService } from '@modules/common/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { SyncUserDTO } from './dto/sync.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly logger: PinoLoggerService,
    private readonly prisma: PrismaService,
  ) {}

  async sync(data: SyncUserDTO) {
    const methodName = 'sync';
    this.logger.log(
      JSON.stringify({
        title: `${methodName} - start`,
        data,
      }),
      methodName,
    );

    const user = await this.prisma.user.upsert({
      where: { id: data.id },
      update: { name: data.name, email: data.email },
      create: data,
    });

    this.logger.log(
      JSON.stringify({
        title: `${methodName} - end`,
        data: user,
      }),
      methodName,
    );

    return user;
  }
}
