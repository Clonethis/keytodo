
import { useApp } from '../../context/AppContext';

interface TaskContentProps {
    content: string;
    className?: string;
}

export const TaskContent = ({ content, className }: TaskContentProps) => {
    const { openLink } = useApp();

    // Regex to find [[Link]] pattern
    const parts = content.split(/(\[\[.*?\]\])/g);

    return (
        <span className={className}>
            {parts.map((part, index) => {
                const match = part.match(/^\[\[(.*?)\]\]$/);
                if (match) {
                    const linkText = match[1];
                    return (
                        <span
                            key={index}
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                openLink(linkText);
                            }}
                            className="text-primary hover:underline cursor-pointer font-medium bg-primary/10 px-1 rounded mx-0.5"
                            title={`Open ${linkText}`}
                        >
                            {linkText}
                        </span>
                    );
                }
                // Render text with hashtags highlighted too?
                // Minimal implementation for now.
                return <span key={index}>{part}</span>;
            })}
        </span>
    );
};
