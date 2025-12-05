import { useAuth } from '../../context/AuthContext';
import { LogOut, Monitor, Moon, Sun, Shield } from 'lucide-react';

export const SettingsPage = () => {
    const { user, login, logout, isAuthenticated } = useAuth();

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">
            <header>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground mt-2">Manage your account and preferences.</p>
            </header>

            {/* Account Section */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Shield size={20} /> Account & Sync
                </h2>
                <div className="glass-panel p-6 rounded-xl">
                    {isAuthenticated && user ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full" />
                                <div>
                                    <h3 className="font-medium text-lg">{user.name}</h3>
                                    <p className="text-muted-foreground text-sm">Signed in with {user.provider}</p>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                            >
                                <LogOut size={18} />
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <h3 className="text-lg font-medium mb-2">Sync with your Calendar</h3>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                Connect your Google or Microsoft account to see your events alongside your tasks.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={() => login('google')}
                                    className="flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-card border border-border hover:bg-muted transition-colors font-medium"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.21.81-.63z" />
                                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Sign in with Google
                                </button>
                                <button
                                    onClick={() => login('microsoft')}
                                    className="flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-card border border-border hover:bg-muted transition-colors font-medium"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 23 23">
                                        <path fill="#f35325" d="M1 1h10v10H1z" />
                                        <path fill="#81bc06" d="M12 1h10v10H12z" />
                                        <path fill="#05a6f0" d="M1 12h10v10H1z" />
                                        <path fill="#ffba08" d="M12 12h10v10H12z" />
                                    </svg>
                                    Sign in with Microsoft
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Appearance Section */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Monitor size={20} /> Appearance
                </h2>
                <div className="glass-panel p-6 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                        <span>Theme</span>
                        <div className="flex bg-muted p-1 rounded-lg">
                            <button className="p-2 rounded-md bg-background shadow-sm text-foreground"><Moon size={16} /></button>
                            <button className="p-2 rounded-md text-muted-foreground"><Sun size={16} /></button>
                            <button className="p-2 rounded-md text-muted-foreground"><Monitor size={16} /></button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
