// React import removed
import { useApp } from '../../context/AppContext';
import { FolderOpen, Circle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { TaskContent } from '../Shared/TaskContent';

export const Dashboard = () => {
    const { rootHandle, openDirectory, tasks, isScanning, needsPermission } = useApp();

    if (needsPermission && rootHandle) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md"
                >
                    <div className="w-20 h-20 bg-yellow-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-yellow-500">
                        <Loader2 size={40} />
                    </div>
                    <h1 className="text-3xl font-bold mb-3">Welcome Back</h1>
                    <p className="text-muted-foreground mb-8 text-lg">
                        We need permission to access <strong>{rootHandle.name}</strong> again.
                    </p>
                    <button
                        onClick={openDirectory}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3 px-8 rounded-full font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/25"
                    >
                        Grant Permission
                    </button>
                </motion.div>
            </div>
        );
    }

    if (!rootHandle) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md"
                >
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary">
                        <FolderOpen size={40} />
                    </div>
                    <h1 className="text-3xl font-bold mb-3">Connect Your Brain</h1>
                    <p className="text-muted-foreground mb-8 text-lg">
                        Select your Obsidian vault or any folder with markdown files to start organizing your life.
                    </p>
                    <button
                        onClick={openDirectory}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3 px-8 rounded-full font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/25"
                    >
                        Open Vault
                    </button>
                </motion.div>
            </div>
        );
    }

    const todoTasks = tasks.filter((t: any) => !t.completed);
    const doneTasks = tasks.filter((t: any) => t.completed);

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Scanning <strong>{rootHandle.name}</strong> • {tasks.length} total tasks found
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {isScanning && <Loader2 className="animate-spin text-primary" />}
                    <button
                        onClick={openDirectory}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors font-medium text-sm border border-white/5"
                    >
                        <FolderOpen size={16} />
                        Switch Vault
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-muted-foreground font-medium mb-2">To Do</h3>
                    <div className="text-4xl font-bold">{todoTasks.length}</div>
                </div>
                <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-muted-foreground font-medium mb-2">Done</h3>
                    <div className="text-4xl font-bold text-green-500">{doneTasks.length}</div>
                </div>
                <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-muted-foreground font-medium mb-2">Completion Rate</h3>
                    <div className="text-4xl font-bold text-primary">
                        {tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0}%
                    </div>
                </div>
            </div>

            <section>
                <h2 className="text-xl font-bold mb-4">Recent Tasks</h2>
                <div className="space-y-2">
                    {todoTasks.slice(0, 5).map(task => (
                        <div key={task.id} className="glass-panel p-4 rounded-xl flex items-start gap-4 hover:border-primary/50 transition-colors cursor-pointer group">
                            <button className="mt-1 text-muted-foreground group-hover:text-primary transition-colors">
                                <Circle size={20} />
                            </button>
                            <div>
                                <TaskContent content={task.content} className="" />
                                <div className="flex gap-2 mt-2">
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{task.filePath.split('/').pop()}</span>
                                    {task.tags.map(tag => (
                                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                    {todoTasks.length === 0 && (
                        <div className="text-muted-foreground italic">No pending tasks found. Great job!</div>
                    )}
                </div>
            </section>
        </div>
    );
};
