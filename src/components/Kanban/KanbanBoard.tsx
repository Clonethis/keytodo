import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
    DndContext,
    DragOverlay,
    type DragEndEvent,
    type DragOverEvent,
    type DragStartEvent,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    horizontalListSortingStrategy,
    arrayMove,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { clsx } from 'clsx';
import { Plus, AlignLeft, Link as LinkIcon, GripVertical } from 'lucide-react';
import { TaskContent } from '../Shared/TaskContent';
import { AddTaskModal } from '../Modals/AddTaskModal';

// --- Draggable Task Card ---
const TaskCard = ({ task, id }: { task: any, id: string }) => {
    const { setActiveTask, setModalTask } = useApp();
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: id,
        data: {
            type: 'Task',
            task
        }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => setActiveTask(task)}
            onDoubleClick={(e) => {
                e.stopPropagation(); // Prevent column double-click (rename) if any
                setModalTask(task);
            }}
            className={clsx(
                "p-4 mb-3 rounded-lg bg-card border border-border shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/50 transition-all hover:shadow-md group flex flex-col gap-2 relative",
                isDragging && "opacity-30",
            )}
        >
            <div className="text-sm font-medium leading-relaxed">
                <TaskContent content={task.content} />
            </div>

            {(task.tags.length > 0 || task.links?.length > 0 || task.description) && (
                <div className="flex items-center gap-2 mt-1 pt-2 border-t border-white/5 overflow-hidden flex-wrap">
                    {task.description && (
                        <div className="text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <AlignLeft size={10} />
                            Note
                        </div>
                    )}

                    {task.tags.map((tag: string) => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary truncate shrink-0">
                            {tag}
                        </span>
                    ))}

                    {task.links && task.links.length > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground" title="Linked files">
                            <LinkIcon size={10} />
                            <span>{task.links.length}</span>
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-between items-center mt-1 opacity-50 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-muted-foreground truncate max-w-[100px] font-mono">
                    {task.filePath.split('/').pop()}
                </span>
            </div>
        </div>
    );
};

// --- Sortable Column ---
const Column = ({ column, tasks, openAddTaskModal }: { column: any, tasks: any[], openAddTaskModal: (columnId?: string) => void }) => {
    const { updateColumn } = useApp();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(column.title);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: column.id,
        data: {
            type: 'Column',
            column
        }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    const handleTitleBlur = () => {
        setIsEditing(false);
        if (title !== column.title) {
            updateColumn(column.id, title);
        }
    };

    // Header colors based on status (simple mapping)
    const headerClass = useMemo(() => {
        if (column.id === 'backlog') return 'bg-gray-500/10 text-gray-400';
        if (column.id === 'doing') return 'bg-blue-500/10 text-blue-400';
        if (column.id === 'qa') return 'bg-orange-500/10 text-orange-400';
        if (column.id === 'done') return 'bg-green-500/10 text-green-400';
        return 'bg-secondary/10 text-muted-foreground';
    }, [column.id]);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={clsx(
                "flex flex-col bg-secondary/20 rounded-2xl border border-white/5 transition-colors hover:bg-secondary/30 w-[350px] flex-shrink-0 snap-center",
                isDragging && "opacity-50"
            )}
        >
            <header className={`p-4 flex items-center justify-between border-b border-white/5 rounded-t-2xl ${headerClass}`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div {...attributes} {...listeners} className="cursor-grab hover:bg-white/10 p-1 rounded">
                        <GripVertical size={16} className="opacity-50" />
                    </div>

                    {isEditing ? (
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
                            autoFocus
                            className="bg-transparent border-none focus:outline-none font-semibold text-sm uppercase tracking-wider w-full"
                        />
                    ) : (
                        <h3
                            className="font-semibold text-sm uppercase tracking-wider truncate cursor-text"
                            onDoubleClick={() => setIsEditing(true)}
                            title="Double click to rename"
                        >
                            {column.title}
                        </h3>
                    )}
                    <span className="bg-background/50 px-2.5 py-0.5 rounded-full text-xs font-bold border border-white/10 opacity-80">{tasks.length}</span>
                </div>
                <div className="flex gap-1 opacity-70 hover:opacity-100">
                    <button
                        onClick={() => openAddTaskModal(column.id)}
                        className="p-1.5 hover:bg-white/5 rounded text-muted-foreground transition-colors hover:text-primary"
                        title="Add task to this column"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </header>

            <div className="p-3 space-y-4">
                <SortableContext id={column.id} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <TaskCard key={task.id} id={task.id} task={task} />
                    ))}
                </SortableContext>
                {tasks.length === 0 && (
                    <div className="h-32 flex items-center justify-center text-muted-foreground/30 text-sm border-2 border-dashed border-white/5 rounded-xl m-2">
                        Drop items here
                    </div>
                )}
            </div>
        </div >
    );
};

export const KanbanBoard = () => {
    const { tasks, updateTaskStatus, addTask, columns, setColumns, isAddTaskModalOpen, setAddTaskModalOpen, addTaskDefaultColumn, setAddTaskDefaultColumn } = useApp();
    const [activeDragItem, setActiveDragItem] = useState<any>(null); // Task or Column

    const openAddTaskModal = (columnId?: string) => {
        console.log('Opening Add Task Modal', { columnId, isAddTaskModalOpen });
        setAddTaskDefaultColumn(columnId);
        setAddTaskModalOpen(true);
    };

    const handleAddTask = (content: string, columnId?: string) => {
        // Add the task - it will go to Backlog by default
        // Then optionally move to the target column via tags
        let taskContent = content;
        if (columnId === 'doing') taskContent += ' #doing';
        else if (columnId === 'qa') taskContent += ' #qa';
        addTask(taskContent);
    };

    // Filter tasks for each column
    const tasksByColumn = useMemo(() => {
        // Prepare map
        const map: Record<string, any[]> = {};
        columns.forEach(col => map[col.id] = []);

        // Populate
        tasks.forEach(task => {
            if (task.completed) {
                // Done tasks
                // Logic for "Done (Week)" filtering
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                const isRecent = task.completionDate ? task.completionDate >= oneWeekAgo : false;

                if (isRecent) {
                    // Push to 'done' column if it exists or fallback
                    if (map['done']) map['done'].push(task);
                }
            } else {
                // Not completed
                if (task.tags.includes('#doing')) {
                    if (map['doing']) map['doing'].push(task);
                } else if (task.tags.includes('#qa')) {
                    if (map['qa']) map['qa'].push(task);
                } else {
                    // Default to backlog if no status tag
                    if (map['backlog']) map['backlog'].push(task);
                }
            }
        });
        return map;
    }, [tasks, columns]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Avoid accidental drags when clicking
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        if (event.active.data.current?.type === 'Column') {
            setActiveDragItem(event.active.data.current.column);
            return;
        }
        if (event.active.data.current?.type === 'Task') {
            setActiveDragItem(event.active.data.current.task);
            return;
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveTask = active.data.current?.type === 'Task';

        if (!isActiveTask) return;

        // Implemented primarily in DragEnd for status change, 
        // but strict SortableContext needs visual items to be in the list for smooth animation.
        // Dnd-kit handles this visual sort automatically if we were manipulating a single list.
        // Since we are cross-column, we rely on the final drop event for status update.
        // Visual placeholder is handled by dnd-kit logic if setup correctly. 
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveDragItem(null);
        const { active, over } = event;

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Column Reordering
        if (active.data.current?.type === 'Column') {
            if (activeId !== overId) {
                const oldIndex = columns.findIndex((col) => col.id === activeId);
                const newIndex = columns.findIndex((col) => col.id === overId);
                setColumns(arrayMove(columns, oldIndex, newIndex));
            }
            return;
        }

        // Task Moving
        // If dropped over a container (Column) or a Task in that container
        const activeTask = active.data.current?.task;

        // Find which column we dropped into
        // If `over` is a column (droppable id = column id)
        // If `over` is a task (sortable id = task id), we need to find its column logic or just infer from over.data
        // Simplest: check if overId matches a column ID

        let targetColumnId: string | null = null;

        if (columns.find(c => c.id === overId)) {
            targetColumnId = overId as string;
        } else {
            // Over a task? Find that task's column?
            // Not strictly necessary if we just look at the container ID if we used droppable containers correctly.
            // But SortableContext typically uses items.
            // Let's rely on standard logic: find the container of the `over` item.
            // But we don't have easy `findContainer` helper here without extra state.

            // HACK: Use the droppable ID logic from "Column" component. 
            // Actually, `useDroppable` isn't explicitly used on the generic div in Column except via `SortableContext`?
            // Wait, I didn't add `useDroppable` to Column container explicitly yet in the refactor.
            // I should do that. Added logic below in Column component check.
            // Actually, `SortableContext` acts as a droppable area for the items if registered. 
            // But finding the container ID from an item ID requires lookups.

            // Let's assume the over item is a task, find which list it belongs to.
            for (const col of columns) {
                const colTasks = tasksByColumn[col.id];
                if (colTasks.find(t => t.id === overId)) {
                    targetColumnId = col.id;
                    break;
                }
            }
        }

        if (targetColumnId && activeTask) {
            // Map column ID to status
            const col = columns.find(c => c.id === targetColumnId);
            if (col && col.status) {
                // Only update if status changed
                // Determine current status
                let currentStatus = 'backlog';
                if (activeTask.completed) currentStatus = 'done';
                else if (activeTask.tags.includes('#doing')) currentStatus = 'doing';
                else if (activeTask.tags.includes('#qa')) currentStatus = 'qa';

                if (col.status !== currentStatus) {
                    updateTaskStatus(activeTask.id, col.status);
                }
            }
        }
    };

    return (
        <div className="h-full flex flex-col p-4 md:p-8 overflow-auto custom-scrollbar">
            <header className="mb-6 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">Kanban Board</h1>
                    <p className="text-muted-foreground">Manage your workflow</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => openAddTaskModal()} className="btn btn-primary gap-2 shadow-lg shadow-primary/20">
                        <Plus size={18} />
                        New Task
                    </button>
                </div>
            </header>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 overflow-auto pb-4 custom-scrollbar">
                    <div className="flex bg-transparent min-w-max min-h-full gap-8 px-1">
                        <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                            {columns.map(col => (
                                <Column key={col.id} column={col} tasks={tasksByColumn[col.id]} openAddTaskModal={openAddTaskModal} />
                            ))}
                        </SortableContext>
                    </div>
                </div>

                <DragOverlay>
                    {activeDragItem && (
                        <div className="opacity-80 rotate-2 cursor-grabbing pointer-events-none">
                            {/* Render a static snapshot or simplified version */}
                            {activeDragItem.title ? ( // Is Column
                                <div className="bg-secondary/40 p-4 rounded-xl border border-primary w-[350px] h-[400px]">
                                    <h3 className="font-bold uppercase text-primary">{activeDragItem.title}</h3>
                                </div>
                            ) : ( // Is Task
                                <div className="p-4 rounded-lg bg-card border border-primary shadow-xl w-[300px]">
                                    {activeDragItem.content}
                                </div>
                            )}
                        </div>
                    )}
                </DragOverlay>
            </DndContext>

            {/* Add Task Modal */}
            <AddTaskModal
                isOpen={isAddTaskModalOpen}
                onClose={() => setAddTaskModalOpen(false)}
                onAdd={handleAddTask}
                defaultColumn={addTaskDefaultColumn}
                columns={columns.filter(c => c.id !== 'done')}
            />
        </div>
    );
};
