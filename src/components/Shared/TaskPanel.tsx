import { useState, useEffect } from 'react';
import { X, Clock, FileText, ExternalLink, AlignLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { clsx } from 'clsx';

export const TaskPanel = ({ className }: { className?: string }) => {
    const { activeTask, setActiveTask, updateTaskDetails, openLink, searchNotes } = useApp();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Autocomplete state
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

    // Reset state when activeTask changes
    useEffect(() => {
        if (activeTask) {
            setTitle(activeTask.content);
            const cleanDesc = (activeTask.description || '').split('\n').map(line => {
                return line.replace(/^\s{4}/, ''); // Remove 4 spaces
            }).join('\n');
            setDescription(cleanDesc);
        }
    }, [activeTask]);

    if (!activeTask) return null;

    // Modified save to accept direct value or Event
    const handleSave = async (contentOrEvent?: string | React.FocusEvent<any>) => {
        if (!activeTask) return;
        setIsSaving(true);

        const descToSave = typeof contentOrEvent === 'string' ? contentOrEvent : description;

        await updateTaskDetails(activeTask.id, {
            content: title,
            description: descToSave
        });
        setIsSaving(false);
    };

    const handleClose = () => {
        setActiveTask(null);
    };

    // Handle typing for autocomplete
    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setDescription(val);
        setCursorPosition(e.target.selectionStart);

        // Check for [[
        // We look backwards from cursor
        const textBeforeCursor = val.substring(0, e.target.selectionStart);
        const match = textBeforeCursor.match(/\[\[([^\]]*)$/);

        if (match) {
            const query = match[1];
            setShowSuggestions(true);
            setSuggestions(searchNotes(query));
            setSelectedSuggestionIndex(0);
        } else {
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        // Replace [[query with [[suggestion]]
        // Find the start of the [[ before cursor
        const textBeforeCursor = description.substring(0, cursorPosition);
        const textAfterCursor = description.substring(cursorPosition);
        const lastOpenBracket = textBeforeCursor.lastIndexOf('[[');

        if (lastOpenBracket !== -1) {
            const newText = textBeforeCursor.substring(0, lastOpenBracket) +
                `[[${suggestion}]]` +
                textAfterCursor;
            setDescription(newText);
            setShowSuggestions(false);
            // We should ideally focus back and update cursor, but React state makes this tricky without refs.
            // But this will trigger a render with new description.
            handleSave(newText);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showSuggestions && suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedSuggestionIndex(prev => (prev + 1) % suggestions.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (suggestions[selectedSuggestionIndex]) {
                    handleSuggestionClick(suggestions[selectedSuggestionIndex]);
                }
            } else if (e.key === 'Escape') {
                setShowSuggestions(false);
            }
        }
    };

    return (
        <div
            className={clsx(
                "bg-card shadow-xl flex flex-col shrink-0 min-h-0 transition-all duration-75 ease-out relative",
                "border-l border-white/10 h-full max-h-full",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-secondary/20 shrink-0">
                <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                    <FileText size={14} />
                    <span>Task Details</span>
                </div>
                <div className="flex gap-1 items-center">
                    <div className="text-[10px] text-muted-foreground self-center px-2">
                        {isSaving ? 'Saving...' : 'All changes saved'}
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-background/50">

                {/* Title Section */}
                <div className="mb-6 group">
                    <div className="relative">
                        <textarea
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleSave}
                            className="w-full bg-transparent text-xl font-bold resize-none focus:outline-none focus:bg-white/5 rounded-md p-2 -ml-2 transition-colors border border-transparent focus:border-white/10 leading-tight"
                            rows={2}
                        />
                    </div>
                </div>

                {/* Meta Data */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {activeTask.completionDate && (
                        <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full border border-green-400/20">
                            <Clock size={12} />
                            <span>Done {new Date(activeTask.completionDate).toLocaleDateString()}</span>
                        </div>
                    )}

                    {activeTask.tags.map(tag => (
                        <span key={tag} className="text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                            {tag}
                        </span>
                    ))}

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full border border-white/5">
                        <span className="opacity-70">Source:</span>
                        <span className="font-mono text-[10px]">{activeTask.filePath.split('/').pop()}</span>
                    </div>
                </div>

                {/* Description / Notes */}
                <div className="mb-8 min-h-[200px] relative">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                            <AlignLeft size={14} /> Connected Note
                        </label>
                    </div>

                    {/* Autocomplete Popup */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute left-0 right-0 z-50 bg-card border border-white/10 rounded-lg shadow-2xl max-h-48 overflow-y-auto" style={{ bottom: '100%', marginBottom: '4px' }}>
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={suggestion}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className={clsx(
                                        "w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition-colors block",
                                        index === selectedSuggestionIndex ? 'bg-primary/20 text-primary' : 'text-foreground'
                                    )}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="bg-secondary/30 rounded-xl border border-white/5 focus-within:ring-1 ring-primary/50 transition-all relative">
                        <textarea
                            value={description}
                            onChange={handleDescriptionChange}
                            onKeyDown={handleKeyDown}
                            onBlur={(e) => {
                                // Delay to allow click on suggestion
                                setTimeout(() => setShowSuggestions(false), 200);
                                handleSave(e);
                            }}
                            className="w-full min-h-[300px] bg-transparent p-4 text-sm leading-relaxed resize-y focus:outline-none font-sans"
                            placeholder="Add notes, details, or checklists... Type [[ to link notes"
                        />
                    </div>
                </div>

                {activeTask.filePath && (
                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                        <button
                            onClick={() => openLink(activeTask.filePath)}
                            className="flex items-center gap-2 text-xs text-primary/70 hover:text-primary transition-colors"
                        >
                            <ExternalLink size={12} />
                            Open in Obsidian
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
