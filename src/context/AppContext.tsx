import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFileSystem } from '../hooks/useFileSystem';
// FileNode type import removed

interface Task {
    id: string; // Unique ID (often path + line number hash)
    content: string;
    completed: boolean;
    filePath: string;
    tags: string[];
    completionDate?: Date;
    description?: string;
    links?: string[];
}

interface AppContextType {
    rootHandle: FileSystemDirectoryHandle | null;
    isScanning: boolean;
    needsPermission: boolean;
    tasks: Task[];
    openDirectory: () => Promise<void>;
    refreshTasks: () => Promise<void>;
    updateTaskStatus: (taskId: string, newStatus: 'backlog' | 'doing' | 'qa' | 'done') => Promise<void>;
    addTask: (content: string) => Promise<void>;
    viewingFile: { title: string, content: string } | null;
    setViewingFile: (file: { title: string, content: string } | null) => void;
    openLink: (linkText: string) => Promise<void>;

    // New features
    activeTask: Task | null;
    setActiveTask: (task: Task | null) => void;
    modalTask: Task | null;
    setModalTask: (task: Task | null) => void;
    updateTaskDetails: (taskId: string, updates: { content?: string, description?: string }) => Promise<void>;

    columns: ColumnConfig[];
    setColumns: (columns: ColumnConfig[]) => void;
    updateColumn: (id: string, title: string) => void;

    // Autocomplete
    searchNotes: (query: string) => string[];

    // Add Task Modal
    isAddTaskModalOpen: boolean;
    setAddTaskModalOpen: (open: boolean) => void;
    addTaskDefaultColumn: string | undefined;
    setAddTaskDefaultColumn: (column: string | undefined) => void;
}

export interface ColumnConfig {
    id: string;
    title: string;
    status: 'backlog' | 'doing' | 'qa' | 'done';
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
    const fs = useFileSystem();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [viewingFile, setViewingFile] = useState<{ title: string, content: string } | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    // Add Task Modal State
    const [isAddTaskModalOpen, setAddTaskModalOpen] = useState(false);
    const [addTaskDefaultColumn, setAddTaskDefaultColumn] = useState<string | undefined>(undefined);

    // Load columns from localStorage or default
    const [columns, setColumns] = useState<ColumnConfig[]>(() => {
        const saved = localStorage.getItem('kanban_columns');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse columns", e);
            }
        }
        return [
            { id: 'backlog', title: 'Backlog', status: 'backlog' },
            { id: 'doing', title: 'Doing', status: 'doing' },
            { id: 'qa', title: 'QA', status: 'qa' },
            { id: 'done', title: 'Done (Week)', status: 'done' }
        ];
    });

    // Save columns whenever they change
    useEffect(() => {
        localStorage.setItem('kanban_columns', JSON.stringify(columns));
    }, [columns]);

    const updateColumn = (id: string, title: string) => {
        setColumns(prev => prev.map(col => col.id === id ? { ...col, title } : col));
    };

    const fileCache = React.useRef<Map<string, { lastModified: number, tasks: Task[], content: string }>>(new Map());

    const refreshTasks = async () => {
        setIsScanning(true);
        // Better error handling for file access
        try {
            const files = await fs.getAllMarkdownFiles();
            let allTasks: Task[] = [];
            let cacheHitCount = 0;

            for (const fileItem of files) {
                // Check cache
                const cached = fileCache.current.get(fileItem.path);

                if (cached && cached.lastModified === fileItem.lastModified) {
                    allTasks.push(...cached.tasks);
                    cacheHitCount++;
                    continue;
                }

                const lines = fileItem.content.split('\n');
                const fileTasks: Task[] = [];

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    // Regex to match "- [ ]" or "- [x]"
                    // We capture the indentation to know what counts as a "sub-note"
                    const match = line.match(/^(\s*)-\s\[([ xX])\]\s(.*)/);

                    if (match) {
                        const indentation = match[1];
                        const completed = match[2].toLowerCase() === 'x';
                        let content = match[3];
                        const id = `${fileItem.path}:${i}`; // ID based on file path and line index

                        // Extract tags
                        const tags = content.match(/#[\w-]+/g) || [];

                        // Extract completion date
                        const dateMatch = content.match(/✅\s*(\d{4}-\d{2}-\d{2})/);
                        let completionDate = dateMatch ? new Date(dateMatch[1]) : undefined;

                        // Extract Wiki Links [[Link]]
                        const linkMatches = content.match(/\[\[(.*?)\]\]/g) || [];
                        const links = linkMatches.map(l => l.slice(2, -2)); // Remove [[ and ]]

                        // Look ahead for Description (indented lines)
                        let descriptionLines: string[] = [];
                        let j = i + 1;
                        while (j < lines.length) {
                            const nextLine = lines[j];

                            if (nextLine.trim() === '') {
                                j++;
                                continue;
                            }

                            // Regex to check indentation
                            const nextIndentMatch = nextLine.match(/^(\s*)/);
                            const nextIndent = nextIndentMatch ? nextIndentMatch[1] : '';

                            // If next line is a new task (same indentation or less, and has - [ ]), stop
                            if (nextLine.match(/^\s*-\s\[/)) {
                                break;
                            }

                            // If it's a sub-bullet, we count it as description for now
                            // If indentation is greater than current task
                            if (nextIndent.length > indentation.length) {
                                descriptionLines.push(nextLine);
                                j++;
                            } else {
                                break;
                            }
                        }

                        const description = descriptionLines.join('\n');

                        fileTasks.push({
                            id,
                            content,
                            completed,
                            filePath: fileItem.path,
                            tags: tags as string[],
                            completionDate,
                            description,
                            links
                        });
                        // Advance the main loop counter past the description lines
                        i = j - 1;
                    }
                }
                // Update cache
                fileCache.current.set(fileItem.path, { lastModified: fileItem.lastModified, tasks: fileTasks, content: fileItem.content });
                allTasks.push(...fileTasks);
            }
            if (cacheHitCount > 0) {
                console.log(`Cache hit for ${cacheHitCount} files`);
            }
            setTasks(allTasks);
        } catch (e) {
            console.error("Error scanning vault:", e);
        }
        setIsScanning(false);
    };

    // Auto-scan when root changes
    useEffect(() => {
        if (fs.rootHandle) {
            refreshTasks();
        }
    }, [fs.rootHandle]);

    const updateTaskDetails = async (taskId: string, updates: { content?: string, description?: string }) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task || !fs.rootHandle) return;

        // Optimistic update
        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                return { ...t, ...updates };
            }
            return t;
        }));

        // Also update activeTask in case it's selected
        if (activeTask && activeTask.id === taskId) {
            setActiveTask(prev => prev ? { ...prev, ...updates } : null);
        }

        try {
            const cleanPath = task.filePath.startsWith('/') ? task.filePath.substring(1) : task.filePath;
            const allFiles = await fs.getAllMarkdownFiles();
            const targetFile = allFiles.find(f => f.path.endsWith(cleanPath));

            if (!targetFile) {
                console.error("Could not find file handle for", task.filePath);
                return;
            }

            const lines = targetFile.content.split('\n');
            const lineIndex = parseInt(taskId.split(':').pop() || '0');

            if (lines[lineIndex] && lines[lineIndex].includes(task.content)) { // Loose check since content might have changed but not saved yet? No, task.content is old content
                // Actually, `updateTaskDetails` takes `updates`. `task` from state has old content if we haven't refreshed.

                let mainLine = lines[lineIndex];

                // 1. Update List Item Content
                if (updates.content !== undefined) {
                    // Replace text after "- [x] "
                    // Keep the toggle state
                    mainLine = mainLine.replace(/^(- \[[ xX]\]\s).*/, `$1${updates.content}`);
                }

                lines[lineIndex] = mainLine;

                // 2. Update Description
                // This is tricky because we need to replace a BLOCK of lines.
                // We need to re-scan to find where the description block currently ends
                if (updates.description !== undefined) {
                    // Find start of description (next line)
                    let j = lineIndex + 1;
                    let existingDescriptionLineCount = 0;

                    // Existing indentation logic to find end of current block
                    const match = mainLine.match(/^(\s*)-\s\[/);
                    const indentation = match ? match[1] : '';

                    while (j < lines.length) {
                        const nextLine = lines[j];
                        if (nextLine.trim() === '') {
                            existingDescriptionLineCount++; // assume empty lines part of block for now or just skip
                            j++;
                            continue;
                        }
                        const nextIndentMatch = nextLine.match(/^(\s*)/);
                        const nextIndent = nextIndentMatch ? nextIndentMatch[1] : '';

                        if (nextLine.match(/^\s*-\s\[/)) break;
                        if (nextIndent.length > indentation.length) {
                            existingDescriptionLineCount++;
                            j++;
                        } else {
                            break;
                        }
                    }

                    // Remove existing description lines
                    lines.splice(lineIndex + 1, existingDescriptionLineCount);

                    // Insert new description lines
                    if (updates.description.trim()) {
                        const newDescLines = updates.description.split('\n').map(l => {
                            // Ensure indentation. Add 2 spaces or tab based on parent. 
                            // Current simple logic: parent indent + 4 spaces
                            return `${indentation}    ${l}`;
                        });
                        lines.splice(lineIndex + 1, 0, ...newDescLines);
                    }
                }

                const newContent = lines.join('\n');
                await fs.writeFile(targetFile.handle, newContent);

                // Update cache
                if (fileCache.current.has(targetFile.path)) {
                    const cached = fileCache.current.get(targetFile.path)!;
                    fileCache.current.set(targetFile.path, { ...cached, content: newContent });
                }

            }
        } catch (err) {
            console.error("Failed to update task details:", err);
        }
    };

    const updateTaskStatus = async (taskId: string, newStatus: 'backlog' | 'doing' | 'qa' | 'done') => {
        const task = tasks.find(t => t.id === taskId);
        if (!task || !fs.rootHandle) return;

        const isCompleted = newStatus === 'done';

        // Optimistic UI Update needs to be smarter now
        // We need to update content to reflect tags
        setTasks(prev => prev.map(t => {
            if (t.id !== taskId) return t;

            // Logic to update tags in content for optimistic render
            let newContent = t.content;
            // Remove old status tags from string
            newContent = newContent.replace(/\s#doing/g, '').replace(/\s#qa/g, '');

            if (newStatus === 'doing') newContent += ' #doing';
            if (newStatus === 'qa') newContent += ' #qa';

            // IMPORTANT: Update the tags array so filters work immediately!
            const newTags = t.tags.filter(tag => tag !== '#doing' && tag !== '#qa');
            if (newStatus === 'doing') newTags.push('#doing');
            if (newStatus === 'qa') newTags.push('#qa');

            return { ...t, completed: isCompleted, content: newContent, tags: newTags };
        }));

        try {
            // 1. Get the file handle (we need to traverse path or flattened search)
            // Since we don't have the handle stored directly in Task (not serializable easily in context sometimes),
            // let's re-find it. We only have relative path.

            // Removing leading slash if present
            const cleanPath = task.filePath.startsWith('/') ? task.filePath.substring(1) : task.filePath;
            // This only works for root files for now unless we implement deep get. 
            // For MVP let's assume flat or implement simple deep get later.
            // Actually, let's just loop through all files again to find the handle - inefficient but safe.
            const allFiles = await fs.getAllMarkdownFiles();
            const targetFile = allFiles.find(f => f.path.endsWith(cleanPath));

            if (!targetFile) {
                console.error("Could not find file handle for", task.filePath);
                return;
            }

            // 2. Read content
            const lines = targetFile.content.split('\n');
            const lineIndex = parseInt(taskId.split(':').pop() || '0');

            // We rely on line number, but validation by content is good safety
            // Relaxed check: just check if it's a list item
            if (lines[lineIndex]) {
                let line = lines[lineIndex];

                // 1. Update Checkbox
                const boxChar = isCompleted ? 'x' : ' ';
                line = line.replace(/- \[[ xX]\]/, `- [${boxChar}]`);

                // 2. Update Tags
                // Remove existing status tags
                line = line.replace(/\s#doing/g, '').replace(/\s#qa/g, '');

                if (newStatus === 'doing') line += ' #doing';
                if (newStatus === 'qa') line += ' #qa';

                // 3. Update Date (Add if Done, Remove if not)
                // Remove existing date
                line = line.replace(/\s✅\s*\d{4}-\d{2}-\d{2}/g, '');

                if (isCompleted) {
                    const today = new Date().toISOString().split('T')[0];
                    line += ` ✅ ${today}`;
                }

                lines[lineIndex] = line;

                // Write back
                const newContent = lines.join('\n');
                await fs.writeFile(targetFile.handle, newContent);
                console.log("File updated successfully");

                // Update cache with new content to prevent stale reads
                // Recalculating tasks is complex here, but updating content key is safe
                if (fileCache.current.has(targetFile.path)) {
                    const cached = fileCache.current.get(targetFile.path)!;
                    // We should ideally re-parse or just update content. 
                    // For performance, let's just invalidate cache for this file or update content string
                    fileCache.current.set(targetFile.path, { ...cached, content: newContent });
                    // tasks inside cache might be stale now but refreshTasks is not called.
                    // It's inconsistent but better than broken content.
                }

            } else {
                console.warn("Line mismatch, skipping write to avoid corruption");
            }

        } catch (err) {
            console.error("Failed to write to file:", err);
        }
    };

    const addTask = async (content: string) => {
        if (!fs.rootHandle) {
            alert("Please open a vault first!");
            return;
        }

        const fileName = "Inbox.md";
        const taskLine = `- [ ] ${content}`;

        try {
            await fs.appendToFile(fileName, taskLine);

            // Re-scan to update UI gracefully (or optimistically add)
            await refreshTasks();
        } catch (err) {
            console.error("Failed to add task:", err);
            // Fallback optimistic
            const newTask: Task = {
                id: `temp-${Date.now()}`,
                content,
                completed: false,
                filePath: fileName,
                tags: []
            };
            setTasks(prev => [...prev, newTask]);
        }
    };

    const openLink = async (linkText: string) => {
        // 1. Search in cache keys
        let targetPath: string | undefined;

        for (const path of fileCache.current.keys()) {
            const fileName = path.split('/').pop()?.replace('.md', '');
            // Simple matching: exact match or case-insensitive? Obsidian is usually case-insensitive but exact on file system.
            // Let's stick to exact for now or permissive.
            if (fileName === linkText || fileName === linkText.replace('.md', '')) {
                targetPath = path;
                break;
            }
        }

        if (targetPath) {
            const cached = fileCache.current.get(targetPath);
            if (cached) {
                setViewingFile({
                    title: targetPath.split('/').pop() || 'Note',
                    content: cached.content
                });
                return;
            }
        }

        // 2. If not found, create it!
        // We assume linkText is just a filename like "New Note". 
        // We will create it at root for simplicity.
        // TODO: Support / in linkText for nested creation?
        if (messageUserForCreation(linkText)) {
            try {
                if (!fs.rootHandle) return;

                const fileName = linkText.endsWith('.md') ? linkText : `${linkText}.md`;
                // Create empty file
                const fileHandle = await fs.rootHandle.getFileHandle(fileName, { create: true });
                await fileHandle.getFile(); // Just to confirm creation? Or we can skip.
                const content = ""; // Empty content

                // Update cache immediately so we can view it
                // We construct a fake path. 
                // NOTE: useFileSystem scanDirectory uses `${path}/${entry.name}` which usually starts with / if path is empty string?
                // Let's check scanDirectory: scanDirectory(handle, path='') -> entries push `${path}/${entry.name}` -> `/Filename.md`
                const newPath = `/${fileName}`;

                fileCache.current.set(newPath, {
                    lastModified: Date.now(),
                    tasks: [],
                    content: content
                });

                // Refresh tasks in background to be safe, but open immediately
                void fs.getAllMarkdownFiles(); // Just trigger check? actually getAllMarkdownFiles returns promise, we can ignore it.

                setViewingFile({
                    title: fileName,
                    content: content
                });

            } catch (err) {
                console.error("Failed to create new note:", err);
            }
        }
    };

    const messageUserForCreation = (_: string) => true;

    const searchNotes = (query: string): string[] => {
        if (!query) return [];
        const matches: string[] = [];
        const lowerQuery = query.toLowerCase();

        for (const path of fileCache.current.keys()) {
            const fileName = path.split('/').pop()?.replace('.md', '') || '';
            if (fileName.toLowerCase().includes(lowerQuery)) {
                matches.push(fileName);
            }
        }
        return matches.slice(0, 10); // Limit results
    };

    return (
        <AppContext.Provider value={{
            rootHandle: fs.rootHandle,
            isScanning,
            needsPermission: fs.needsPermission,
            tasks,
            openDirectory: fs.openDirectory,
            refreshTasks,
            updateTaskStatus,
            addTask,
            viewingFile,
            setViewingFile,
            openLink,
            activeTask,
            setActiveTask,
            modalTask: activeTask,
            setModalTask: setActiveTask,
            updateTaskDetails,
            columns,
            setColumns,
            updateColumn,
            searchNotes,
            isAddTaskModalOpen,
            setAddTaskModalOpen,
            addTaskDefaultColumn,
            setAddTaskDefaultColumn
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
};
