import { PrismaClient, ROLE, User, Organisation, Agent, Lead, Conversation, Message } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Batch operation sizes for optimization
const BATCH_SIZE = 100;

// Helper functions for realistic data generation
const generateSlug = (name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
};

const generatePhoneNumber = (): string => {
    return `+${faker.number.int({ min: 1, max: 99 })}${faker.number.int({ min: 1000000000, max: 9999999999 })}`;
};

const generateBasePrompt = (agentType: string, orgName: string): string => {
    const prompts = {
        'customer-support': `You are a professional customer support representative for ${orgName}. Your primary goal is to help customers with their inquiries, resolve issues, and provide excellent service. Always be polite, empathetic, and solution-oriented. If you don't know something, be honest and offer to find the information.`,
        'sales': `You are a skilled sales representative for ${orgName}. Your goal is to understand customer needs, provide information about our products/services, and help guide them through the purchasing process. Be consultative, not pushy, and focus on value rather than price.`,
        'technical-support': `You are a technical support specialist for ${orgName}. Help users troubleshoot technical issues, provide clear step-by-step instructions, and escalate complex problems when necessary. Use simple language to explain technical concepts.`,
        'lead-qualification': `You are a lead qualification specialist for ${orgName}. Your job is to gather information about potential customers, understand their needs, budget, and timeline. Ask relevant questions to determine if they are a good fit for our solutions.`,
        'appointment-booking': `You are an appointment booking assistant for ${orgName}. Help customers schedule appointments, manage their bookings, and send reminders. Be flexible with scheduling and accommodate customer preferences when possible.`,
        'product-information': `You are a product information specialist for ${orgName}. Provide detailed information about our products, features, benefits, and pricing. Help customers compare different options and find the best solution for their needs.`,
        'feedback-collection': `You are a feedback collection specialist for ${orgName}. Gather customer opinions, suggestions, and complaints. Be empathetic and thank customers for their feedback. Document all feedback accurately for improvement purposes.`,
        'onboarding': `You are an onboarding specialist for ${orgName}. Guide new customers through the setup process, explain key features, and ensure they have everything they need to get started successfully.`,
        'billing-support': `You are a billing support specialist for ${orgName}. Help customers with payment issues, explain charges, process refunds when appropriate, and update payment information. Be sensitive to financial concerns.`,
        'general-inquiry': `You are a general inquiry assistant for ${orgName}. Answer various questions about the company, services, policies, and procedures. If a query requires specialized knowledge, direct the customer to the appropriate department.`
    };

    const types = Object.keys(prompts) as Array<keyof typeof prompts>;
    return prompts[agentType] || prompts[types[Math.floor(Math.random() * types.length)]];
};

const generateInitialPrompt = (): string => {
    const greetings = [
        "Hello! Welcome to our service. How can I assist you today?",
        "Hi there! I'm here to help. What brings you here today?",
        "Good day! How may I be of service to you?",
        "Welcome! I'm ready to assist you with any questions or concerns you may have.",
        "Hello and welcome! What can I help you with today?",
        "Greetings! I'm here to provide support. How can I help you?",
        "Hi! Thanks for reaching out. What can I do for you today?",
        "Welcome aboard! I'm here to make your experience smooth. How can I assist?",
        "Hello! I'm your assistant today. What would you like help with?",
        "Good to see you! How can I make your day better?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
};

const generateAnalysisPrompt = (): string => {
    const prompts = [
        "Analyze the customer's sentiment and intent. Identify key pain points and opportunities for assistance.",
        "Evaluate the conversation for customer satisfaction, unresolved issues, and potential upsell opportunities.",
        "Assess the customer's technical knowledge level and adjust communication style accordingly.",
        "Identify the primary concern, secondary issues, and suggest the most efficient resolution path.",
        "Analyze conversation patterns to detect frustration, confusion, or satisfaction levels.",
        "Review the interaction for compliance, quality, and areas of improvement.",
        "Evaluate lead quality based on budget, timeline, and decision-making authority indicators.",
        "Analyze customer responses to identify buying signals and objections.",
        "Assess the effectiveness of the current approach and suggest alternative strategies if needed.",
        "Monitor for keywords indicating urgency, dissatisfaction, or specific product interests."
    ];
    return prompts[Math.floor(Math.random() * prompts.length)];
};

const generateConversationContent = (role: string, context: string): string => {
    if (role === 'user') {
        const userMessages = [
            "I need help with my account",
            "Can you tell me more about your pricing?",
            "I'm having trouble logging in",
            "What features does the premium plan include?",
            "I'd like to schedule a demo",
            "My payment didn't go through",
            "How do I export my data?",
            "Is there a mobile app available?",
            "I found a bug in the system",
            "Can I upgrade my subscription?",
            "I need to cancel my service",
            "What's your refund policy?",
            "I'm interested in your enterprise solutions",
            "How secure is your platform?",
            "Can I integrate with other tools?",
            "I need technical documentation",
            "What's the difference between plans?",
            "I'm having performance issues",
            "Can you help me set up my account?",
            "I have a feature request",
            `I'm looking for a ${context} solution`,
            `We need help with ${context}`,
            `Can your platform handle ${context}?`,
            `What's the best way to ${context}?`,
            `I have questions about ${context}`
        ];
        return userMessages[Math.floor(Math.random() * userMessages.length)];
    } else {
        const assistantMessages = [
            "I'd be happy to help you with that. Let me look into this for you.",
            "Thank you for reaching out. I can definitely assist you with this.",
            "I understand your concern. Here's what I can do to help...",
            "Great question! Let me provide you with detailed information.",
            "I appreciate you bringing this to our attention. Let's resolve this together.",
            "Absolutely! I'll guide you through the process step by step.",
            "I can see why that would be frustrating. Let me help you fix this.",
            "Thanks for your interest! I'd be glad to explain our options.",
            "Let me check that for you right away.",
            "I'll make sure we get this sorted out for you promptly.",
            `Based on your needs for ${context}, I recommend...`,
            `For ${context}, we have several options available...`,
            `I can help you with ${context}. Here's how we typically approach this...`,
            `Regarding ${context}, let me share some insights...`,
            `To better assist you with ${context}, could you tell me more about...`
        ];
        return assistantMessages[Math.floor(Math.random() * assistantMessages.length)];
    }
};

const generateLeadStatus = (): string => {
    const statuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'nurturing'];
    return statuses[Math.floor(Math.random() * statuses.length)];
};

const generateLeadSource = (): string => {
    const sources = ['website', 'phone', 'email', 'chat', 'social_media', 'referral', 'advertisement', 'organic_search', 'direct', 'partner'];
    return sources[Math.floor(Math.random() * sources.length)];
};

const generateConversationSource = (): string => {
    const sources = ['web_chat', 'whatsapp', 'facebook_messenger', 'telegram', 'sms', 'email', 'phone', 'api', 'mobile_app', 'widget'];
    return sources[Math.floor(Math.random() * sources.length)];
};

async function seed() {
    console.log('🧹 Cleaning database...');

    // Delete all data in the correct order (respecting foreign key constraints)
    await prisma.message.deleteMany({});
    await prisma.conversation.deleteMany({});
    await prisma.lead.deleteMany({});
    await prisma.agent.deleteMany({});
    await prisma.userOrganisation.deleteMany({});
    await prisma.organisation.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('✅ Database cleaned!');
    console.log('🌱 Starting to seed massive data...');

    // Create 3 users as requested
    const users = [
        {
            id: '12c735f8-0700-4c2f-88fe-eecaebc566cb',
            name: 'John Administrator',
            email: 'admin@askchimps.com',
            phone_number: generatePhoneNumber(),
            is_super_admin: 1,
            is_disabled: 0,
            is_deleted: 0
        },
        {
            id: 'f3063bdf-d7fe-4805-8a54-771c844324ab',
            name: 'Sarah Business Owner',
            email: 'sarah.owner@company.com',
            phone_number: generatePhoneNumber(),
            is_super_admin: 0,
            is_disabled: 0,
            is_deleted: 0
        },
        {
            id: 'b67f5bfc-31ca-49d6-9833-1dea2315dc64',
            name: 'Mike Support Agent',
            email: 'mike.agent@support.com',
            phone_number: generatePhoneNumber(),
            is_super_admin: 0,
            is_disabled: 0,
            is_deleted: 0
        }
    ];

    console.log('👤 Creating users...');
    await prisma.user.createMany({ data: users });

    // Create 50 organizations with varied industries
    const industries = [
        'Technology', 'Healthcare', 'Finance', 'Retail', 'Education',
        'Manufacturing', 'Real Estate', 'Hospitality', 'Transportation', 'Energy',
        'Media', 'Telecommunications', 'Agriculture', 'Construction', 'Legal',
        'Insurance', 'Consulting', 'Automotive', 'Pharmaceutical', 'Food & Beverage'
    ];

    const organizations: Organisation[] = [];
    console.log('🏢 Creating organizations...');

    for (let i = 1; i <= 30; i++) {  // Reduced from 50 to 30
        const industry = industries[Math.floor(Math.random() * industries.length)];
        const companyName = `${faker.company.name()} ${industry}`;

        const org = {
            name: companyName,
            slug: `${generateSlug(companyName)}-${i}`,
            is_disabled: Math.random() > 0.95 ? 1 : 0, // 5% disabled
            is_deleted: Math.random() > 0.98 ? 1 : 0, // 2% deleted
            updated_by_user: users[Math.floor(Math.random() * users.length)].id
        };

        const createdOrg = await prisma.organisation.create({ data: org });
        organizations.push(createdOrg);
    }

    // Create user-organization relationships
    console.log('🔗 Creating user-organization relationships...');

    // Super admin has access to first 10 organizations
    for (let i = 0; i < 10; i++) {
        await prisma.userOrganisation.create({
            data: {
                user_id: users[0].id,
                organisation_id: organizations[i].id,
                role: ROLE.ADMIN
            }
        });
    }

    // Owner has access to organizations (adjusted for 30 total orgs)
    for (let i = 5; i < Math.min(25, organizations.length); i++) {
        await prisma.userOrganisation.create({
            data: {
                user_id: users[1].id,
                organisation_id: organizations[i].id,
                role: i < 15 ? ROLE.OWNER : ROLE.ADMIN
            }
        });
    }

    // Regular user has access to organizations (adjusted for 30 total orgs)
    for (let i = 10; i < Math.min(30, organizations.length); i++) {
        await prisma.userOrganisation.create({
            data: {
                user_id: users[2].id,
                organisation_id: organizations[i].id,
                role: Math.random() > 0.3 ? ROLE.USER : ROLE.ADMIN
            }
        });
    }

    const agentTypes = [
        'customer-support', 'sales', 'technical-support', 'lead-qualification',
        'appointment-booking', 'product-information', 'feedback-collection',
        'onboarding', 'billing-support', 'general-inquiry'
    ];

    const agents: Agent[] = [];
    console.log('🤖 Creating agents...');

    for (const org of organizations) {
        const numAgents = faker.number.int({ min: 2, max: 8 });

        for (let j = 0; j < numAgents; j++) {
            const agentType = agentTypes[Math.floor(Math.random() * agentTypes.length)];
            const agentName = `${faker.person.firstName()} - ${agentType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`;

            const agent = {
                name: agentName,
                slug: `${generateSlug(agentName)}-${org.id}-${j}`,
                phone_number: Math.random() > 0.3 ? generatePhoneNumber() : null,
                organisation_id: org.id,
                base_prompt: generateBasePrompt(agentType, org.name),
                image_url: Math.random() > 0.5 ? faker.image.avatar() : null,
                initial_prompt: generateInitialPrompt(),
                analysis_prompt: Math.random() > 0.4 ? generateAnalysisPrompt() : null,
                is_disabled: Math.random() > 0.95 ? 1 : 0,
                is_deleted: Math.random() > 0.98 ? 1 : 0,
                updated_by_user: users[Math.floor(Math.random() * users.length)].id
            };

            const createdAgent = await prisma.agent.create({ data: agent });
            agents.push(createdAgent);
        }
    }

    // Create 2,500 conversations first (without leads)
    console.log('💬 Creating conversations...');
    const conversations: Conversation[] = [];
    const conversationBatch: any[] = [];

    for (let i = 0; i < 2500; i++) {
        const org = organizations[Math.floor(Math.random() * organizations.length)];
        const orgAgents = agents.filter(a => a.organisation_id === org.id);

        if (orgAgents.length === 0) continue;

        const agent = orgAgents[Math.floor(Math.random() * orgAgents.length)];

        // Generate conversation created_at time (in the past 2 years)
        const conversationCreatedAt = faker.date.past({ years: 2 });

        const conversation = {
            name: `conv-${org.slug}-${i}-${Date.now()}`,
            organisation_id: org.id,
            agent_id: agent.id,
            source: generateConversationSource(),
            lead_id: null, // Will be updated later when leads are created
            prompt_tokens: faker.number.int({ min: 100, max: 5000 }),
            completion_tokens: faker.number.int({ min: 50, max: 2000 }),
            is_disabled: Math.random() > 0.98 ? 1 : 0,
            is_deleted: Math.random() > 0.99 ? 1 : 0,
            created_at: conversationCreatedAt
        };

        conversationBatch.push(conversation);

        // Batch insert every BATCH_SIZE conversations
        if (conversationBatch.length === BATCH_SIZE || i === 2499) {
            const createdConversations = await prisma.conversation.createMany({ data: conversationBatch });

            // Fetch the created conversations to get their IDs
            const fetchedConversations = await prisma.conversation.findMany({
                orderBy: { created_at: 'desc' },
                take: conversationBatch.length
            });
            conversations.push(...fetchedConversations);
            conversationBatch.length = 0; // Clear the batch

            if ((i + 1) % 500 === 0) {
                console.log(`  ✓ Created ${i + 1} conversations...`);
            }
        }
    }

    // Create messages and leads realistically
    console.log('📨 Creating messages and leads...');
    let messageCount = 0;
    const messageBatch: any[] = [];
    const leads: Lead[] = [];
    const conversationsWithLeads = new Set<number>(); // Track conversations that already have leads

    for (const conversation of conversations) {
        const numMessages = faker.number.int({ min: 2, max: 20 });
        const contextTopic = faker.helpers.arrayElement([
            'account setup', 'billing inquiry', 'technical issue', 'feature request',
            'product demo', 'pricing discussion', 'integration help', 'general support',
            'complaint', 'feedback', 'upgrade request', 'cancellation', 'onboarding'
        ]);

        // Determine if this conversation will create a lead
        const willCreateLead = Math.random() > 0.4; // 60% chance of creating a lead
        // Only create lead if we have enough messages (at least 3) and conversation doesn't already have a lead
        let leadCreatedInMessage = (willCreateLead && numMessages >= 3 && !conversationsWithLeads.has(conversation.id))
            ? faker.number.int({ min: 2, max: Math.min(8, numMessages - 1) })
            : -1;
        let conversationLead: Lead | null = null;
        let leadCreatedAt: Date | null = null;

        for (let m = 0; m < numMessages; m++) {
            const role = m % 2 === 0 ? 'user' : 'assistant';

            // Calculate message timestamp - first message has same time as conversation
            const messageCreatedAt = m === 0
                ? conversation.created_at
                : new Date(conversation.created_at.getTime() + (m * faker.number.int({ min: 30000, max: 300000 }))); // 30 sec to 5 min apart

            const message = {
                organisation_id: conversation.organisation_id,
                agent_id: conversation.agent_id,
                conversation_id: conversation.id,
                role: role,
                content: generateConversationContent(role, contextTopic),
                prompt_tokens: role === 'user' ? 0 : faker.number.int({ min: 10, max: 200 }),
                completion_tokens: role === 'user' ? 0 : faker.number.int({ min: 20, max: 300 }),
                is_disabled: 0,
                is_deleted: Math.random() > 0.995 ? 1 : 0,
                created_at: messageCreatedAt
            };

            // Create lead after collecting user information (usually after a few messages)
            if (m === leadCreatedInMessage && role === 'user' && !conversationsWithLeads.has(conversation.id)) {
                // Lead is created during the conversation, after some information exchange
                leadCreatedAt = new Date(messageCreatedAt.getTime() + faker.number.int({ min: 1000, max: 60000 })); // 1-60 seconds after the message

                const leadData = {
                    organisation_id: conversation.organisation_id,
                    agent_id: conversation.agent_id,
                    conversation_id: conversation.id, // One-to-one relationship
                    name: Math.random() > 0.1 ? faker.person.fullName() : null,
                    email: Math.random() > 0.2 ? faker.internet.email() : null,
                    phone_number: Math.random() > 0.3 ? generatePhoneNumber() : null,
                    source: generateLeadSource(),
                    status: 'new', // New leads always start as 'new'
                    additional_info: Math.random() > 0.5 ? {
                        company: faker.company.name(),
                        position: faker.person.jobTitle(),
                        budget: faker.number.int({ min: 1000, max: 100000 }),
                        timeline: faker.helpers.arrayElement(['immediate', '1-3 months', '3-6 months', '6-12 months', 'next year']),
                        interests: faker.helpers.arrayElements([
                            'pricing', 'features', 'integration', 'security', 'support',
                            'customization', 'scalability', 'training', 'implementation', 'roi'
                        ], { min: 1, max: 4 }),
                        notes: faker.lorem.sentence()
                    } : undefined,
                    created_at: leadCreatedAt
                };

                // We'll create the lead after all messages are created to avoid foreign key issues
                conversationLead = leadData as any; // Temporary placeholder
                conversationsWithLeads.add(conversation.id); // Mark that this conversation has a lead
                // Set leadCreatedInMessage to -1 to prevent any further lead creation for this conversation
                leadCreatedInMessage = -1;
            }

            // Update the lead status content based on conversation progression
            if (conversationLead && leadCreatedAt && messageCreatedAt > leadCreatedAt) {
                const conversationProgress = m / numMessages;
                if (conversationProgress > 0.7) {
                    (conversationLead as any).status = faker.helpers.arrayElement(['qualified', 'proposal', 'negotiation', 'won', 'lost']);
                } else if (conversationProgress > 0.4) {
                    (conversationLead as any).status = faker.helpers.arrayElement(['contacted', 'qualified']);
                }
                (conversationLead as any).updated_at = messageCreatedAt;
            }

            messageBatch.push(message);
            messageCount++;

            // Batch insert messages
            if (messageBatch.length === BATCH_SIZE) {
                await prisma.message.createMany({ data: messageBatch });
                messageBatch.length = 0;

                if (messageCount % 5000 === 0) {
                    console.log(`  ✓ Created ${messageCount} messages...`);
                }
            }
        }

        // Store lead data for later creation
        if (conversationLead) {
            leads.push(conversationLead as any);
        }
    }

    // Insert any remaining messages
    if (messageBatch.length > 0) {
        await prisma.message.createMany({ data: messageBatch });
    }

    // Now create all leads
    console.log('� Creating leads from conversations...');
    const leadBatch: any[] = [];

    for (const leadData of leads) {
        leadBatch.push(leadData);

        if (leadBatch.length === BATCH_SIZE || leadData === leads[leads.length - 1]) {
            await prisma.lead.createMany({ data: leadBatch });
            leadBatch.length = 0;
            console.log(`  ✓ Created ${leads.indexOf(leadData) + 1} leads...`);
        }
    }

    // Fetch created leads to update conversations
    await prisma.lead.findMany({
        orderBy: { created_at: 'desc' }
    });

    console.log('🎉 Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Organizations: ${organizations.length}`);
    console.log(`- Agents: ${agents.length}`);
    console.log(`- Leads: ${leads.length}`);
    console.log(`- Conversations: ${conversations.length}`);
    console.log(`- Messages: ${messageCount}`);
}


// Ensure the script does not run in production
if (process.env.NODE_ENV === 'production') {
    console.error('❌ This script is not allowed to run in a production environment.');
    process.exit(1);
}
else {
    console.log('⚠️  Warning: You are about to run the seed script in a non-production environment. This will erase all existing data and replace it with new seed data.');
    console.log('If you are sure, please set the environment variable NODE_ENV to "development" or "test" and run again.');
    seed()
        .catch((e) => {
            console.error('❌ Seed failed:', e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}