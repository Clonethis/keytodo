import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FileViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string;
}

export const FileViewerModal = ({ isOpen, onClose, title, content }: FileViewerModalProps) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-background w-full max-w-3xl max-h-[80vh] rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden"
                >
                    <header className="flex items-center justify-between p-4 border-b border-border bg-secondary/10">
                        <h2 className="text-lg font-semibold truncate pr-4">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <X size={20} />
                        </button>
                    </header>
                    <div className="flex-1 overflow-y-auto p-6 bg-card text-card-foreground">
                        <div className="prose prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {content}
                            </ReactMarkdown>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
