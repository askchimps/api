import { User, UserOrganisation } from '@prisma/client';
import { Request } from 'express';

export interface AuthRequest extends Request {
  user: User & {
    user_organisations: UserOrganisation[];
  };
}
