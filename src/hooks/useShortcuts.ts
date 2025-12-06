
import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const useShortcuts = () => {
    const {
        activeTask,
        setActiveTask,
        setAddTaskModalOpen,
        isAddTaskModalOpen,
    } = useApp();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in inputs
            const target = e.target as HTMLElement;
            const isTyping = target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable;

            // CMD/CTRL + N: Open Add Task Modal
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                setAddTaskModalOpen(true);
                return;
            }

            // Skip ESC handling if typing in an input (let the input handle it)
            if (isTyping) return;

            // ESC: Close Modal first, then Side Panel
            if (e.key === 'Escape') {
                e.preventDefault();
                if (isAddTaskModalOpen) {
                    setAddTaskModalOpen(false);
                } else if (activeTask) {
                    setActiveTask(null);
                }
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTask, setActiveTask, setAddTaskModalOpen, isAddTaskModalOpen]);
};
