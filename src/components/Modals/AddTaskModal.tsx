import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Tag } from 'lucide-react';
import { clsx } from 'clsx';

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (content: string, columnId?: string) => void;
    defaultColumn?: string;
    columns?: { id: string; title: string }[];
}

export const AddTaskModal = ({
    isOpen,
    onClose,
    onAdd,
    defaultColumn,
    columns = []
}: AddTaskModalProps) => {
    const [content, setContent] = useState('');
    const [selectedColumn, setSelectedColumn] = useState(defaultColumn || 'backlog');
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Reset when closed
    useEffect(() => {
        if (!isOpen) {
            setContent('');
            setSelectedColumn(defaultColumn || 'backlog');
        }
    }, [isOpen, defaultColumn]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (content.trim()) {
            onAdd(content.trim(), selectedColumn);
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.stopPropagation();
            onClose();
        }
    };

    const quickTags = ['#doing', '#qa', '#urgent', '#low'];

    const addQuickTag = (tag: string) => {
        if (!content.includes(tag)) {
            setContent(prev => `${prev} ${tag}`.trim());
        }
    };

    // Don't render anything when closed
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100]" onKeyDown={handleKeyDown}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg">
                <div className="bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden mx-4">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                        <div className="flex items-center gap-2 text-foreground">
                            <Plus size={18} className="text-primary" />
                            <span className="font-semibold">New Task</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit} className="p-4 space-y-4">
                        {/* Task Input */}
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="What needs to be done?"
                                className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                                autoComplete="off"
                            />
                        </div>

                        {/* Column Selector */}
                        {columns.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Add to:</span>
                                <div className="flex gap-1.5 flex-wrap">
                                    {columns.map(col => (
                                        <button
                                            key={col.id}
                                            type="button"
                                            onClick={() => setSelectedColumn(col.id)}
                                            className={clsx(
                                                "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                                                selectedColumn === col.id
                                                    ? "bg-primary/20 text-primary border border-primary/30"
                                                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
                                            )}
                                        >
                                            {col.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick Tags */}
                        <div className="flex items-center gap-2">
                            <Tag size={14} className="text-muted-foreground" />
                            <div className="flex gap-1.5 flex-wrap">
                                {quickTags.map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => addQuickTag(tag)}
                                        className={clsx(
                                            "px-2 py-0.5 rounded text-[10px] font-medium transition-all",
                                            content.includes(tag)
                                                ? "bg-primary/20 text-primary"
                                                : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                        )}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!content.trim()}
                                className={clsx(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                                    content.trim()
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                                        : "bg-muted text-muted-foreground cursor-not-allowed"
                                )}
                            >
                                <Plus size={16} />
                                Add Task
                            </button>
                        </div>

                        {/* Keyboard hint */}
                        <div className="text-center text-[10px] text-muted-foreground/50 pt-1">
                            Press <kbd className="px-1 py-0.5 bg-white/5 rounded text-[9px]">Enter</kbd> to add • <kbd className="px-1 py-0.5 bg-white/5 rounded text-[9px]">Esc</kbd> to cancel
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
};
