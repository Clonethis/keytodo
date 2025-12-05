import { useState, useCallback, useEffect } from 'react';
import { get, set } from 'idb-keyval';

export interface FileNode {
    name: string;
    kind: 'file' | 'directory';
    handle: AnyFileSystemHandle;
    path: string; // Relative path for ID
}

// Type definitions for File System Access API (partial)
type AnyFileSystemHandle = FileSystemFileHandle | FileSystemDirectoryHandle;

export const useFileSystem = () => {
    const [rootHandle, setRootHandle] = useState<FileSystemDirectoryHandle | null>(null);
    const [files, setFiles] = useState<FileNode[]>([]);
    const [needsPermission, setNeedsPermission] = useState(false);
    const [permissionError, setPermissionError] = useState<string | null>(null);

    // Initialize from IndexedDB
    useEffect(() => {
        const init = async () => {
            const handle = await get<FileSystemDirectoryHandle>('vaultHandle');
            if (handle) {
                setRootHandle(handle); // Set it optimistically so UI knows we *have* a vault

                // We have a stored handle. We must verify permission before using it.
                // The user will be prompted by the browser if permission isn't granted.
                const hasPermission = await verifyPermission(handle, false); // Check read only first
                if (hasPermission) {
                    await scanDirectory(handle);
                } else {
                    // We need user gesture to re-request
                    setNeedsPermission(true);
                }
            }
        };
        init();
    }, []);

    const verifyPermission = async (fileHandle: FileSystemDirectoryHandle | FileSystemFileHandle, withWrite: boolean) => {
        const opts = { mode: withWrite ? 'readwrite' : 'read' };
        // @ts-ignore
        if ((await fileHandle.queryPermission(opts)) === 'granted') {
            return true;
        }
        // @ts-ignore
        if ((await fileHandle.requestPermission(opts)) === 'granted') {
            return true;
        }
        return false;
    };

    const openDirectory = useCallback(async () => {
        try {
            // @ts-ignore - showDirectoryPicker is experimental in some environments
            const handle = await window.showDirectoryPicker({
                mode: 'readwrite'
            });
            setRootHandle(handle);
            setPermissionError(null);

            // Persist handle
            await set('vaultHandle', handle);

            await scanDirectory(handle);
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('Error opening directory:', err);
                setPermissionError('Could not open directory. Feature may not be supported or permission denied.');
            }
        }
    }, []);

    const scanDirectory = async (dirHandle: FileSystemDirectoryHandle, path = '') => {
        const entries: FileNode[] = [];

        // @ts-ignore
        for await (const entry of dirHandle.values()) {
            // Skip hidden files/folders (rudimentary check)
            if (entry.name.startsWith('.')) continue;

            entries.push({
                name: entry.name,
                kind: entry.kind,
                handle: entry,
                path: `${path}/${entry.name}`
            });
        }
        setFiles(entries);
    };

    /**
     * Helper to deeply find all markdown files.
     * NOTE: Large vaults might be slow to scan fully upfront.
     */
    const getAllMarkdownFiles = useCallback(async () => {
        // If we don't have a root handle, try to fetch from IDB just in case? 
        // No, state should handle it. 
        if (!rootHandle) return [];

        const mdFiles: { path: string, content: string, handle: FileSystemFileHandle, lastModified: number }[] = [];

        const traverse = async (dir: FileSystemDirectoryHandle, currentPath: string) => {
            // @ts-ignore
            for await (const entry of dir.values()) {
                if (entry.name.startsWith('.')) continue; // skip .git, .obsidian

                if (entry.kind === 'file' && entry.name.endsWith('.md')) {
                    const file = await (entry as FileSystemFileHandle).getFile();
                    const content = await file.text();
                    mdFiles.push({
                        path: `${currentPath}/${entry.name}`,
                        content,
                        handle: entry as FileSystemFileHandle,
                        lastModified: file.lastModified
                    });
                } else if (entry.kind === 'directory') {
                    await traverse(entry as FileSystemDirectoryHandle, `${currentPath}/${entry.name}`);
                }
            }
        };

        await traverse(rootHandle, '');
        return mdFiles;
    }, [rootHandle]);

    /**
     * Writes content to a file, replacing it entirely.
     */
    const writeFile = useCallback(async (fileHandle: FileSystemFileHandle, content: string) => {
        // @ts-ignore
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
    }, []);

    /**
     * Appends a line to a file (creates if not exists).
     */
    const appendToFile = useCallback(async (fileName: string, content: string) => {
        if (!rootHandle) throw new Error("No vault open");

        let fileHandle: FileSystemFileHandle;
        try {
            // Try to get existing file
            fileHandle = await rootHandle.getFileHandle(fileName, { create: false });
        } catch {
            // Create if not exists
            fileHandle = await rootHandle.getFileHandle(fileName, { create: true });
        }

        const file = await fileHandle.getFile();
        const oldContent = await file.text();
        const newContent = oldContent.endsWith('\n') || oldContent.length === 0
            ? `${oldContent}${content}\n`
            : `${oldContent}\n${content}\n`;

        await writeFile(fileHandle, newContent);
        return fileHandle; // Return handle so we can use it
    }, [rootHandle, writeFile]);

    return {
        rootHandle,
        files,
        openDirectory,
        getAllMarkdownFiles,
        writeFile,
        appendToFile,
        permissionError,
        needsPermission
    };
};
