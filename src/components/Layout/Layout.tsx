import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Kanban, Calendar, Settings, FolderOpen, Menu, X, AlignLeft } from 'lucide-react';

import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

import { useApp } from '../../context/AppContext';
import { FilePanel } from '../Shared/FilePanel';
import { TaskPanel } from '../Shared/TaskPanel';
import { useShortcuts } from '../../hooks/useShortcuts';

export const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { viewingFile, activeTask } = useApp();

    // Right Sidebar Width State
    const [sidebarWidth, setSidebarWidth] = useState(450);
    const [isResizingSidebar, setIsResizingSidebar] = useState(false);

    // Vertical Split State (ratio of top panel, 0 to 1)
    const [splitRatio, setSplitRatio] = useState(0.5);
    const [isResizingSplit, setIsResizingSplit] = useState(false);

    useShortcuts(); // Global shortcuts

    // Resizing Logic for Right Sidebar (Width)
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingSidebar) return;
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > 300 && newWidth < 900) {
                setSidebarWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizingSidebar(false);
            document.body.style.cursor = 'default';
        };

        if (isResizingSidebar) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };
    }, [isResizingSidebar]);

    // Resizing Logic for Vertical Split (Height)
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingSplit) return;
            // Calculate new ratio based on mouse Y relative to window height (or container)
            // Simpler: Just use delta Y or absolute Y from top of sidebar?
            // Since sidebar is 100vh - header (if any) or just 100vh.
            // Let's assume sidebar is full screen height for simplicity or use percentage of window.
            const ratio = e.clientY / window.innerHeight;
            if (ratio > 0.2 && ratio < 0.8) {
                setSplitRatio(ratio);
            }
        };

        const handleMouseUp = () => {
            setIsResizingSplit(false);
            document.body.style.cursor = 'default';
        };

        if (isResizingSplit) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'row-resize';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };
    }, [isResizingSplit]);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Kanban, label: 'Kanban', path: '/kanban' },
        { icon: Calendar, label: 'Calendar', path: '/calendar' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    const showRightPanel = activeTask || viewingFile;
    const showBoth = activeTask && viewingFile;

    return (
        <div className="flex h-screen w-full bg-background text-foreground">

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
                                "text-muted-foreground hover:bg-muted hover:text-foreground", // Default
                                isActive && "bg-primary/20 text-primary-foreground font-medium" // Active override
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
            <main className="flex-1 flex flex-col min-h-0 relative min-w-0">
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

                <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
                    <Outlet />
                </div>
            </main>

            {/* Right Sidebar Container */}
            <AnimatePresence>
                {showRightPanel && (
                    <motion.aside
                        key="right-sidebar"
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="h-full bg-card border-l border-white/10 shadow-2xl z-50 relative flex flex-col"
                        style={{ width: sidebarWidth }}
                    >
                        {/* Drag Handle (Width) */}
                        <div
                            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors z-50 flex items-center justify-center group"
                            onMouseDown={() => setIsResizingSidebar(true)}
                        >
                            <div className="h-8 w-1 bg-white/10 rounded-full group-hover:bg-primary transition-colors" />
                        </div>

                        {/* Panels Stacked */}
                        {activeTask && (
                            <div
                                style={showBoth ? { height: `${splitRatio * 100}%`, flex: 'none' } : { height: '100%', flex: 1 }}
                                className={clsx("min-h-0 w-full flex flex-col overflow-hidden", showBoth && "border-b border-white/10")}
                            >
                                <TaskPanel className="h-full w-full" />
                            </div>
                        )}

                        {/* Split Resizer */}
                        {showBoth && (
                            <div
                                className="h-2 cursor-row-resize hover:bg-primary/20 flex items-center justify-center shrink-0 -my-1 z-10 relative"
                                onMouseDown={() => setIsResizingSplit(true)}
                            >
                                <div className="w-12 h-1 rounded-full bg-white/10" />
                            </div>
                        )}

                        {viewingFile && (
                            <div
                                style={showBoth ? { height: `${(1 - splitRatio) * 100}%`, flex: 'none' } : { height: '100%', flex: 1 }}
                                className="min-h-0 w-full flex flex-col overflow-hidden"
                            >
                                <FilePanel className="h-full w-full" />
                            </div>
                        )}
                    </motion.aside>
                )}
            </AnimatePresence>
        </div>
    );
};
