import React from 'react';
import { AnalyticsData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { UsersIcon, CheckCheckIcon, HeartIcon, ChatBubbleLeftRightIcon, LightbulbIcon, ZapIcon } from './icons';

interface AnalyticsDashboardProps {
    data: AnalyticsData;
    founderEngagement?: { totalLikes: number; totalComments: number } | null;
    totalIdeas?: number;
    totalNegotiations?: number;
    totalDealsAccepted?: number;
}

const AnalyticsCard = ({ title, value, icon, subtext }: { title: string; value: string | number; icon: React.ReactNode; subtext: string }) => (
    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex items-start justify-between">
        <div>
            <h3 className="text-neutral-400 text-sm font-medium uppercase">{title}</h3>
            <p className="text-3xl font-bold text-white mt-2">{value}</p>
            <p className="text-neutral-500 text-sm mt-1">{subtext}</p>
        </div>
        <div className="bg-purple-900/50 p-3 rounded-lg text-purple-400">
            {icon}
        </div>
    </div>
);

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ data, founderEngagement, totalIdeas, totalNegotiations, totalDealsAccepted }) => {
    return (
        <div className="space-y-8 mt-9">
            <h1 className="text-3xl font-bold text-white">Platform Analytics</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnalyticsCard title="Daily Active Users" value={data.userEngagement.dailyActiveUsers} icon={<UsersIcon className="w-6 h-6"/>} subtext="Last 24 hours" />
                <AnalyticsCard title="Match Success Rate" value={`${data.matchSuccess.successRate}%`} icon={<CheckCheckIcon className="w-6 h-6"/>} subtext="Total successful connections" />
                <AnalyticsCard title="Total Ideas Posted" value={typeof totalIdeas === 'number' ? totalIdeas : 0} icon={<LightbulbIcon className="w-6 h-6"/>} subtext="All time" />
                <AnalyticsCard title="Total Negotiations Started" value={typeof totalNegotiations === 'number' ? totalNegotiations : 0} icon={<ZapIcon className="w-6 h-6"/>} subtext="All time" />
                <AnalyticsCard title="Total Deals Accepted" value={typeof totalDealsAccepted === 'number' ? totalDealsAccepted : 0} icon={<CheckCheckIcon className="w-6 h-6"/>} subtext="All time" />
                {founderEngagement && (
                    <>
                        <AnalyticsCard title="Total Likes on Your Ideas" value={founderEngagement.totalLikes} icon={<HeartIcon className="w-6 h-6"/>} subtext="All your ideas" />
                        <AnalyticsCard title="Total Comments on Your Ideas" value={founderEngagement.totalComments} icon={<ChatBubbleLeftRightIcon className="w-6 h-6"/>} subtext="All your ideas" />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
                    <h2 className="text-xl font-semibold text-white mb-4">Daily Active Users (Last 7 Days)</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data.platformPerformance.dau_data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                            <YAxis stroke="#9ca3af" fontSize={12} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
                                labelStyle={{ color: '#f3f4f6' }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
