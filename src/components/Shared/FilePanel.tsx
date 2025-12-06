import { X, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { clsx } from 'clsx';

export const FilePanel = ({ className }: { className?: string }) => {
    const { viewingFile, setViewingFile, openLink } = useApp();

    if (!viewingFile) return null;

    const handleClose = () => {
        setViewingFile(null);
    };

    return (
        <div
            className={clsx(
                "bg-card border-l border-white/10 shadow-xl flex flex-col shrink-0 min-h-0 h-full max-h-full transition-all duration-75 ease-out relative",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-secondary/20 shrink-0">
                <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-semibold truncate flex-1 min-w-0">
                    <FileText size={14} />
                    <span className="truncate">{viewingFile.title}</span>
                </div>
                <button
                    onClick={handleClose}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors text-muted-foreground hover:text-foreground shrink-0"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-background/50">
                <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            a: ({ node, href, children, ...props }) => {
                                if (href?.startsWith('wiki:')) {
                                    const linkText = decodeURIComponent(href.replace('wiki:', ''));
                                    return (
                                        <span
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                openLink(linkText);
                                            }}
                                            className="text-primary hover:underline cursor-pointer font-medium bg-primary/10 px-1 rounded mx-0.5 inline-block"
                                            title={`Open ${linkText}`}
                                        >
                                            {children}
                                        </span>
                                    );
                                }
                                return (
                                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline" {...props}>
                                        {children}
                                    </a>
                                );
                            }
                        }}
                    >
                        {viewingFile.content.replace(/\[\[(.*?)\]\]/g, (_, p1) => {
                            return `[${p1}](wiki:${p1.replace(/ /g, '%20')})`;
                        })}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
};
