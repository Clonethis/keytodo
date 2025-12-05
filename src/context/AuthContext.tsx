import React, { createContext, useContext, useState, useEffect } from 'react';

// Types for our Auth State
interface User {
    id: string;
    name: string;
    email: string;
    provider: 'google' | 'microsoft' | null;
    avatarUrl?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (provider: 'google' | 'microsoft') => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    // Load from local storage on mount
    useEffect(() => {
        const stored = localStorage.getItem('versatile-user');
        if (stored) {
            setUser(JSON.parse(stored));
        }
    }, []);

    const login = async (provider: 'google' | 'microsoft') => {
        // In a real app, this would trigger window.open(authUrl)
        // For this prototype, we'll simulate a successful login
        console.log(`Initiating login with ${provider}...`);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockUser: User = {
            id: 'usr_123456',
            name: 'Jiri Brtnik',
            email: 'jiri@example.com',
            provider: provider,
            avatarUrl: 'https://ui-avatars.com/api/?name=Jiri+Brtnik&background=random'
        };

        setUser(mockUser);
        localStorage.setItem('versatile-user', JSON.stringify(mockUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('versatile-user');
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
