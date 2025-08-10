
import { AnalyticsData, User, Role } from './types';

export const DUMMY_ANALYTICS_DATA: AnalyticsData = {
    userEngagement: {
        dailyActiveUsers: 1542,
        monthlyActiveUsers: 18390,
        averageSessionDuration: 22,
    },
    matchSuccess: {
        totalMatchesMade: 890,
        successfulConnections: 213,
        successRate: 23.9,
    },
    platformPerformance: {
        dau_data: [
            { name: 'Mon', users: 1200 },
            { name: 'Tue', users: 1450 },
            { name: 'Wed', users: 1300 },
            { name: 'Thu', users: 1600 },
            { name: 'Fri', users: 1800 },
            { name: 'Sat', users: 2100 },
            { name: 'Sun', users: 1542 },
        ],
        match_rate_data: [
            { name: 'Week 1', rate: 18 },
            { name: 'Week 2', rate: 20 },
            { name: 'Week 3', rate: 25 },
            { name: 'Week 4', rate: 23.9 },
        ],
    },
};

export const DUMMY_USERS: User[] = [
    {
        id: 'dev_1',
        name: 'Alex Chen',
        role: Role.Developer,
        avatarUrl: 'https://api.dicebear.com/8.x/bottts/svg?seed=alex',
        location: 'San Francisco, CA',
        interests: ['AI/ML', 'Web3', 'SaaS'],
        skills: ['React', 'Python', 'Go', 'Kubernetes'],
        experience: '5+ years as a full-stack engineer at a FAANG company. Built and scaled multiple products from 0 to 1.',
        lookingFor: 'A visionary founder with a strong product sense to build the next big thing in developer tools.'
    },
    {
        id: 'founder_1',
        name: 'Brenda Smith',
        role: Role.Founder,
        avatarUrl: 'https://api.dicebear.com/8.x/bottts/svg?seed=brenda',
        location: 'New York, NY',
        interests: ['FinTech', 'E-commerce', 'Marketplaces'],
        skills: ['Product Management', 'Marketing', 'Business Strategy'],
        experience: 'Second-time founder. Exited my first startup for $20M. Deep expertise in product-market fit and GTM strategy.',
        lookingFor: 'A technical co-founder who is passionate about building scalable and beautiful products.'
    },
    {
        id: 'investor_1',
        name: 'Charles Davis',
        role: Role.Investor,
        avatarUrl: 'https://api.dicebear.com/8.x/bottts/svg?seed=charles',
        location: 'Remote',
        interests: ['AI', 'Future of Work', 'Climate Tech'],
        skills: ['Venture Capital', 'Fundraising', 'Growth Hacking'],
        experience: 'Partner at a Tier 1 VC firm. Led Series A rounds for several unicorns. I love working with ambitious founders.',
        lookingFor: 'Early-stage startups with a unique insight and massive market potential. Looking to write checks from $500k to $2M.'
    },
    {
        id: 'dev_2',
        name: 'Diana Rodriguez',
        role: Role.Developer,
        avatarUrl: 'https://api.dicebear.com/8.x/bottts/svg?seed=diana',
        location: 'Austin, TX',
        interests: ['Cybersecurity', 'DevOps', 'Cloud Infrastructure'],
        skills: ['AWS', 'Terraform', 'Rust', 'Security Audits'],
        experience: 'Senior security engineer with a background in pentesting and cloud architecture. Love building secure and resilient systems.',
        lookingFor: 'A co-founder who understands the security space and wants to build a product that makes the internet safer.'
    },
    {
        id: 'founder_2',
        name: 'Ethan Wong',
        role: Role.Founder,
        avatarUrl: 'https://api.dicebear.com/8.x/bottts/svg?seed=ethan',
        location: 'Singapore',
        interests: ['Gaming', 'Creator Economy', 'Social Platforms'],
        skills: ['Community Building', 'UI/UX Design', 'Agile Methodology'],
        experience: 'Former product manager at a major gaming company. Launched a social app with over 1M MAU.',
        lookingFor: 'An investor who believes in the power of community and a lead developer to build our V2.'
    }
];
