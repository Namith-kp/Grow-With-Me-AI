import React from 'react';
import { AnalyticsData } from '../types';
// Removed recharts import to avoid exponent.js issue
import { UsersIcon, CheckCheckIcon, HeartIcon, ChatBubbleLeftRightIcon, LightbulbIcon, ZapIcon } from './icons';

interface AnalyticsDashboardProps {
    data: AnalyticsData;
    founderEngagement?: { totalLikes: number; totalComments: number } | null;
    totalIdeas?: number;
    totalNegotiations?: number;
    totalDealsAccepted?: number;
}

const AnalyticsCard = ({ title, value, icon, subtext, trend }: { title: string; value: string | number; icon: React.ReactNode; subtext: string; trend?: string }) => (
    <div className="group relative bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-sm border border-slate-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-slate-800/50 to-slate-700/50 rounded-lg sm:rounded-xl border border-slate-700/30">
            {icon}
        </div>
            {trend && (
                <span className={`text-xs px-2 sm:px-3 py-1 rounded-full font-medium ${
                    trend.startsWith('+') ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-700/30' : 'bg-red-900/30 text-red-300 border border-red-700/30'
                }`}>
                    {trend}
                </span>
            )}
        </div>
        <h3 className="text-slate-300 text-xs sm:text-sm font-medium mb-1 sm:mb-2">{title}</h3>
        <p className="text-2xl sm:text-3xl font-bold text-white mb-1">{value}</p>
        <p className="text-slate-400 text-xs sm:text-sm">{subtext}</p>
    </div>
);

const LineChart = ({ data }: { data: Array<{ name: string; users: number }> }) => {
    const maxUsers = Math.max(...data.map(d => d.users));
    const minUsers = Math.min(...data.map(d => d.users));
    const range = maxUsers - minUsers;
    
    // Create smooth curve path using quadratic bezier curves
    const createCurvedPath = () => {
        if (data.length < 2) return '';
        
        const points = data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = range > 0 ? 100 - ((item.users - minUsers) / range) * 80 : 50;
            return { x, y };
        });
        
        let path = `M ${points[0].x},${points[0].y}`;
        
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            
            // Calculate control points for smooth curve
            const cp1x = prev.x + (curr.x - prev.x) * 0.5;
            const cp1y = prev.y;
            const cp2x = curr.x - (curr.x - prev.x) * 0.5;
            const cp2y = curr.y;
            
            path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
        }
        
        return path;
    };
    
    // Create area path for the curved line
    const createCurvedAreaPath = () => {
        if (data.length < 2) return '';
        
        const points = data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = range > 0 ? 100 - ((item.users - minUsers) / range) * 80 : 50;
            return { x, y };
        });
        
        let path = `M ${points[0].x},${points[0].y}`;
        
        // Create curved line
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            
            const cp1x = prev.x + (curr.x - prev.x) * 0.5;
            const cp1y = prev.y;
            const cp2x = curr.x - (curr.x - prev.x) * 0.5;
            const cp2y = curr.y;
            
            path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
        }
        
        // Close the area by going to bottom and back to start
        path += ` L ${points[points.length - 1].x},100`;
        path += ` L ${points[0].x},100 Z`;
        
        return path;
    };
    
    const linePath = createCurvedPath();
    const areaPath = createCurvedAreaPath();
    
    return (
        <div className="space-y-3 sm:space-y-4">
            {/* Chart Container */}
            <div className="relative h-32 sm:h-40 lg:h-48 bg-gradient-to-br from-slate-800/30 to-slate-700/30 rounded-lg sm:rounded-xl border border-slate-700/30 p-3 sm:p-4">
                {/* Grid Lines */}
                <div className="absolute inset-3 sm:inset-4 flex flex-col justify-between">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="border-b border-slate-700/20" />
                    ))}
                </div>
                
                {/* Y-axis labels */}
                <div className="absolute left-0 top-3 sm:top-4 bottom-3 sm:bottom-4 flex flex-col justify-between text-xs text-slate-400">
                    {[maxUsers, Math.round(maxUsers * 0.75), Math.round(maxUsers * 0.5), Math.round(maxUsers * 0.25), minUsers].map((value, i) => (
                        <span key={i} className="transform -translate-y-1 text-xs">{value}</span>
                    ))}
                </div>
                
                {/* SVG Chart */}
                <div className="absolute inset-3 sm:inset-4">
                    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {/* Area fill */}
                        <defs>
                            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="rgb(148 163 184)" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="rgb(148 163 184)" stopOpacity="0.05" />
                            </linearGradient>
                        </defs>
                        
                        {/* Area */}
                        <path
                            d={areaPath}
                            fill="url(#areaGradient)"
                            stroke="none"
                        />
                        
                        {/* Curved Line */}
                        <path
                            d={linePath}
                            fill="none"
                            stroke="rgb(148 163 184)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        
                        {/* Data points */}
                        {data.map((item, index) => {
                            const x = (index / (data.length - 1)) * 100;
                            const y = range > 0 ? 100 - ((item.users - minUsers) / range) * 80 : 50;
                            return (
                                <circle
                                    key={index}
                                    cx={x}
                                    cy={y}
                                    r="1.5"
                                    fill="rgb(148 163 184)"
                                    className="animate-pulse"
                                />
                            );
                        })}
                    </svg>
                </div>
            </div>
            
            {/* X-axis labels */}
            <div className="flex justify-between text-xs text-slate-400 px-3 sm:px-4">
                {data.map((item, index) => (
                    <span key={index} className="text-center">
                        <div className="text-xs sm:text-sm">{item.name}</div>
                        <div className="text-white font-medium mt-1 text-xs sm:text-sm">{item.users}</div>
                    </span>
                ))}
            </div>
        </div>
    );
};

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ data, founderEngagement, totalIdeas, totalNegotiations, totalDealsAccepted }) => {
    return (
        <div className="w-full h-full bg-gradient-to-br from-slate-950 to-black overflow-auto">
            <div className="h-full flex flex-col pt-16 sm:pt-0">
                {/* Header */}
                <div className="flex-shrink-0 p-4 sm:p-6 border-b border-slate-800/30">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
                    <p className="text-slate-400 text-sm sm:text-base">Real-time insights and performance metrics</p>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 lg:space-y-8 pb-20 sm:pb-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                        <AnalyticsCard 
                            title="Daily Active Users" 
                            value={data.userEngagement.dailyActiveUsers} 
                            icon={<UsersIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300"/>} 
                            subtext="Last 24 hours"
                            trend="+5.2%"
                        />
                        <AnalyticsCard 
                            title="Match Success Rate" 
                            value={`${data.matchSuccess.successRate}%`} 
                            icon={<CheckCheckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400"/>} 
                            subtext="Total successful connections"
                            trend="+2.1%"
                        />
                        <AnalyticsCard 
                            title="Total Ideas Posted" 
                            value={typeof totalIdeas === 'number' ? totalIdeas : 0} 
                            icon={<LightbulbIcon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400"/>} 
                            subtext="All time"
                            trend="+12.3%"
                        />
                        <AnalyticsCard 
                            title="Total Negotiations" 
                            value={typeof totalNegotiations === 'number' ? totalNegotiations : 0} 
                            icon={<ZapIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400"/>} 
                            subtext="All time"
                            trend="+8.7%"
                        />
                        <AnalyticsCard 
                            title="Deals Accepted" 
                            value={typeof totalDealsAccepted === 'number' ? totalDealsAccepted : 0} 
                            icon={<CheckCheckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400"/>} 
                            subtext="All time"
                            trend="+15.4%"
                        />
                {founderEngagement && (
                    <>
                                <AnalyticsCard 
                                    title="Total Likes" 
                                    value={founderEngagement.totalLikes} 
                                    icon={<HeartIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-400"/>} 
                                    subtext="On your ideas"
                                    trend="+3.2%"
                                />
                                <AnalyticsCard 
                                    title="Total Comments" 
                                    value={founderEngagement.totalComments} 
                                    icon={<ChatBubbleLeftRightIcon className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400"/>} 
                                    subtext="On your ideas"
                                    trend="+7.8%"
                                />
                    </>
                )}
            </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                        {/* Daily Active Users Line Chart */}
                        <div className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-sm border border-slate-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Daily Active Users</h2>
                                    <p className="text-slate-400 text-xs sm:text-sm">Last 7 days performance</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-slate-600 to-slate-500 rounded-full"></div>
                                    <span className="text-slate-300 text-xs sm:text-sm">Active Users</span>
                                </div>
                            </div>
                            <LineChart data={data.platformPerformance.dau_data} />
                        </div>

                        {/* Platform Insights */}
                        <div className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-sm border border-slate-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10">
                            <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Platform Insights</h2>
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg sm:rounded-xl border border-slate-700/30">
                                    <div>
                                        <p className="text-slate-300 text-xs sm:text-sm">Monthly Growth</p>
                                        <p className="text-xl sm:text-2xl font-bold text-white">+23.5%</p>
                                    </div>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-700 to-slate-600 rounded-lg sm:rounded-xl flex items-center justify-center border border-slate-600/30">
                                        <span className="text-white font-bold text-base sm:text-lg">↗</span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg sm:rounded-xl border border-slate-700/30">
                                    <div>
                                        <p className="text-slate-300 text-xs sm:text-sm">User Retention</p>
                                        <p className="text-xl sm:text-2xl font-bold text-white">89.2%</p>
                                    </div>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-700 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center border border-emerald-600/30">
                                        <span className="text-white font-bold text-base sm:text-lg">✓</span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg sm:rounded-xl border border-slate-700/30">
                                    <div>
                                        <p className="text-slate-300 text-xs sm:text-sm">Avg Session Time</p>
                                        <p className="text-xl sm:text-2xl font-bold text-white">18.4m</p>
                                    </div>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-700 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center border border-purple-600/30">
                                        <span className="text-white font-bold text-base sm:text-lg">⏱</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                        <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-700/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-300 text-xs sm:text-sm font-medium">New Users Today</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-white">1,247</p>
                                </div>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-700 to-slate-600 rounded-lg sm:rounded-xl flex items-center justify-center border border-slate-600/30">
                                    <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-700/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-300 text-xs sm:text-sm font-medium">Successful Matches</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-white">892</p>
                                </div>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-700 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center border border-emerald-600/30">
                                    <CheckCheckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-700/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10 lg:col-span-1">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-300 text-xs sm:text-sm font-medium">Revenue Generated</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-white">$12.4K</p>
                                </div>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-700 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center border border-purple-600/30">
                                    <span className="text-purple-300 font-bold text-base sm:text-lg">$</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
