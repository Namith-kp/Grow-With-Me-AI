import React, { useState, useEffect, useRef } from 'react';
import { View, User } from '../types';
import { LogoIcon, LogInIcon, LogOutIcon, MessageSquareIcon, LightbulbIcon, UserPlusIcon, UsersIcon, UserIcon, TrendingUpIcon, HamburgerIcon, XIcon, BellIcon } from './icons';
import { firestoreService } from '../services/firestoreService';

interface HeaderProps {
    currentView: View;
    setView: (view: View) => void;
    userProfile: User | null;
    onLogin: () => void;
    onLogout: () => void;
    isMobileChatOpen?: boolean;
    isMobileNegotiationOpen?: boolean;
}

const NavLink: React.FC<{
    currentView: View;
    targetView: View;
    setView: (view: View) => void;
    children: React.ReactNode;
    icon: React.ElementType;
    pendingCount?: number;
}> = ({ currentView, targetView, setView, children, icon: Icon, pendingCount }) => {
    const isActive = currentView === targetView;
    return (
        <div
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                isActive ? 'bg-purple-600 text-white font-semibold shadow-lg' : 'text-neutral-300 hover:bg-neutral-700/50 hover:text-white'
            }`}
            onClick={() => setView(targetView)}
        >
            <Icon className="w-6 h-6" />
            <span className="flex-grow">{children}</span>
            {pendingCount && pendingCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {pendingCount}
                </span>
            )}
        </div>
    );
};

const Header: React.FC<HeaderProps> = ({ currentView, setView, userProfile, onLogout, isMobileChatOpen = false, isMobileNegotiationOpen = false }) => {
    const [isMenuOpen, setMenuOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
    const showNav = useHideOnScroll();

    const handleNavigation = (targetView: View) => {
        if (userProfile) {
            setView(targetView);
        } else {
            setView(View.AUTH);
        }
    };

    // Handle sidebar mount/unmount for animation
    useEffect(() => {
        if (sidebarOpen) {
            setSidebarVisible(true);
        } else {
            // Wait for animation to finish before unmounting
            const timeout = setTimeout(() => setSidebarVisible(false), 300);
            return () => clearTimeout(timeout);
        }
    }, [sidebarOpen]);

    // Real-time notification listener
    useEffect(() => {
        if (!userProfile) return;

        const unsubscribe = firestoreService.getUnreadNotificationCountRealtime(
            userProfile.id,
            (count) => {
                setUnreadNotificationCount(count);
            }
        );

        return () => unsubscribe();
    }, [userProfile]);

    // If not logged in, show simple header
    if (!userProfile) {
        return (
            <header className="fixed top-0 left-0 right-0 bg-white/5 backdrop-blur-sm z-50 border-b border-white/10 shadow-lg">
                <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView(View.LANDING)}>
                            <LogoIcon className="h-8 w-8 text-purple-500" />
                            <span className="font-bold text-xl text-white">Grow With Me</span>
                        </div>
                        <button onClick={() => setView(View.AUTH)} className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300">
                            <LogInIcon className="w-5 h-5" />
                            Login
                        </button>
                    </div>
                </nav>
            </header>
        );
    }

    // Hook to hide nav bar on scroll down and show on scroll up (mobile only)
    function useHideOnScroll() {
        const [show, setShow] = useState(true);
        const lastScroll = useRef(0);
        useEffect(() => {
            const handleScroll = () => {
                const curr = window.scrollY;
                if (curr < 10) {
                    setShow(true);
                    lastScroll.current = curr;
                    return;
                }
                if (curr > lastScroll.current && curr - lastScroll.current > 10) {
                    setShow(false); // scrolling down
                } else if (curr < lastScroll.current && lastScroll.current - curr > 10) {
                    setShow(true); // scrolling up
                }
                lastScroll.current = curr;
            };
            window.addEventListener('scroll', handleScroll, { passive: true });
            return () => window.removeEventListener('scroll', handleScroll);
        }, []);
        return show;
    }

    return (
        <>
            {/* Mobile header - Hidden when chat or negotiation is open on mobile */}
            {!isMobileChatOpen && !isMobileNegotiationOpen && (
                <header className="lg:hidden fixed top-0 left-0 right-0 bg-white/10 backdrop-blur-sm z-50 border-b border-white/10 shadow-lg flex items-center h-16 px-4 justify-between">
                    <div className="flex items-center">
                        {/* Show sidebar icon on tablet screens only (sm:block, hidden on xs and lg+) */}
                        <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-neutral-800 focus:outline-none mr-2 sm:block hidden lg:hidden" title="Open menu">
                            <HamburgerIcon className="w-7 h-7 text-white" />
                        </button>
                        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView(View.LANDING)}>
                            <LogoIcon className="h-8 w-8 text-purple-500" />
                            <span className="font-bold text-xl text-white">Grow With Me</span>
                        </div>
                    </div>
                    <div className="flex items-center">
                        {/* Notification Bell */}
                        <div className="relative mr-3">
                            <button
                                onClick={() => setView(View.NOTIFICATIONS)}
                                className="p-2 rounded-lg hover:bg-neutral-800 focus:outline-none transition-colors"
                                title="Notifications"
                            >
                                <BellIcon className="w-6 h-6 text-white" />
                                {unreadNotificationCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                        {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                                    </span>
                                )}
                            </button>
                        </div>
                        <div className="relative">
                            <img src={userProfile.avatarUrl} alt={userProfile.name} className="w-9 h-9 rounded-full border-2 border-neutral-700 cursor-pointer" onClick={() => setMenuOpen(!isMenuOpen)} />
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-44 bg-neutral-800 rounded-lg shadow-lg py-1 border border-neutral-700 animate-fade-in-scale-sm z-50">
                                    <a href="#" onClick={(e) => { e.preventDefault(); setView(View.PROFILE); setMenuOpen(false); setSidebarOpen(false); }} className="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-700">My Profile</a>
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation(View.PEOPLE); setMenuOpen(false); setSidebarOpen(false); }} className={`block px-4 py-2 text-sm hover:bg-neutral-700 flex items-center gap-2 ${currentView === View.PEOPLE ? 'text-purple-400' : 'text-neutral-300'}`}><UsersIcon className="w-4 h-4"/> People</a>
                                    <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); setMenuOpen(false); setSidebarOpen(false); }} className="block px-4 py-2 text-sm text-red-400 hover:bg-neutral-700 flex items-center gap-2">
                                        <LogOutIcon className="w-4 h-4"/> Logout
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
            )}

            {/* Bottom nav bar for mobile only (max-width: 640px), hides on scroll down - Hidden when chat or negotiation is open */}
            {!isMobileChatOpen && !isMobileNegotiationOpen && (
                <nav className={`fixed bottom-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-sm border-t border-white/10 shadow-lg flex justify-between items-center h-16 px-1 sm:hidden lg:hidden gap-1 transition-transform duration-300 ${showNav ? 'translate-y-0' : 'translate-y-full'}`}>
                    <button onClick={() => handleNavigation(View.DASHBOARD)} className={`flex flex-col items-center flex-1 py-1 mx-0.5 ${currentView === View.DASHBOARD ? 'text-purple-400' : 'text-neutral-300'}`}> <UserIcon className="w-5 h-5 mb-0.5" /> <span className="text-[11px] leading-tight">Dashboard</span> </button>
                    <button onClick={() => handleNavigation(View.ANALYTICS)} className={`flex flex-col items-center flex-1 py-1 mx-0.5 ${currentView === View.ANALYTICS ? 'text-purple-400' : 'text-neutral-300'}`}> <TrendingUpIcon className="w-5 h-5 mb-0.5" /> <span className="text-[11px] leading-tight">Analytics</span> </button>
                    <button onClick={() => handleNavigation(View.MESSAGES)} className={`flex flex-col items-center flex-1 py-1 mx-0.5 ${currentView === View.MESSAGES ? 'text-purple-400' : 'text-neutral-300'}`}> <MessageSquareIcon className="w-5 h-5 mb-0.5" /> <span className="text-[11px] leading-tight">Messages</span> </button>
                    <button onClick={() => handleNavigation(View.IDEAS)} className={`flex flex-col items-center flex-1 py-1 mx-0.5 ${currentView === View.IDEAS ? 'text-purple-400' : 'text-neutral-300'}`}> <LightbulbIcon className="w-5 h-5 mb-0.5" /> <span className="text-[11px] leading-tight">Ideas</span> </button>
                    <button onClick={() => handleNavigation(View.NEGOTIATIONS)} className={`flex flex-col items-center flex-1 py-1 mx-0.5 ${currentView === View.NEGOTIATIONS ? 'text-purple-400' : 'text-neutral-300'}`}> <LightbulbIcon className="w-5 h-5 mb-0.5" /> <span className="text-[11px] leading-tight">Negotiations</span> </button>
                </nav>
            )}

            {/* Sidebar overlay for mobile with sliding animation */}
            { (sidebarOpen || sidebarVisible) && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    {/* Overlay */}
                    <div className="fixed inset-0 bg-white/10 backdrop-blur-sm transition-opacity duration-300 opacity-100 pointer-events-auto" onClick={() => setSidebarOpen(false)}></div>
                    {/* Sidebar with slide animation and glassmorphism gradient */}
                    <aside
                        className={`relative w-64 bg-white/5 backdrop-blur-sm border-r border-white/10 shadow-lg text-white p-4 flex flex-col h-full z-50 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} pointer-events-auto`}
                        style={{ minWidth: '16rem' }}
                    >
                        {/* Gradient and blurred circles for sidebar aesthetics */}
                        <div className="absolute inset-0 -z-10 pointer-events-none">
                            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl animate-pulse-slow" />
                            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
                        </div>
                        <div className="flex items-center justify-between mb-10 px-2">
                            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => { setView(View.LANDING); setSidebarOpen(false); }}>
                                <LogoIcon className="h-8 w-8 text-purple-500" />
                                <span className="font-bold text-xl text-white">Grow With Me</span>
                            </div>
                            <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-neutral-800 focus:outline-none" title="Close menu">
                                <XIcon className="w-6 h-6 text-white" />
                            </button>
                        </div>
                        <nav className="flex-grow">
                            <ul className="space-y-2">
                                <li><NavLink currentView={currentView} targetView={View.DASHBOARD} setView={(v) => { handleNavigation(v); setSidebarOpen(false); }} icon={UserIcon}>Dashboard</NavLink></li>
                                <li><NavLink currentView={currentView} targetView={View.ANALYTICS} setView={(v) => { handleNavigation(v); setSidebarOpen(false); }} icon={TrendingUpIcon}>Analytics</NavLink></li>
                                <li><NavLink currentView={currentView} targetView={View.MESSAGES} setView={(v) => { handleNavigation(v); setSidebarOpen(false); }} icon={MessageSquareIcon}>Messages</NavLink></li>
                                <li><NavLink currentView={currentView} targetView={View.IDEAS} setView={(v) => { handleNavigation(v); setSidebarOpen(false); }} icon={LightbulbIcon}>Ideas</NavLink></li>
                                <li><NavLink currentView={currentView} targetView={View.PEOPLE} setView={(v) => { handleNavigation(v); setSidebarOpen(false); }} icon={UsersIcon}>People</NavLink></li>
                                <li><NavLink currentView={currentView} targetView={View.NEGOTIATIONS} setView={(v) => { handleNavigation(v); setSidebarOpen(false); }} icon={LightbulbIcon}>Negotiations</NavLink></li>
                            </ul>
                        </nav>
                        <div className="mt-auto">
                            <div className="relative">
                                <div className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-neutral-800 transition-colors" onClick={() => setMenuOpen(!isMenuOpen)}>
                                    <img src={userProfile.avatarUrl} alt={userProfile.name} className="w-10 h-10 rounded-full border-2 border-neutral-700" />
                                    <div className="flex-grow overflow-hidden">
                                        <p className="text-sm text-white font-semibold truncate">{userProfile.name}</p>
                                        <p className="text-xs text-neutral-400 truncate">{userProfile.role}</p>
                                    </div>
                                </div>
                                {isMenuOpen && (
                                    <div className="absolute bottom-full left-0 mb-2 w-full bg-neutral-800 rounded-lg shadow-lg py-1 border border-neutral-700 animate-fade-in-scale-sm">
                                        <a href="#" onClick={(e) => { e.preventDefault(); setView(View.PROFILE); setMenuOpen(false); }} className="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-700">My Profile</a>
                                        <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); setMenuOpen(false); }} className="block px-4 py-2 text-sm text-red-400 hover:bg-neutral-700 flex items-center gap-2">
                                            <LogOutIcon className="w-4 h-4"/> Logout
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>
            )}

            {/* Sidebar for desktop - Always visible */}
            <aside className="hidden lg:flex w-64 bg-white/5 backdrop-blur-sm border-r border-white/10 shadow-lg text-white p-4 flex-col h-screen fixed z-50">
                {/* Gradient and blurred circles for sidebar aesthetics */}
                <div className="absolute inset-0 -z-10 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl animate-pulse-slow" />
                    <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
                </div>
                <div className="flex items-center space-x-2 cursor-pointer mb-10 px-2" onClick={() => setView(View.LANDING)}>
                    <LogoIcon className="h-8 w-8 text-purple-500" />
                    <span className="font-bold text-xl text-white">Grow With Me</span>
                </div>
                <nav className="flex-grow">
                    <ul className="space-y-2">
                        <li><NavLink currentView={currentView} targetView={View.DASHBOARD} setView={handleNavigation} icon={UserIcon}>Dashboard</NavLink></li>
                        <li><NavLink currentView={currentView} targetView={View.ANALYTICS} setView={handleNavigation} icon={TrendingUpIcon}>Analytics</NavLink></li>
                        <li><NavLink currentView={currentView} targetView={View.MESSAGES} setView={handleNavigation} icon={MessageSquareIcon}>Messages</NavLink></li>
                        <li><NavLink currentView={currentView} targetView={View.IDEAS} setView={handleNavigation} icon={LightbulbIcon}>Ideas</NavLink></li>
                        <li><NavLink currentView={currentView} targetView={View.PEOPLE} setView={handleNavigation} icon={UsersIcon}>People</NavLink></li>
                        <li><NavLink currentView={currentView} targetView={View.NEGOTIATIONS} setView={handleNavigation} icon={LightbulbIcon}>Negotiations</NavLink></li>
                    </ul>
                    
                    {/* Notifications Section */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <div
                            className="flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition-colors duration-200 text-neutral-300 hover:bg-neutral-700/50 hover:text-white"
                            onClick={() => setView(View.NOTIFICATIONS)}
                        >
                            <div className="relative">
                                <BellIcon className="w-6 h-6" />
                                {unreadNotificationCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                        {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                                    </span>
                                )}
                            </div>
                            <span className="flex-grow">Notifications</span>
                        </div>
                    </div>
                </nav>
                <div className="mt-auto">
                    <div className="relative">
                        <div className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-neutral-800 transition-colors" onClick={() => setMenuOpen(!isMenuOpen)}>
                            <img src={userProfile.avatarUrl} alt={userProfile.name} className="w-10 h-10 rounded-full border-2 border-neutral-700" />
                            <div className="flex-grow overflow-hidden">
                                <p className="text-sm text-white font-semibold truncate">{userProfile.name}</p>
                                <p className="text-xs text-neutral-400 truncate">{userProfile.role}</p>
                            </div>
                        </div>
                        {isMenuOpen && (
                            <div className="absolute bottom-full left-0 mb-2 w-full bg-neutral-800 rounded-lg shadow-lg py-1 border border-neutral-700 animate-fade-in-scale-sm">
                                <a href="#" onClick={(e) => { e.preventDefault(); setView(View.PROFILE); setMenuOpen(false); }} className="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-700">My Profile</a>
                                <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); setMenuOpen(false); }} className="block px-4 py-2 text-sm text-red-400 hover:bg-neutral-700 flex items-center gap-2">
                                    <LogOutIcon className="w-4 h-4"/> Logout
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Notifications Panel */}
            {/* This section is now handled by the NotificationsPage component */}
        </>
    );
};

export default Header;
