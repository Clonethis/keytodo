import { useState, useEffect } from 'react';
import { X, Clock, FileText, ExternalLink, AlignLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TaskPanel = () => {
    const { activeTask, setActiveTask, updateTaskDetails, openLink } = useApp();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Resizable width state
    const [width, setWidth] = useState(450);
    const [isResizing, setIsResizing] = useState(false);

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

    // Resizing logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > 300 && newWidth < 800) {
                setWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = 'default';
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };
    }, [isResizing]);

    if (!activeTask) return null;

    const handleSave = async () => {
        if (!activeTask) return;
        setIsSaving(true);
        await updateTaskDetails(activeTask.id, {
            content: title,
            description: description
        });
        setIsSaving(false);
    };

    const handleClose = () => {
        setActiveTask(null);
    };

    return (
        <div
            className="h-full bg-card border-l border-white/10 shadow-xl flex flex-col shrink-0 transition-all duration-75 ease-out relative"
            style={{ width: `${width}px` }}
        >
            {/* Drag Handle */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors z-50 flex items-center justify-center group"
                onMouseDown={() => setIsResizing(true)}
            >
                <div className="h-8 w-1 bg-white/10 rounded-full group-hover:bg-primary transition-colors" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-secondary/20 shrink-0">
                <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                    <FileText size={14} />
                    <span>Task Details</span>
                </div>
                <div className="flex gap-2">
                    <div className="text-[10px] text-muted-foreground self-center px-2">
                        {isSaving ? 'Saving...' : 'All changes saved'}
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X size={18} />
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
                <div className="mb-8 min-h-[200px]">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                            <AlignLeft size={14} /> Connected Note
                        </label>
                    </div>

                    <div className="bg-secondary/30 rounded-xl border border-white/5 overflow-hidden focus-within:ring-1 ring-primary/50 transition-all">
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onBlur={handleSave}
                            className="w-full min-h-[300px] bg-transparent p-4 text-sm leading-relaxed resize-none focus:outline-none font-sans"
                            placeholder="Add notes, details, or checklists..."
                        />
                    </div>
                </div>

                {/* Linked Files Preview */}
                {activeTask.links && activeTask.links.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-white/5">
                        <h4 className="text-sm font-semibold mb-4 text-muted-foreground">Linked Notes</h4>
                        <div className="flex flex-col gap-2">
                            {activeTask.links.map(link => (
                                <button
                                    key={link}
                                    onClick={() => openLink(link)}
                                    className="flex items-center gap-3 w-full p-3 rounded-lg bg-secondary/40 hover:bg-secondary/60 border border-white/5 transition-all text-left group"
                                >
                                    <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center text-primary shrink-0">
                                        <FileText size={16} />
                                    </div>
                                    <span className="text-sm flex-1 truncate text-foreground/80 group-hover:text-primary transition-colors">{link}</span>
                                    <ExternalLink size={14} className="opacity-0 group-hover:opacity-50" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
