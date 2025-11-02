import { PrismaService } from '@modules/common/prisma/prisma.service';

export const checkDuplicate = async (
  prisma: PrismaService,
  model: string,
  conditions: Record<string, any>,
) => {
  const exists = await prisma[model].count({
    where: conditions,
  });

  return !!exists;
};
