import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Kanban, Calendar, Settings, FolderOpen, Menu, X, AlignLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

import { useApp } from '../../context/AppContext';
import { FileViewerModal } from '../Modals/FileViewerModal';
import { TaskPanel } from '../Shared/TaskPanel';
import { useShortcuts } from '../../hooks/useShortcuts';

export const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { viewingFile, setViewingFile } = useApp();

    useShortcuts(); // Global shortcuts

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Kanban, label: 'Kanban', path: '/kanban' },
        { icon: Calendar, label: 'Calendar', path: '/calendar' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
            {/* Global Modals */}
            <AnimatePresence>
                {viewingFile && (
                    <FileViewerModal
                        isOpen={!!viewingFile}
                        onClose={() => setViewingFile(null)}
                        title={viewingFile.title}
                        content={viewingFile.content}
                    />
                )}
            </AnimatePresence>

            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-20 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isSidebarOpen ? 240 : 0 }}
                style={{ width: isSidebarOpen ? 240 : 0 }}
                className={clsx(
                    "fixed md:relative z-30 h-full border-r border-border glass-panel overflow-hidden flex flex-col transition-all duration-300",
                    !isSidebarOpen && "border-r-0"
                )}
            >
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-lg text-primary">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            V
                        </div>
                        <span>Versatile</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 hover:bg-muted rounded">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-2 space-y-1">
                    <div className="flex justify-end px-2 mb-2">
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-1 hover:bg-muted rounded text-muted-foreground hidden md:block"
                            title="Collapse Sidebar"
                        >
                            <AlignLeft size={20} />
                        </button>
                    </div>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => clsx(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                                isActive ? "bg-primary/20 text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-border">
                    <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                        <FolderOpen size={20} />
                        <span className="text-sm">Open Vault</span>
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
                <header className="h-14 border-b border-border flex items-center px-4 md:px-8 justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-2 -ml-2 rounded-lg hover:bg-muted text-muted-foreground"
                            >
                                <Menu size={20} />
                            </button>
                        )}
                        {/* Breadcrumbs or Page Title could go here */}
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Top Right Actions (User Profile, etc) */}
                        <div className="w-8 h-8 rounded-full bg-muted"></div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto">
                    <Outlet />
                </div>
            </main>

            <AnimatePresence>
                <TaskPanel />
            </AnimatePresence>
        </div>
    );
};
