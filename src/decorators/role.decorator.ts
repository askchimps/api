import { SetMetadata } from '@nestjs/common';
import { ROLE } from '@prisma/client';

export const Role = (...roles: ROLE[]) => SetMetadata('roles', roles);
