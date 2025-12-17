import { SetMetadata } from '@nestjs/common';
import { ROLE } from '@prisma/public-client';

export const Role = (...roles: ROLE[]) => SetMetadata('roles', roles);
