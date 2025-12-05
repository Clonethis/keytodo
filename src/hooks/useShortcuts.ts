
import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const useShortcuts = () => {
    const { addTask, activeTask, setActiveTask } = useApp();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // CMD/CTRL + N: New Task
            if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
                e.preventDefault();
                const content = prompt("New Task:");
                if (content) {
                    addTask(content);
                }
            }

            // ESC: Close Side Panel
            if (e.key === 'Escape') {
                if (activeTask) {
                    setActiveTask(null);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [addTask, activeTask, setActiveTask]);
};
