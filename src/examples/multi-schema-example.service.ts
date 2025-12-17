import { Injectable } from '@nestjs/common';
import { PublicPrismaService } from '@modules/common/prisma/prisma.service';
import { MagpiePrismaService } from '@modules/common/prisma/magpie-prisma.service';
import { SunroofPrismaService } from '@modules/common/prisma/sunroof-prisma.service';

/**
 * Example service demonstrating how to use all three Prisma clients
 * 
 * This service shows how to:
 * 1. Inject all three Prisma services
 * 2. Query data from different databases
 * 3. Perform cross-database operations
 */
@Injectable()
export class MultiSchemaExampleService {
  constructor(
    private readonly publicPrisma: PublicPrismaService,
    private readonly magpiePrisma: MagpiePrismaService,
    private readonly sunroofPrisma: SunroofPrismaService,
  ) {}

  /**
   * Example: Query data from the public (AskChimps) database
   */
  async getPublicUsers() {
    return await this.publicPrisma.user.findMany({
      where: { is_deleted: 0 },
      take: 10,
    });
  }

  /**
   * Example: Query data from the Magpie database
   */
  async getMagpieLeads() {
    return await this.magpiePrisma.lead.findMany({
      take: 10,
    });
  }

  /**
   * Example: Query data from the Sunroof database
   */
  async getSunroofLeads() {
    return await this.sunroofPrisma.lead.findMany({
      take: 10,
    });
  }

  /**
   * Example: Perform operations across multiple databases
   * This demonstrates how you can work with data from different sources
   */
  async getCombinedData() {
    const [publicUsers, magpieLeads, sunroofLeads] = await Promise.all([
      this.publicPrisma.user.findMany({ take: 5 }),
      this.magpiePrisma.lead.findMany({ take: 5 }),
      this.sunroofPrisma.lead.findMany({ take: 5 }),
    ]);

    return {
      askchimps: {
        users: publicUsers,
      },
      magpie: {
        leads: magpieLeads,
      },
      sunroof: {
        leads: sunroofLeads,
      },
    };
  }

  /**
   * Example: Create data in Magpie database
   */
  async createMagpieLead(data: {
    phone: string;
    first_name?: string;
    last_name?: string;
    source: 'ZOHO' | 'INSTAGRAM' | 'WHATSAPP';
  }) {
    return await this.magpiePrisma.lead.create({
      data: {
        phone: data.phone,
        first_name: data.first_name,
        last_name: data.last_name,
        source: data.source,
      },
    });
  }

  /**
   * Example: Create data in Sunroof database
   */
  async createSunroofLead(data: {
    phone: string;
    first_name?: string;
    last_name?: string;
    source: 'ZOHO' | 'INSTAGRAM' | 'WHATSAPP';
  }) {
    return await this.sunroofPrisma.lead.create({
      data: {
        phone: data.phone,
        first_name: data.first_name,
        last_name: data.last_name,
        source: data.source,
      },
    });
  }

  /**
   * Example: Transaction in a specific database
   * Each Prisma client has its own transaction context
   */
  async createMagpieLeadWithTransaction(data: {
    phone: string;
    first_name?: string;
    last_name?: string;
    source: 'ZOHO' | 'INSTAGRAM' | 'WHATSAPP';
  }) {
    return await this.magpiePrisma.$transaction(async (tx) => {
      // Create lead
      const lead = await tx.lead.create({
        data: {
          phone: data.phone,
          first_name: data.first_name,
          last_name: data.last_name,
          source: data.source,
        },
      });

      // You can perform multiple operations within the transaction
      // All will be committed together or rolled back if any fails

      return lead;
    });
  }

  /**
   * Example: Health check for all database connections
   */
  async checkDatabaseConnections() {
    try {
      await Promise.all([
        this.publicPrisma.$queryRaw`SELECT 1`,
        this.magpiePrisma.$queryRaw`SELECT 1`,
        this.sunroofPrisma.$queryRaw`SELECT 1`,
      ]);

      return {
        public: 'connected',
        magpie: 'connected',
        sunroof: 'connected',
      };
    } catch (error) {
      return {
        public: 'error',
        magpie: 'error',
        sunroof: 'error',
        error: error.message,
      };
    }
  }
}

