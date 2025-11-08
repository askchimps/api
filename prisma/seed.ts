import { PrismaClient, ROLE } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
    console.log('🧹 Cleaning database...');

    await prisma.cost.deleteMany({});
    await prisma.creditHistory.deleteMany({});
    await prisma.message.deleteMany({});
    await prisma.call.deleteMany({});
    await prisma.chat.deleteMany({});
    await prisma.zohoLead.deleteMany({});
    await prisma.lead.deleteMany({});
    await prisma.zohoLeadOwner.deleteMany({});
    await prisma.agent.deleteMany({});
    await prisma.userOrganisation.deleteMany({});
    await prisma.organisation.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('✅ Database cleaned!');

    const users = [
        {
            id: '9fd7bc42-7424-43b3-946a-6895bcbc31d0',
            name: 'AskChimps Admin',
            email: 'admin@askchimps.com',
            phone_number: '+1234567890',
            is_super_admin: 1,
            is_disabled: 0,
            is_deleted: 0
        },
        {
            id: '19988c67-b5a3-4046-95f6-e62b87700a01',
            name: 'Sunrooof Admin',
            email: 'admin@sunrooof.com',
            phone_number: '+1234567891',
            is_super_admin: 0,
            is_disabled: 0,
            is_deleted: 0
        },
        {
            id: 'a4be2830-696e-4b2f-9dae-b5fd2d05dbc8',
            name: 'Magppie Admin',
            email: 'admin@magppie.com',
            phone_number: '+1234567892',
            is_super_admin: 0,
            is_disabled: 0,
            is_deleted: 0
        }
    ];

    console.log('👤 Creating users...');
    await prisma.user.createMany({ data: users });

    const organizations = [
        {
            name: 'AskChimps',
            slug: 'askchimps',
            chat_credits: 1000,
            call_credits: 600,
            updated_by_user: users[0].id
        },
        {
            name: 'Sunrooof',
            slug: 'sunrooof',
            chat_credits: 100,
            call_credits: 60,
            updated_by_user: users[1].id
        },
        {
            name: 'Magppie',
            slug: 'magppie',
            chat_credits: 0,
            call_credits: 60,
            updated_by_user: users[2].id
        }
    ];

    console.log('🏢 Creating organizations...');
    const createdOrganizations: any[] = [];
    for (const org of organizations) {
        const createdOrg = await prisma.organisation.create({ data: org });
        createdOrganizations.push(createdOrg);
    }

    console.log('🔗 Creating user-organization relationships...');

    await prisma.userOrganisation.create({
        data: {
            user_id: users[0].id,
            organisation_id: createdOrganizations[0].id,
            role: ROLE.OWNER
        }
    });

    await prisma.userOrganisation.create({
        data: {
            user_id: users[1].id,
            organisation_id: createdOrganizations[1].id,
            role: ROLE.OWNER
        }
    });

    await prisma.userOrganisation.create({
        data: {
            user_id: users[2].id,
            organisation_id: createdOrganizations[2].id,
            role: ROLE.OWNER
        }
    });

    console.log('🤖 Creating agents...');

    const askchimpsAgents = await Promise.all([
        prisma.agent.create({
            data: {
                name: 'Magppie - Outbound Sales Pre Qualifier',
                slug: 'askchimps-magppie-outbound-sales-pre-qualifier',
                type: "CALL",
                organisation_id: createdOrganizations[0].id,
                base_prompt: '',
                initial_prompt: '',
                analysis_prompt: '',
                updated_by_user: users[0].id
            }
        }),
        prisma.agent.create({
            data: {
                name: 'Sunrooof - Outbound Sales Pre Qualifier',
                slug: 'askchimps-sunrooof-outbound-sales-pre-qualifier',
                type: "CALL",
                organisation_id: createdOrganizations[0].id,
                base_prompt: '',
                initial_prompt: '',
                analysis_prompt: '',
                updated_by_user: users[0].id
            }
        })
    ]);

    const sunrooofAgents = await Promise.all([
        prisma.agent.create({
            data: {
                name: 'Outbound Sales Pre Qualifier',
                slug: 'sunrooof-outbound-sales-pre-qualifier',
                type: "CALL",
                organisation_id: createdOrganizations[1].id,
                base_prompt: '',
                initial_prompt: '',
                analysis_prompt: '',
                updated_by_user: users[1].id
            }
        })
    ]);

    const magppieAgents = await Promise.all([
        prisma.agent.create({
            data: {
                name: 'Outbound Sales Pre Qualifier',
                slug: 'magppie-outbound-sales-pre-qualifier',
                type: "CALL",
                organisation_id: createdOrganizations[2].id,
                base_prompt: '',
                initial_prompt: '',
                analysis_prompt: '',
                updated_by_user: users[2].id
            }
        })
    ]);

    const allAgents = [...askchimpsAgents, ...sunrooofAgents, ...magppieAgents];

    console.log('🎉 Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Organizations: ${createdOrganizations.length}`);
    console.log(`- User-Organization relationships: ${createdOrganizations.length}`);
    console.log(`- Agents: ${allAgents.length} (2 per organization)`);
}

if (process.env.NODE_ENV === 'production') {
    console.error('❌ This script is not allowed to run in a production environment.');
    process.exit(1);
} else {
    seed()
        .catch((e) => {
            console.error('❌ Seed failed:', e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}