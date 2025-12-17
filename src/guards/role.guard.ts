import { PrismaService } from '@modules/common/prisma/prisma.service';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE, UserOrganisation } from '@prisma/public-client';
import { AuthRequest } from 'types/auth-request';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<ROLE[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) return true;

    const req = context.switchToHttp().getRequest<AuthRequest>();

    const { org_id, org_slug, org_id_or_slug } = req.params;
    const user = req.user;

    if (user.is_super_admin) return true;

    let userOrganisation: UserOrganisation | null = null;

    if (org_id) {
      userOrganisation =
        user.user_organisations.find(
          (org) => org.organisation_id === Number(org_id),
        ) || null;
    } else if (org_slug) {
      userOrganisation = await this.prisma.userOrganisation.findFirst({
        where: {
          user_id: user.id,
          organisation: {
            slug: org_slug,
          },
        },
      });
    } else if (org_id_or_slug) {
      userOrganisation = await this.prisma.userOrganisation.findFirst({
        where: {
          user_id: user.id,
          organisation: {
            OR: [
              {
                id: isNaN(Number(org_id_or_slug))
                  ? undefined
                  : Number(org_id_or_slug),
              },
              { slug: org_id_or_slug },
            ],
          },
        },
      });
    }

    if (!userOrganisation || !requiredRoles.includes(userOrganisation.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
