import { User, UserOrganisation } from '@prisma/public-client';
import { Request } from 'express';

export interface AuthRequest extends Request {
  user: User & {
    user_organisations: UserOrganisation[];
  };
}
