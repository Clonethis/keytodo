import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar as CalendarIcon, Clock, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    platform: 'google' | 'teams';
    link: string;
}

export const CalendarPage = () => {
    const { isAuthenticated, user } = useAuth();
    const [events, setEvents] = useState<CalendarEvent[]>([]);

    useEffect(() => {
        if (isAuthenticated) {
            // Mock fetching events
            const now = new Date();
            const mockEvents: CalendarEvent[] = [
                {
                    id: '1',
                    title: 'Weekly Sync',
                    start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0),
                    end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0),
                    platform: 'google',
                    link: 'https://meet.google.com/abc-defg-hij'
                },
                {
                    id: '2',
                    title: 'Project Review',
                    start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0),
                    end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 30),
                    platform: 'teams',
                    link: 'https://teams.microsoft.com/l/meetup-join/...'
                }
            ];
            setEvents(mockEvents);
        } else {
            setEvents([]);
        }
    }, [isAuthenticated]);

    return (
        <div className="h-full flex flex-col p-4 md:p-8">
            <header className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold">Calendar & Meetings</h1>
                    <p className="text-muted-foreground mt-1">
                        {isAuthenticated ? `Connected as ${user?.email}` : 'Connect your calendar to see upcoming meetings'}
                    </p>
                </div>
            </header>

            {!isAuthenticated ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-muted/10 rounded-3xl border border-dashed border-muted-foreground/20">
                    <CalendarIcon size={64} className="text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No Calendar Connected</h3>
                    <p className="text-muted-foreground text-center max-w-sm mb-6">
                        Sign in via Settings to sync your Google or Teams calendar events here.
                    </p>
                    <a href="/settings" className="text-primary font-medium hover:underline">Go to Settings &rarr;</a>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Today's Schedule */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Today</h2>
                        <div className="space-y-3">
                            {events.map((event) => (
                                <div key={event.id} className="glass-panel p-4 rounded-xl flex items-center justify-between group hover:border-primary/50 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-center justify-center w-14 h-14 bg-muted/50 rounded-lg">
                                            <span className="text-xs text-muted-foreground">{format(event.start, 'MMM')}</span>
                                            <span className="text-xl font-bold">{format(event.start, 'd')}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{event.title}</h3>
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                                <span className="flex items-center gap-1"><Clock size={14} /> {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}</span>
                                                <span className={clsx("px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider",
                                                    event.platform === 'google' ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"
                                                )}>
                                                    {event.platform}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <a
                                        href={event.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-3 rounded-full hover:bg-primary/20 hover:text-primary text-muted-foreground transition-colors"
                                        title="Join Meeting"
                                    >
                                        <ExternalLink size={20} />
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Placeholder for Month View or Integration Tips */}
                    <div className="hidden lg:block bg-muted/20 rounded-3xl p-8 border border-white/5">
                        <h3 className="text-lg font-medium mb-4">Quick Links</h3>
                        <p className="text-muted-foreground mb-4">
                            Smart link detection is active. Paste a Google Meet or Teams URL in any task to create a join button automatically.
                        </p>
                        <div className="p-4 bg-background/50 rounded-lg border border-border">
                            <code className="text-sm font-mono text-primary">- [ ] Review Proposal https://meet.google.com/abc...</code>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
