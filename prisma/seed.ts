import { PrismaClient, ROLE, Organisation, CONVERSATION_TYPE, CREDITS_PLAN } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
    console.log('🧹 Cleaning database...');

    await prisma.message.deleteMany({});
    await prisma.conversation.deleteMany({});
    await prisma.lead.deleteMany({});
    await prisma.agent.deleteMany({});
    await prisma.userOrganisation.deleteMany({});
    await prisma.organisation.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.topic.deleteMany({});

    console.log('✅ Database cleaned!');
    console.log('🌱 Creating users...');

    // Create 3 users
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

    // Create 3 organizations with realistic data
    const organizations = [
        {
            name: 'AskChimps',
            slug: 'askchimps',
            conversation_credits: 1000,
            message_credits: 5000,
            call_credits: 500,
            credits_plan: CREDITS_PLAN.CONVERSATION,
            is_disabled: 0,
            is_deleted: 0,
            updated_by_user: users[0].id
        },
        {
            name: 'Sunrooof',
            slug: 'sunrooof',
            conversation_credits: 750,
            message_credits: 3000,
            call_credits: 200,
            credits_plan: CREDITS_PLAN.MESSAGE,
            is_disabled: 0,
            is_deleted: 0,
            updated_by_user: users[1].id
        },
        {
            name: 'Magppie',
            slug: 'magppie',
            conversation_credits: 500,
            message_credits: 2500,
            call_credits: 150,
            credits_plan: CREDITS_PLAN.CONVERSATION,
            is_disabled: 0,
            is_deleted: 0,
            updated_by_user: users[2].id
        }
    ];

    console.log('🏢 Creating organizations...');
    const createdOrganizations: Organisation[] = [];
    for (const org of organizations) {
        const createdOrg = await prisma.organisation.create({ data: org });
        createdOrganizations.push(createdOrg);
    }

    // Associate users with their respective organizations
    console.log('🔗 Creating user-organization relationships...');
    
    // AskChimps Admin -> AskChimps (OWNER)
    await prisma.userOrganisation.create({
        data: {
            user_id: users[0].id,
            organisation_id: createdOrganizations[0].id,
            role: ROLE.OWNER
        }
    });

    // Sunrooof Admin -> Sunrooof (OWNER)
    await prisma.userOrganisation.create({
        data: {
            user_id: users[1].id,
            organisation_id: createdOrganizations[1].id,
            role: ROLE.OWNER
        }
    });

    // Magppie Admin -> Magppie (OWNER)
    await prisma.userOrganisation.create({
        data: {
            user_id: users[2].id,
            organisation_id: createdOrganizations[2].id,
            role: ROLE.OWNER
        }
    });

    // Create topics
    console.log('🏷️ Creating topics...');
    const topics = await prisma.topic.createMany({
        data: [
            { name: 'Product Inquiry', description: 'Questions about products and services' },
            { name: 'Customer Support', description: 'Support and troubleshooting requests' },
            { name: 'Sales Lead', description: 'Potential sales opportunities' },
            { name: 'Appointment Booking', description: 'Scheduling appointments or consultations' },
            { name: 'Billing Question', description: 'Questions about invoices and payments' },
            { name: 'Technical Issue', description: 'Technical problems and bug reports' },
            { name: 'Feature Request', description: 'Requests for new features' },
            { name: 'General Information', description: 'General company and product information' }
        ]
    });

    // Get created topics for relationships
    const createdTopics = await prisma.topic.findMany();

    // Create agents for each organization
    console.log('🤖 Creating agents...');
    
    // AskChimps agents
    const askchimpsAgents = await Promise.all([
        prisma.agent.create({
            data: {
                name: 'Sarah - Customer Success',
                slug: 'sarah-customer-success',
                phone_number: '+1555-ASKCHIMP',
                organisation_id: createdOrganizations[0].id,
                base_prompt: `You are Sarah, a friendly and knowledgeable customer success agent for AskChimps. You help customers with product inquiries, onboarding, and general support. Always maintain a professional yet warm tone and provide helpful, accurate information about our AI chatbot platform.`,
                initial_prompt: `Hi there! I'm Sarah from AskChimps customer success team. I'm here to help you with any questions about our AI chatbot platform. How can I assist you today?`,
                analysis_prompt: `Analyze this conversation to identify: 1) Customer satisfaction level, 2) Issue resolution status, 3) Potential upselling opportunities, 4) Follow-up actions needed, 5) Conversation sentiment and key topics discussed.`,
                updated_by_user: users[0].id
            }
        }),
        prisma.agent.create({
            data: {
                name: 'Alex - Sales Assistant',
                slug: 'alex-sales-assistant',
                phone_number: '+1555-SALES-AC',
                organisation_id: createdOrganizations[0].id,
                base_prompt: `You are Alex, an enthusiastic sales assistant for AskChimps. Your role is to qualify leads, demonstrate our AI chatbot platform's value proposition, and guide prospects through the sales process. Be consultative, ask good qualifying questions, and focus on solving customer problems.`,
                initial_prompt: `Hello! I'm Alex from AskChimps sales team. I'd love to learn more about your business and see how our AI chatbot platform could help you improve customer engagement. What kind of customer interactions are you looking to enhance?`,
                analysis_prompt: `Evaluate this sales conversation for: 1) Lead qualification score (1-10), 2) Pain points identified, 3) Budget and decision-making authority, 4) Timeline for implementation, 5) Next steps and follow-up priority level.`,
                updated_by_user: users[0].id
            }
        })
    ]);

    // Sunrooof agents
    const sunrooofAgents = await Promise.all([
        prisma.agent.create({
            data: {
                name: 'Emma - Solar Consultant',
                slug: 'emma-solar-consultant',
                phone_number: '+1555-SOLAR-01',
                organisation_id: createdOrganizations[1].id,
                base_prompt: `You are Emma, a certified solar energy consultant for Sunrooof. You help homeowners understand solar panel benefits, calculate potential savings, and guide them through the solar installation process. Be knowledgeable about solar technology, financing options, and environmental benefits.`,
                initial_prompt: `Hi! I'm Emma, your solar energy consultant at Sunrooof. I'm excited to help you explore how solar panels can reduce your electricity bills and environmental impact. To get started, could you tell me about your current monthly electricity bill?`,
                analysis_prompt: `Analyze this solar consultation for: 1) Customer's solar readiness score, 2) Estimated energy savings potential, 3) Financing interest level, 4) Installation timeline preferences, 5) Environmental motivation vs cost motivation ratio.`,
                updated_by_user: users[1].id
            }
        }),
        prisma.agent.create({
            data: {
                name: 'Mike - Technical Support',
                slug: 'mike-technical-support',
                organisation_id: createdOrganizations[1].id,
                base_prompt: `You are Mike, a technical support specialist for Sunrooof solar installations. You help customers with system monitoring, troubleshooting, maintenance questions, and performance optimization. Provide clear, step-by-step guidance and know when to escalate to field technicians.`,
                initial_prompt: `Hello! I'm Mike from Sunrooof technical support. I'm here to help with any questions about your solar panel system's performance, monitoring, or maintenance. What can I help you with today?`,
                analysis_prompt: `Review this technical support interaction for: 1) Issue complexity and resolution status, 2) Customer technical knowledge level, 3) System performance concerns, 4) Need for on-site technician visit, 5) Customer satisfaction with resolution.`,
                updated_by_user: users[1].id
            }
        })
    ]);

    // Magppie agents
    const magppieAgents = await Promise.all([
        prisma.agent.create({
            data: {
                name: 'Zoe - Creative Assistant',
                slug: 'zoe-creative-assistant',
                organisation_id: createdOrganizations[2].id,
                base_prompt: `You are Zoe, a creative assistant for Magppie design agency. You help clients with project inquiries, creative briefs, timeline discussions, and design consultations. Be creative, inspiring, and detail-oriented while understanding client vision and budget constraints.`,
                initial_prompt: `Hi there! I'm Zoe from Magppie creative team. I love helping bring amazing design visions to life! Whether you need branding, web design, or marketing materials, I'm here to understand your project needs. What creative challenge can we tackle together?`,
                analysis_prompt: `Evaluate this creative consultation for: 1) Project scope and complexity, 2) Creative vision clarity, 3) Budget range indication, 4) Timeline requirements, 5) Client's design style preferences and inspiration sources.`,
                updated_by_user: users[2].id
            }
        }),
        prisma.agent.create({
            data: {
                name: 'David - Project Manager',
                slug: 'david-project-manager',
                organisation_id: createdOrganizations[2].id,
                base_prompt: `You are David, a project manager at Magppie design agency. You handle project timelines, deliverables, client communications, and ensure smooth project execution. Be organized, clear about processes, and focused on meeting deadlines and expectations.`,
                initial_prompt: `Hello! I'm David, your project manager at Magppie. I'm here to help coordinate your design project, discuss timelines, deliverables, and keep everything on track. How can I assist with your project today?`,
                analysis_prompt: `Analyze this project management conversation for: 1) Project timeline feasibility, 2) Scope creep risks, 3) Client communication preferences, 4) Resource allocation needs, 5) Potential project bottlenecks or challenges.`,
                updated_by_user: users[2].id
            }
        })
    ]);

    const allAgents = [...askchimpsAgents, ...sunrooofAgents, ...magppieAgents];

    // Create realistic lead data generators
    console.log('👥 Creating leads (this will take a few moments - generating ~300 leads)...');
    
    // Lead data templates and generators
    const leadDataGenerators = {
        askchimps: {
            names: [
                'Jennifer Martinez', 'Robert Chen', 'Amanda Rodriguez', 'Marcus Thompson', 'Sarah Williams',
                'David Park', 'Emily Johnson', 'Michael Brown', 'Lisa Garcia', 'James Wilson',
                'Maria Lopez', 'Christopher Lee', 'Jessica Davis', 'Daniel Kim', 'Ashley Miller',
                'Kevin Taylor', 'Rachel Anderson', 'Steven White', 'Michelle Thomas', 'Brian Jackson',
                'Laura Robinson', 'Mark Lewis', 'Nicole Young', 'Anthony Hall', 'Stephanie Allen',
                'Ryan Wright', 'Angela King', 'Justin Scott', 'Rebecca Green', 'Jonathan Adams',
                'Samantha Baker', 'Gregory Gonzalez', 'Christina Nelson', 'Aaron Carter', 'Melissa Mitchell',
                'Matthew Perez', 'Amy Roberts', 'Timothy Turner', 'Kimberly Phillips', 'Brandon Campbell',
                'Heather Parker', 'Jason Evans', 'Susan Edwards', 'Andrew Collins', 'Sarah Stewart',
                'Nicholas Sanchez', 'Diana Morris', 'Eric Rogers', 'Jennifer Reed', 'Scott Cook',
                'Elizabeth Bell', 'Jordan Murphy', 'Megan Bailey', 'Alexander Rivera', 'Tiffany Cooper'
            ],
            companies: [
                'TechStartup Inc', 'RetailPlus', 'HealthCarePlus Clinic', 'Thompson Financial Services',
                'Digital Solutions Corp', 'E-Commerce Hub', 'MedTech Innovations', 'Finance Forward LLC',
                'StartupVenture Co', 'OnlineRetail Pro', 'WellnessCare Group', 'Investment Partners Inc',
                'CloudTech Systems', 'ShopSmart Retail', 'HealthFirst Medical', 'Capital Advisors',
                'InnovateTech Solutions', 'MarketPlace Pro', 'CareConnect Health', 'Wealth Management Co',
                'DataDriven Systems', 'QuickBuy Retail', 'MedAssist Technologies', 'Financial Growth Partners',
                'TechFlow Dynamics', 'RetailGenius Inc', 'HealthTech Solutions', 'Premier Financial Group'
            ],
            sources: ['Website Contact Form', 'LinkedIn', 'Google Ads', 'Referral', 'Trade Show', 'Cold Outreach', 'Content Marketing', 'Webinar'],
            statuses: ['New', 'Qualified', 'Demo Scheduled', 'Proposal Sent', 'Negotiating', 'Closed Won', 'Closed Lost', 'Nurturing'],
            industries: ['E-commerce', 'Healthcare', 'Financial Services', 'SaaS', 'Manufacturing', 'Education', 'Legal', 'Real Estate'],
            employees: ['1-10', '11-25', '26-50', '51-100', '101-250', '251-500', '500+'],
            pain_points: [
                'High response time', 'Limited availability', 'Repetitive inquiries', 'Scaling support',
                'Customer satisfaction', 'Cost reduction', 'Automated workflows', '24/7 coverage',
                'Multi-language support', 'Integration complexity', 'Lead qualification', 'Response consistency'
            ]
        },
        sunrooof: {
            names: [
                'Sarah Johnson', 'Michael Davis', 'Patricia Williams', 'Kevin Martinez', 'Lisa Thompson',
                'Robert Garcia', 'Jennifer Brown', 'David Wilson', 'Maria Rodriguez', 'Christopher Lee',
                'Amanda Taylor', 'Matthew Anderson', 'Susan White', 'Andrew Thomas', 'Michelle Jackson',
                'Ryan Harris', 'Jessica Martin', 'Daniel Thompson', 'Laura Garcia', 'Mark Robinson',
                'Rachel Lewis', 'Steven Walker', 'Nicole Hall', 'Brian Allen', 'Angela Young',
                'Justin King', 'Stephanie Wright', 'Aaron Lopez', 'Rebecca Hill', 'Jonathan Green',
                'Samantha Adams', 'Gregory Baker', 'Christina Nelson', 'Timothy Carter', 'Melissa Mitchell',
                'Brandon Perez', 'Heather Roberts', 'Jason Turner', 'Diana Phillips', 'Eric Campbell',
                'Kimberly Parker', 'Scott Evans', 'Elizabeth Edwards', 'Jordan Collins', 'Megan Stewart',
                'Alexander Sanchez', 'Tiffany Morris', 'Nicholas Rogers', 'Amy Reed', 'Matthew Cook'
            ],
            locations: [
                'Austin, TX', 'Phoenix, AZ', 'Denver, CO', 'Las Vegas, NV', 'San Diego, CA',
                'Miami, FL', 'Atlanta, GA', 'Seattle, WA', 'Portland, OR', 'Nashville, TN',
                'Charlotte, NC', 'Tampa, FL', 'Raleigh, NC', 'Orlando, FL', 'Sacramento, CA',
                'San Antonio, TX', 'Dallas, TX', 'Houston, TX', 'Fort Worth, TX', 'Albuquerque, NM',
                'Tucson, AZ', 'Colorado Springs, CO', 'Mesa, AZ', 'Virginia Beach, VA', 'Oakland, CA'
            ],
            home_types: ['Single Family', 'Two Story', 'Ranch Style', 'Colonial', 'Contemporary', 'Townhouse', 'Split Level'],
            roof_conditions: ['Excellent', 'Good', 'Fair', 'Needs minor repair', 'Recently renovated'],
            sources: ['Google Ads', 'Facebook', 'Website Calculator', 'Referral', 'Solar Expo', 'Door-to-door', 'Radio Ad', 'TV Commercial'],
            statuses: ['New', 'Interested', 'Site Survey Scheduled', 'Proposal Sent', 'Contract Signed', 'Installation Scheduled', 'Customer', 'Not Interested'],
            monthly_bills: [120, 145, 165, 180, 195, 220, 250, 280, 320, 380, 450],
            ownership: ['Owner', 'Owner (with HOA)', 'Renter (with permission)']
        },
        magppie: {
            names: [
                'Lisa Thompson', 'James Wilson', 'Elena Rodriguez', 'Dr. Benjamin Clark', 'Maria Garcia',
                'David Park', 'Jennifer Brown', 'Michael Davis', 'Sarah Johnson', 'Christopher Lee',
                'Amanda Taylor', 'Robert Martinez', 'Jessica White', 'Daniel Kim', 'Michelle Anderson',
                'Ryan Thomas', 'Angela Jackson', 'Steven Harris', 'Nicole Martin', 'Brian Thompson',
                'Laura Garcia', 'Mark Robinson', 'Rachel Lewis', 'Justin Walker', 'Stephanie Hall',
                'Aaron Allen', 'Rebecca Young', 'Jonathan King', 'Samantha Wright', 'Gregory Lopez',
                'Christina Hill', 'Timothy Green', 'Melissa Adams', 'Brandon Baker', 'Heather Nelson',
                'Jason Carter', 'Diana Mitchell', 'Eric Perez', 'Kimberly Roberts', 'Scott Turner',
                'Elizabeth Phillips', 'Jordan Campbell', 'Megan Parker', 'Alexander Evans', 'Tiffany Edwards'
            ],
            businesses: [
                'Boutique Cafe', 'Tech Corporation', 'Fashion Forward Boutique', 'Dental Smiles Clinic',
                'Urban Bistro', 'Software Solutions Inc', 'Trendy Threads', 'Family Dental Care',
                'Artisan Coffee House', 'Digital Marketing Agency', 'Style & Grace Boutique', 'Pediatric Dentistry',
                'Local Brewery', 'Web Development Co', 'Vintage Clothing Store', 'Cosmetic Dentistry',
                'Farm-to-Table Restaurant', 'Mobile App Startup', 'Luxury Fashion House', 'Orthodontic Practice',
                'Specialty Tea Shop', 'E-learning Platform', 'Sustainable Fashion Brand', 'Dental Implant Center',
                'Gourmet Food Truck', 'Fintech Startup', 'Designer Consignment', 'Emergency Dental Services',
                'Wine Bar & Lounge', 'SaaS Company', 'Activewear Brand', 'Holistic Dental Practice'
            ],
            project_types: [
                'Complete Branding', 'Website Design', 'Logo Design', 'Marketing Materials',
                'E-commerce Website', 'Mobile App Design', 'Print Design', 'Brand Guidelines',
                'Packaging Design', 'Social Media Graphics', 'Business Cards', 'Brochures',
                'Website Redesign', 'Brand Refresh', 'Marketing Campaign', 'Product Photography'
            ],
            sources: ['Instagram', 'Website Portfolio', 'Behance', 'Google Search', 'Referral', 'Dribbble', 'LinkedIn', 'Facebook'],
            statuses: ['New', 'Consultation Scheduled', 'Quoted', 'In Progress', 'Project Started', 'Design Review', 'Completed', 'On Hold'],
            budget_ranges: ['$2K-$5K', '$5K-$8K', '$8K-$12K', '$12K-$15K', '$15K-$20K', '$20K-$30K', '$30K+'],
            timelines: ['2-4 weeks', '4-6 weeks', '6-8 weeks', '8-10 weeks', '10-12 weeks', '3-4 months'],
            styles: [
                'Modern minimalist', 'Classic elegant', 'Bold contemporary', 'Rustic organic',
                'Luxury sophisticated', 'Playful creative', 'Professional corporate', 'Vintage retro'
            ]
        }
    };

    // Generate phone numbers
    function generatePhoneNumber(): string {
        const area = Math.floor(Math.random() * 800) + 200;
        const exchange = Math.floor(Math.random() * 800) + 200;
        const number = Math.floor(Math.random() * 9000) + 1000;
        return `+1-${area}-${exchange}-${number}`;
    }

    // Generate email from name and company
    function generateEmail(name: string, company?: string): string {
        const firstName = name.split(' ')[0].toLowerCase();
        const lastName = name.split(' ')[1].toLowerCase();
        
        if (company) {
            const domain = company.toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .replace(/\s+/g, '')
                .replace(/(inc|corp|llc|co|group|solutions|technologies|services)$/g, '');
            return `${firstName}.${lastName}@${domain}.com`;
        }
        
        const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
        return `${firstName}.${lastName}@${domains[Math.floor(Math.random() * domains.length)]}`;
    }

    // Generate random date within last 30 days
    function generateRecentDate(daysBack: number = 30): string {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
        return date.toISOString().split('T')[0];
    }

    // Create leads for each organization
    const leads: any[] = [];

    // Generate AskChimps leads (100)
    console.log('🤖 Generating AskChimps leads...');
    for (let i = 0; i < 100; i++) {
        const generator = leadDataGenerators.askchimps;
        const name = generator.names[Math.floor(Math.random() * generator.names.length)];
        const company = generator.companies[Math.floor(Math.random() * generator.companies.length)];
        const source = generator.sources[Math.floor(Math.random() * generator.sources.length)];
        const status = generator.statuses[Math.floor(Math.random() * generator.statuses.length)];
        const industry = generator.industries[Math.floor(Math.random() * generator.industries.length)];
        const employees = generator.employees[Math.floor(Math.random() * generator.employees.length)];
        const pain_point = generator.pain_points[Math.floor(Math.random() * generator.pain_points.length)];
        
        const interactionTypes = ['form_submission', 'email_response', 'phone_call', 'demo_scheduled', 'proposal_sent', 'follow_up_call'];
        const interactions: Array<{date: string, type: string, note: string}> = [];
        const numInteractions = Math.floor(Math.random() * 5) + 1;
        
        for (let j = 0; j < numInteractions; j++) {
            interactions.push({
                date: generateRecentDate(20),
                type: interactionTypes[Math.floor(Math.random() * interactionTypes.length)],
                note: `${interactionTypes[j % interactionTypes.length].replace('_', ' ')} - discussed ${pain_point} solutions`
            });
        }

        const lead = await prisma.lead.create({
            data: {
                organisation_id: createdOrganizations[0].id,
                name: name,
                email: generateEmail(name, company),
                phone_number: generatePhoneNumber(),
                source: source,
                status: status,
                additional_info: {
                    company: company,
                    industry: industry,
                    employees: employees,
                    current_solution: ['Manual customer service', 'Basic FAQ bot', 'Email support only', 'Phone support only'][Math.floor(Math.random() * 4)],
                    pain_points: [pain_point],
                    ...(status === 'Closed Won' && { contract_value: `$${(Math.floor(Math.random() * 50) + 10) * 1000}` })
                },
                logs: { interactions },
                follow_ups: Math.floor(Math.random() * 5),
                agents: {
                    connect: [{ id: askchimpsAgents[Math.floor(Math.random() * askchimpsAgents.length)].id }]
                }
            }
        });
        leads.push(lead);
        
        if ((i + 1) % 25 === 0) {
            console.log(`   ✅ Created ${i + 1}/100 AskChimps leads`);
        }
    }

    // Generate Sunrooof leads (100)
    console.log('☀️ Generating Sunrooof leads...');
    for (let i = 0; i < 100; i++) {
        const generator = leadDataGenerators.sunrooof;
        const name = generator.names[Math.floor(Math.random() * generator.names.length)];
        const location = generator.locations[Math.floor(Math.random() * generator.locations.length)];
        const home_type = generator.home_types[Math.floor(Math.random() * generator.home_types.length)];
        const roof_condition = generator.roof_conditions[Math.floor(Math.random() * generator.roof_conditions.length)];
        const source = generator.sources[Math.floor(Math.random() * generator.sources.length)];
        const status = generator.statuses[Math.floor(Math.random() * generator.statuses.length)];
        const monthly_bill = generator.monthly_bills[Math.floor(Math.random() * generator.monthly_bills.length)];
        const ownership = generator.ownership[Math.floor(Math.random() * generator.ownership.length)];
        
        const estimated_savings = Math.floor(monthly_bill * 12 * 0.7); // Approximate 70% savings
        
        const interactionTypes = ['ad_click', 'form_submission', 'consultation_call', 'site_survey_scheduled', 'proposal_sent', 'contract_signed'];
        const interactions: Array<{date: string, type: string, note: string}> = [];
        const numInteractions = Math.floor(Math.random() * 6) + 1;
        
        for (let j = 0; j < numInteractions; j++) {
            interactions.push({
                date: generateRecentDate(25),
                type: interactionTypes[Math.floor(Math.random() * interactionTypes.length)],
                note: `${interactionTypes[j % interactionTypes.length].replace('_', ' ')} - ${location} homeowner interested in solar`
            });
        }

        const lead = await prisma.lead.create({
            data: {
                organisation_id: createdOrganizations[1].id,
                name: name,
                email: generateEmail(name),
                phone_number: generatePhoneNumber(),
                source: source,
                status: status,
                additional_info: {
                    home_type: home_type,
                    roof_condition: roof_condition,
                    monthly_bill: `$${monthly_bill}`,
                    home_ownership: ownership,
                    location: location,
                    estimated_savings: `$${estimated_savings}/year`,
                    ...(status === 'Customer' && { 
                        system_size: `${(Math.floor(Math.random() * 8) + 6)}kW`,
                        installation_date: generateRecentDate(60)
                    })
                },
                logs: { interactions },
                follow_ups: Math.floor(Math.random() * 4),
                agents: {
                    connect: [{ id: sunrooofAgents[Math.floor(Math.random() * sunrooofAgents.length)].id }]
                }
            }
        });
        leads.push(lead);
        
        if ((i + 1) % 25 === 0) {
            console.log(`   ✅ Created ${i + 1}/100 Sunrooof leads`);
        }
    }

    // Generate Magppie leads (100)
    console.log('🎨 Generating Magppie leads...');
    for (let i = 0; i < 100; i++) {
        const generator = leadDataGenerators.magppie;
        const name = generator.names[Math.floor(Math.random() * generator.names.length)];
        const business = generator.businesses[Math.floor(Math.random() * generator.businesses.length)];
        const project_type = generator.project_types[Math.floor(Math.random() * generator.project_types.length)];
        const source = generator.sources[Math.floor(Math.random() * generator.sources.length)];
        const status = generator.statuses[Math.floor(Math.random() * generator.statuses.length)];
        const budget_range = generator.budget_ranges[Math.floor(Math.random() * generator.budget_ranges.length)];
        const timeline = generator.timelines[Math.floor(Math.random() * generator.timelines.length)];
        const style = generator.styles[Math.floor(Math.random() * generator.styles.length)];
        
        const interactionTypes = ['portfolio_view', 'consultation', 'mood_board', 'contract_signed', 'design_review', 'project_delivery'];
        const interactions: Array<{date: string, type: string, note: string}> = [];
        const numInteractions = Math.floor(Math.random() * 5) + 1;
        
        for (let j = 0; j < numInteractions; j++) {
            interactions.push({
                date: generateRecentDate(30),
                type: interactionTypes[Math.floor(Math.random() * interactionTypes.length)],
                note: `${interactionTypes[j % interactionTypes.length].replace('_', ' ')} - ${project_type} project discussion`
            });
        }

        const lead = await prisma.lead.create({
            data: {
                organisation_id: createdOrganizations[2].id,
                name: name,
                email: generateEmail(name, business),
                phone_number: generatePhoneNumber(),
                source: source,
                status: status,
                additional_info: {
                    business: business,
                    project_type: project_type,
                    budget_range: budget_range,
                    timeline: timeline,
                    style_preference: `${style} aesthetic`,
                    ...(status === 'Completed' && { 
                        completion_date: generateRecentDate(90),
                        final_deliverables: ['Logo package', 'Brand guidelines', 'Website assets']
                    })
                },
                logs: { interactions },
                follow_ups: Math.floor(Math.random() * 3),
                agents: {
                    connect: [{ id: magppieAgents[Math.floor(Math.random() * magppieAgents.length)].id }]
                }
            }
        });
        leads.push(lead);
        
        if ((i + 1) % 25 === 0) {
            console.log(`   ✅ Created ${i + 1}/100 Magppie leads`);
        }
    }

    console.log(`✅ Successfully created ${leads.length} leads total!`);

    // Create conversations (100 chat + 100 call per organization = 600 total)
    console.log('💬 Creating conversations (this may take a few minutes)...');
    const conversations: any[] = [];

    // Conversation templates for each organization
    const conversationTemplates = {
        askchimps: {
            chat: [
                { source: 'Website Widget', type: 'Product Demo Request', summary_template: 'Customer inquiry about AI chatbot capabilities for {industry}. Discussed {feature} and implementation timeline.' },
                { source: 'Live Chat', type: 'Technical Support', summary_template: 'Technical support session regarding {technical_topic}. Resolved {issue_type} and provided documentation.' },
                { source: 'Website Contact', type: 'Pricing Inquiry', summary_template: 'Pricing discussion for {company_size} company. Compared plans and discussed {billing_type} billing.' },
                { source: 'LinkedIn Message', type: 'Sales Outreach', summary_template: 'Initial outreach to {industry} prospect. Qualified need for {use_case} automation.' },
                { source: 'Referral Chat', type: 'Warm Lead', summary_template: 'Referral from existing customer. High-intent prospect interested in {solution_type}.' }
            ],
            call: [
                { source: 'Scheduled Demo', type: 'Product Demo', summary_template: 'Comprehensive product demonstration for {company}. Showcased {features} and discussed implementation.' },
                { source: 'Technical Consultation', type: 'Integration Call', summary_template: 'Technical deep-dive on API integrations with {system}. Covered {technical_aspects}.' },
                { source: 'Sales Call', type: 'Closing Call', summary_template: 'Contract negotiation call with {stakeholder}. Discussed terms, pricing, and next steps.' },
                { source: 'Customer Success', type: 'Onboarding Call', summary_template: 'Post-sale onboarding session. Configured {setup_items} and trained team.' },
                { source: 'Support Call', type: 'Issue Resolution', summary_template: 'Customer support call for {issue}. Provided solution and preventive measures.' }
            ]
        },
        sunrooof: {
            chat: [
                { source: 'Solar Calculator', type: 'Initial Consultation', summary_template: 'Solar consultation for {location} homeowner. Estimated ${savings}/year savings with {system_size} system.' },
                { source: 'Website Chat', type: 'Information Request', summary_template: 'General solar information request. Discussed {topics} and {financing_options}.' },
                { source: 'Facebook Messenger', type: 'Social Inquiry', summary_template: 'Social media inquiry about {concern}. Provided education and scheduled {next_step}.' },
                { source: 'Customer Portal', type: 'System Question', summary_template: 'Existing customer question about {system_topic}. Provided guidance and resources.' },
                { source: 'Referral Chat', type: 'Referral Lead', summary_template: 'Referral from {referrer}. Qualified interest and discussed {home_details}.' }
            ],
            call: [
                { source: 'Consultation Call', type: 'Solar Assessment', summary_template: 'Detailed solar assessment call. Reviewed {assessment_items} and proposal details.' },
                { source: 'Technical Support', type: 'System Support', summary_template: 'Technical support for {system_issue}. Diagnosed and resolved {solution}.' },
                { source: 'Sales Call', type: 'Proposal Review', summary_template: 'Proposal discussion with {customer}. Covered financing, timeline, and contract terms.' },
                { source: 'Installation Coordination', type: 'Project Management', summary_template: 'Installation coordination call. Scheduled {activities} and reviewed requirements.' },
                { source: 'Customer Success', type: 'Follow-up Call', summary_template: 'Post-installation follow-up. System performing at {performance}% of projection.' }
            ]
        },
        magppie: {
            chat: [
                { source: 'Instagram DM', type: 'Creative Inquiry', summary_template: 'Creative consultation for {project_type}. Discussed {style_preference} and {timeline}.' },
                { source: 'Website Contact', type: 'Project Request', summary_template: '{industry} client requesting {services}. Budget range ${budget} with {timeline} timeline.' },
                { source: 'Behance Message', type: 'Portfolio Inquiry', summary_template: 'Portfolio-driven inquiry for {project_scope}. Client impressed with {portfolio_piece}.' },
                { source: 'Referral Chat', type: 'Warm Referral', summary_template: 'Referral from {referrer} for {project_type}. Pre-qualified with clear vision.' },
                { source: 'Client Portal', type: 'Project Update', summary_template: 'Client check-in on {project_name}. Reviewed {deliverables} and next phases.' }
            ],
            call: [
                { source: 'Creative Consultation', type: 'Discovery Call', summary_template: 'Creative discovery session for {client}. Defined brand strategy and {project_elements}.' },
                { source: 'Project Management', type: 'Status Call', summary_template: 'Project management call for {project}. Reviewed milestones and addressed {concerns}.' },
                { source: 'Client Presentation', type: 'Concept Review', summary_template: 'Concept presentation call. Presented {design_concepts} and gathered feedback.' },
                { source: 'Revision Discussion', type: 'Feedback Call', summary_template: 'Design revision discussion. Incorporated feedback on {design_elements}.' },
                { source: 'Project Handoff', type: 'Delivery Call', summary_template: 'Project completion call. Delivered final {deliverables} and handoff materials.' }
            ]
        }
    };

    // Data arrays for realistic variations
    const industries = ['E-commerce', 'Healthcare', 'Financial Services', 'Education', 'Real Estate', 'Manufacturing', 'Retail', 'SaaS', 'Hospitality', 'Legal'];
    const locations = ['Austin, TX', 'Phoenix, AZ', 'Denver, CO', 'Las Vegas, NV', 'San Diego, CA', 'Miami, FL', 'Atlanta, GA', 'Seattle, WA', 'Portland, OR', 'Nashville, TN'];
    const projectTypes = ['Complete Branding', 'Website Design', 'Logo Design', 'Marketing Materials', 'E-commerce Site', 'Mobile App Design', 'Print Design', 'Brand Guidelines'];

    let conversationCounter = 1;

    // Generate conversations for each organization
    console.log('📊 Generating conversations for all organizations...');
    
    for (let orgIndex = 0; orgIndex < createdOrganizations.length; orgIndex++) {
        const org = createdOrganizations[orgIndex];
        const orgName = org.name.toLowerCase();
        const orgAgents = allAgents.filter(agent => agent.organisation_id === org.id);
        const orgLeads = leads.filter(lead => lead.organisation_id === org.id);
        const templates = conversationTemplates[orgName as keyof typeof conversationTemplates];
        
        console.log(`📱 Creating conversations for ${org.name}...`);

        // Create 100 CHAT conversations
        for (let i = 0; i < 100; i++) {
            const template = templates.chat[i % templates.chat.length];
            const randomAgent = orgAgents[Math.floor(Math.random() * orgAgents.length)];
            const randomLead = Math.random() > 0.3 ? orgLeads[Math.floor(Math.random() * orgLeads.length)] : null; // 70% have leads
            
            const variables = {
                industry: industries[Math.floor(Math.random() * industries.length)],
                location: locations[Math.floor(Math.random() * locations.length)],
                project_type: projectTypes[Math.floor(Math.random() * projectTypes.length)],
                company_size: ['10-25', '25-50', '50-100', '100-250', '250+'][Math.floor(Math.random() * 5)],
                system_size: ['6kW', '8kW', '10kW', '12kW', '15kW'][Math.floor(Math.random() * 5)],
                savings: [1800, 2100, 2400, 2700, 3000][Math.floor(Math.random() * 5)],
                budget: ['5K-8K', '8K-15K', '15K-25K', '25K-50K'][Math.floor(Math.random() * 4)]
            };

            let summary = template.summary_template;
            Object.keys(variables).forEach(key => {
                summary = summary.replace(`{${key}}`, String(variables[key as keyof typeof variables]));
            });

            const conversation = await prisma.conversation.create({
                data: {
                    name: `CONV-${orgName.toUpperCase()}-CHAT-${String(conversationCounter++).padStart(3, '0')}`,
                    type: CONVERSATION_TYPE.CHAT,
                    organisation_id: org.id,
                    agent_id: randomAgent.id,
                    source: template.source,
                    lead_id: randomLead?.id || null,
                    summary: summary,
                    analysis: generateAnalysis(template.type, orgName),
                    prompt_tokens: Math.floor(Math.random() * 800) + 200,
                    completion_tokens: Math.floor(Math.random() * 600) + 150,
                    topics: {
                        connect: getRandomTopics(createdTopics, 2)
                    }
                }
            });
            
            conversations.push(conversation);
        }

        // Create 100 CALL conversations
        for (let i = 0; i < 100; i++) {
            const template = templates.call[i % templates.call.length];
            const randomAgent = orgAgents[Math.floor(Math.random() * orgAgents.length)];
            const randomLead = Math.random() > 0.2 ? orgLeads[Math.floor(Math.random() * orgLeads.length)] : null; // 80% have leads
            
            const variables = {
                industry: industries[Math.floor(Math.random() * industries.length)],
                location: locations[Math.floor(Math.random() * locations.length)],
                project_type: projectTypes[Math.floor(Math.random() * projectTypes.length)],
                company: `${industries[Math.floor(Math.random() * industries.length)]} Corp`,
                system_size: ['6kW', '8kW', '10kW', '12kW', '15kW'][Math.floor(Math.random() * 5)],
                performance: [95, 98, 102, 105, 108][Math.floor(Math.random() * 5)]
            };

            let summary = template.summary_template;
            Object.keys(variables).forEach(key => {
                summary = summary.replace(`{${key}}`, String(variables[key as keyof typeof variables]));
            });

            const conversation = await prisma.conversation.create({
                data: {
                    name: `CONV-${orgName.toUpperCase()}-CALL-${String(conversationCounter++).padStart(3, '0')}`,
                    type: CONVERSATION_TYPE.CALL,
                    organisation_id: org.id,
                    agent_id: randomAgent.id,
                    source: template.source,
                    lead_id: randomLead?.id || null,
                    summary: summary,
                    analysis: generateAnalysis(template.type, orgName),
                    recording_url: `https://recordings.${orgName}.com/${template.type.toLowerCase().replace(' ', '-')}-${i + 1}.mp3`,
                    duration: Math.floor(Math.random() * 2400) + 600, // 10-50 minutes
                    prompt_tokens: Math.floor(Math.random() * 1200) + 400,
                    completion_tokens: Math.floor(Math.random() * 900) + 300,
                    topics: {
                        connect: getRandomTopics(createdTopics, 3)
                    }
                }
            });
            
            conversations.push(conversation);
        }
    }

    // Helper functions
    function generateAnalysis(conversationType: string, orgName: string): string {
        const analyses = {
            askchimps: [
                'Strong technical lead with clear integration requirements. High likelihood of conversion.',
                'Customer shows good understanding of AI capabilities. Qualified for enterprise tier.',
                'Price-sensitive prospect but clear ROI identified. Follow-up with case studies needed.',
                'Existing customer with expansion opportunity. Upselling potential identified.',
                'Technical support issue resolved efficiently. Customer satisfaction high.'
            ],
            sunrooof: [
                'Excellent solar candidate with optimal conditions. Site survey recommended.',
                'Customer motivated by both environmental and financial benefits. Strong close probability.',
                'Technical issue resolved. Customer education provided on system maintenance.',
                'High-value installation opportunity. Premium package suitable.',
                'Customer satisfaction excellent. Strong referral potential identified.'
            ],
            magppie: [
                'Creative vision well-aligned with our aesthetic. Strong collaboration potential.',
                'Complex project requiring careful timeline management. Premium pricing justified.',
                'Client has clear brand vision and adequate budget. High success probability.',
                'Ongoing project progressing well. Client relationship strong.',
                'Challenging project with multiple stakeholders. Clear communication protocols essential.'
            ]
        };
        
        const orgAnalyses = analyses[orgName as keyof typeof analyses];
        return orgAnalyses[Math.floor(Math.random() * orgAnalyses.length)];
    }

    function getRandomTopics(topics: any[], count: number) {
        const shuffled = [...topics].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count).map(topic => ({ id: topic.id }));
    }

    // Create messages for conversations (30+ messages per conversation)
    console.log('📝 Creating messages (this will take several minutes - 18,000+ messages)...');

    // Message templates for realistic conversation flows
    const messageTemplates = {
        askchimps: {
            assistant_openers: [
                "Hello! I'm {agent_name} from AskChimps. I'd love to learn more about your business and see how our AI chatbot platform could help you improve customer engagement.",
                "Hi there! Thanks for your interest in AskChimps. I'm {agent_name} and I'm here to help you explore how AI can transform your customer service.",
                "Welcome to AskChimps! I'm {agent_name} from our {team} team. How can I help you with your AI chatbot needs today?",
                "Hi! I'm {agent_name} from AskChimps. I noticed you've been exploring our platform - what questions can I answer for you?"
            ],
            user_responses: [
                "Hi {agent_name}! I'm {user_name} from {company}. We're struggling with {pain_point} and looking for automation solutions.",
                "Hello! I represent {company} and we're interested in AI chatbots for {use_case}. What can you tell me about your platform?",
                "Hi there! I'm {user_name}. We have {volume} customer inquiries daily and need to improve response times.",
                "Thanks for reaching out! I'm evaluating chatbot solutions for our {industry} business."
            ],
            assistant_responses: [
                "That's exactly what we help with! Our AI chatbot can handle {capability} while maintaining {quality_aspect}. What's your current setup?",
                "Perfect! We've worked with many {industry} companies on similar challenges. Let me share how we typically approach {solution_area}.",
                "I understand that pain point well. Our platform typically reduces {metric} by {percentage}% while improving {benefit}.",
                "Great question! For {company_type} like yours, we usually recommend starting with {approach}."
            ]
        },
        sunrooof: {
            assistant_openers: [
                "Hi! I'm {agent_name}, your solar energy consultant at Sunrooof. I'm excited to help you explore how solar can reduce your electricity bills.",
                "Hello! This is {agent_name} from Sunrooof. I'm here to help you understand the solar options for your {location} home.",
                "Hi there! I'm {agent_name} from Sunrooof technical support. How can I help with your solar system today?",
                "Welcome! I'm {agent_name} and I'd love to show you how solar can save you money and help the environment."
            ],
            user_responses: [
                "Hi {agent_name}! I'm {user_name} from {location}. My electricity bill averages ${bill_amount} and I'm curious about solar savings.",
                "Hello! I'm interested in solar for my {home_type} in {location}. What kind of savings could I expect?",
                "Hi, I'm having issues with my solar monitoring system. It's been showing {issue_type} for the past few days.",
                "I was referred by {referrer} and they said you could help me understand solar options for my home."
            ],
            assistant_responses: [
                "{location} is excellent for solar! With your ${bill_amount} bill, you could save approximately ${savings} annually with a {system_size} system.",
                "Great! Based on your {home_type} and location, I can see significant savings potential. Let me explain how solar works in {location}.",
                "I can definitely help with that {issue_type}. Let's troubleshoot this together - can you tell me when you first noticed the issue?",
                "Wonderful! {referrer} is one of our happy customers. Let me show you the same savings they're experiencing."
            ]
        },
        magppie: {
            assistant_openers: [
                "Hi there! I'm {agent_name} from Magppie creative team. I love helping bring amazing design visions to life!",
                "Hello! I'm {agent_name} from Magppie. I'm here to help you create stunning {project_type} that captures your brand perfectly.",
                "Hi! This is {agent_name}, your project manager at Magppie. Let's discuss your {project_name} project timeline.",
                "Welcome to Magppie! I'm {agent_name} and I specialize in {specialty}. What creative challenge can we tackle together?"
            ],
            user_responses: [
                "Hi {agent_name}! I'm {user_name} and I need {project_type} for my {business_type}. I love your {portfolio_piece} style!",
                "Hello! I'm opening a new {business_type} and need complete branding. My budget is around ${budget_range}.",
                "Hi, I'm {user_name} from {company}. We need a {project_type} with a {timeline} timeline. Is that possible?",
                "I found you through {source} and I'm impressed with your work. Can you help with {project_needs}?"
            ],
            assistant_responses: [
                "How exciting! I love working on {business_type} projects. That {style_preference} aesthetic is perfect for {target_audience}.",
                "Wonderful! ${budget_range} gives us great flexibility for {project_scope}. Let's discuss your vision and brand personality.",
                "Absolutely! {timeline} is definitely doable for {project_type}. Let me walk you through our process and deliverables.",
                "Thank you! I'd be thrilled to help with {project_needs}. Tell me more about your vision and brand goals."
            ]
        }
    };

    // Generate messages for each conversation
    let totalMessages = 0;
    for (let i = 0; i < conversations.length; i++) {
        const conv = conversations[i];
        const org = createdOrganizations.find(o => o.id === conv.organisation_id);
        const agent = allAgents.find(a => a.id === conv.agent_id);
        const orgName = org!.name.toLowerCase();
        const templates = messageTemplates[orgName as keyof typeof messageTemplates];
        
        if (i % 50 === 0) {
            console.log(`📝 Creating messages for conversation ${i + 1}/${conversations.length}...`);
        }

        const messageCount = Math.floor(Math.random() * 20) + 30; // 30-50 messages per conversation
        const messages: any[] = [];

        for (let msgIndex = 0; msgIndex < messageCount; msgIndex++) {
            let content: string;
            let promptTokens: number;
            let completionTokens: number;
            const role = msgIndex % 2 === 0 ? 'assistant' : 'user';

            if (role === 'assistant') {
                if (msgIndex === 0) {
                    content = templates.assistant_openers[Math.floor(Math.random() * templates.assistant_openers.length)];
                } else {
                    content = templates.assistant_responses[Math.floor(Math.random() * templates.assistant_responses.length)];
                }
                content = content.replace('{agent_name}', agent!.name.split(' ')[0]);
                content = content.replace('{team}', agent!.name.includes('Sales') ? 'sales' : agent!.name.includes('Technical') ? 'technical support' : 'customer success');
                
                promptTokens = Math.floor(Math.random() * 100) + 20;
                completionTokens = Math.floor(Math.random() * 80) + 15;
            } else {
                content = templates.user_responses[Math.floor(Math.random() * templates.user_responses.length)];
                content = content.replace('{user_name}', ['Jennifer', 'Robert', 'Sarah', 'Michael', 'Lisa', 'James', 'Amanda', 'Marcus'][Math.floor(Math.random() * 8)]);
                content = content.replace('{company}', `${industries[Math.floor(Math.random() * industries.length)]} ${['Corp', 'Inc', 'LLC', 'Solutions'][Math.floor(Math.random() * 4)]}`);
                
                promptTokens = 0;
                completionTokens = 0;
            }

            // Replace remaining placeholders with realistic data
            content = content.replace('{location}', locations[Math.floor(Math.random() * locations.length)]);
            content = content.replace('{industry}', industries[Math.floor(Math.random() * industries.length)]);
            content = content.replace('{project_type}', projectTypes[Math.floor(Math.random() * projectTypes.length)]);
            content = content.replace('{pain_point}', ['slow response times', 'high support costs', 'limited availability', 'repetitive inquiries'][Math.floor(Math.random() * 4)]);
            content = content.replace('{bill_amount}', ['150', '180', '220', '280', '320'][Math.floor(Math.random() * 5)]);
            content = content.replace('{savings}', ['1800', '2200', '2600', '3000', '3400'][Math.floor(Math.random() * 5)]);
            content = content.replace('{system_size}', ['6kW', '8kW', '10kW', '12kW'][Math.floor(Math.random() * 4)]);
            content = content.replace('{budget_range}', ['5K-8K', '8K-12K', '12K-20K', '20K+'][Math.floor(Math.random() * 4)]);

            messages.push({
                organisation_id: conv.organisation_id,
                agent_id: conv.agent_id,
                conversation_id: conv.id,
                role: role,
                content: content,
                prompt_tokens: promptTokens,
                completion_tokens: completionTokens
            });
        }

        // Create messages in batch
        await prisma.message.createMany({
            data: messages
        });
        
        totalMessages += messages.length;
    }

    console.log(`✅ Created ${totalMessages} messages across ${conversations.length} conversations`);

    console.log('🎉 Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Organizations: ${createdOrganizations.length}`);
    console.log(`- User-Organization relationships: ${createdOrganizations.length}`);
    console.log(`- Topics: ${createdTopics.length}`);
    console.log(`- Agents: ${allAgents.length} (2 per organization)`);
    console.log(`- Leads: ${leads.length} (100 per organization with realistic diversity)`);
    console.log(`- Conversations: ${conversations.length} (100 CHAT + 100 CALL per organization)`);
    console.log(`- Messages: ${totalMessages}+ messages (30-50 per conversation)`);
    console.log(`\n🌟 Features showcased:`);
    console.log(`- Complete sales funnels with lead progression`);
    console.log(`- Multi-industry use cases (AI/SaaS, Solar, Design)`);
    console.log(`- Both CHAT and CALL conversation types with realistic durations`);
    console.log(`- Comprehensive lead tracking with interaction logs`);
    console.log(`- Large-scale lead dataset (~300 leads) for analytics and testing`);
    console.log(`- Realistic token usage patterns for cost analysis`);
    console.log(`- Topic categorization for conversation analytics`);
    console.log(`- Large-scale dataset for performance testing and analytics`);
    console.log(`- Diverse lead sources, statuses, and progression stages`);
    console.log(`- Industry-specific lead data with relevant pain points and solutions`);
}

// Ensure the script does not run in production
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