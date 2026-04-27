import { useEffect, useState, useCallback, memo } from "react";
import { fetchTasks, addTask, deleteTask, editTask, reorderTasks, moveTask } from "../api/tasksApi";
import { Draggable, DragDropContext, Droppable } from "@hello-pangea/dnd";

const COLUMNS = [
    { id: "todo", label: "To do", dot: "#378ADD", bg: "#E6F1FB", border: "#85B7EB", pill: "#B5D4F4", pillText: "#0C447C" },
    { id: "in-progress", label: "In progress", dot: "#BA7517", bg: "#FAEEDA", border: "#EF9F27", pill: "#FAC775", pillText: "#633806" },
    { id: "done", label: "Done", dot: "#3B6D11", bg: "#EAF3DE", border: "#97C459", pill: "#C0DD97", pillText: "#27500A" },
];

const globalCSS = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .task-card {
    background: var(--color-background-primary);
    border: 0.5px solid var(--color-border-tertiary);
    border-radius: 12px;
    padding: 12px 14px;
    margin-bottom: 8px;
    cursor: grab;
    transition: border-color 0.15s ease, transform 0.15s ease;
    animation: slideIn 0.18s ease both;
  }
  .task-card:hover { border-color: var(--color-border-secondary); transform: translateY(-1px); }
  .task-card:active { transform: scale(0.99); }
  .action-btn {
    font-size: 12px;
    padding: 3px 10px;
    border-radius: 6px;
    border: 0.5px solid var(--color-border-tertiary);
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease, transform 0.1s ease;
  }
  .action-btn:hover { background: var(--color-background-secondary); color: var(--color-text-primary); border-color: var(--color-border-secondary); }
  .action-btn:active { transform: scale(0.96); }
  .action-btn.save { color: #3B6D11; border-color: #97C459; }
  .action-btn.save:hover { background: #EAF3DE; }
  .action-btn.delete { color: var(--color-text-danger); border-color: var(--color-border-danger); }
  .action-btn.delete:hover { background: var(--color-background-danger); }
  .add-btn {
    padding: 9px 18px;
    background: #185FA5;
    color: #E6F1FB;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.1s ease;
    white-space: nowrap;
  }
  .add-btn:hover { background: #0C447C; }
  .add-btn:active { transform: scale(0.97); }
  .add-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .logout-btn {
    background: transparent;
    border: 0.5px solid var(--color-border-secondary);
    border-radius: 8px;
    padding: 6px 14px;
    font-size: 13px;
    color: var(--color-text-danger);
    cursor: pointer;
    transition: background 0.12s ease, transform 0.1s ease;
  }
  .logout-btn:hover { background: var(--color-background-danger); }
  .logout-btn:active { transform: scale(0.97); }
  .task-input {
    flex: 1;
    padding: 9px 14px;
    font-size: 14px;
    border: 0.5px solid var(--color-border-secondary);
    border-radius: 10px;
    background: var(--color-background-primary);
    color: var(--color-text-primary);
    outline: none;
    transition: border-color 0.15s ease;
  }
  .task-input:focus { border-color: #378ADD; }
  .edit-input {
    width: 100%;
    padding: 6px 10px;
    font-size: 14px;
    border: 0.5px solid #378ADD;
    border-radius: 8px;
    background: var(--color-background-secondary);
    color: var(--color-text-primary);
    margin-bottom: 10px;
    box-sizing: border-box;
    outline: none;
    animation: fadeIn 0.12s ease both;
  }
  .done-text {
    text-decoration: line-through;
    color: var(--color-text-tertiary);
  }
`;

// ✅ Memoized card — only re-renders when its own data changes
const TaskCard = memo(({ task, editingId, editText, onEdit, onSave, onDelete, onEditChange }) => {
    const isEditing = editingId === task._id;
    return (
        <div className="task-card">
            {isEditing ? (
                <input
                    className="edit-input"
                    value={editText}
                    onChange={(e) => onEditChange(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onSave(task._id)}
                    autoFocus
                />
            ) : (
                <p
                    className={task.status === "done" ? "done-text" : ""}
                    style={{
                        fontSize: "14px",
                        margin: "0 0 10px",
                        lineHeight: "1.5",
                        color: task.status === "done" ? undefined : "var(--color-text-primary)",
                    }}
                >
                    {task.text}
                </p>
            )}
            <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                {isEditing ? (
                    <button className="action-btn save" onClick={() => onSave(task._id)}>Save</button>
                ) : (
                    <button className="action-btn" onClick={() => onEdit(task._id, task.text)}>Edit</button>
                )}
                <button className="action-btn delete" onClick={() => onDelete(task._id)}>Delete</button>
            </div>
        </div>
    );
});

// ✅ Memoized column — only re-renders when its tasks change
const Column = memo(({ col, colTasks, editingId, editText, onEdit, onSave, onDelete, onEditChange }) => (
    <div style={{
        flex: 1,
        background: col.bg,
        border: `0.5px solid ${col.border}`,
        borderRadius: "14px",
        padding: "14px",
        minWidth: 0,
    }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: col.dot, display: "inline-block", flexShrink: 0 }} />
                <span style={{ fontSize: "12px", fontWeight: "500", color: col.pillText, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {col.label}
                </span>
            </div>
            <span style={{ fontSize: "12px", fontWeight: "500", background: col.pill, color: col.pillText, borderRadius: "20px", padding: "2px 8px" }}>
                {colTasks.length}
            </span>
        </div>

        <Droppable droppableId={col.id}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                        minHeight: "60px",
                        borderRadius: "8px",
                        padding: "2px",
                        transition: "background 0.15s ease",
                        background: snapshot.isDraggingOver ? "rgba(55,138,221,0.05)" : "transparent",
                    }}
                >
                    {colTasks.map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{
                                        ...provided.draggableProps.style,
                                        opacity: snapshot.isDragging ? 0.88 : 1,
                                    }}
                                >
                                    <TaskCard
                                        task={task}
                                        editingId={editingId}
                                        editText={editText}
                                        onEdit={onEdit}
                                        onSave={onSave}
                                        onDelete={onDelete}
                                        onEditChange={onEditChange}
                                    />
                                </div>
                            )}
                        </Draggable>
                    ))}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    </div>
));

export default function TasksPage({ token, logout }) {
    const [tasks, setTasks] = useState([]);
    const [text, setText] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");
    const [adding, setAdding] = useState(false);

    const loadTasks = useCallback(async () => {
        try {
            const data = await fetchTasks(token);
            if (Array.isArray(data)) setTasks(data);
            else setTasks([]);
        } catch (err) {
            console.error("Load tasks failed:", err);
        }
    }, [token]);

    useEffect(() => { loadTasks(); }, [loadTasks]);

    const handleAdd = useCallback(async () => {
        if (!text.trim() || adding) return;
        setAdding(true);
        try {
            const newTask = await addTask(text, token);
            setText("");
            setTasks(prev => [...prev, newTask]);
        } catch (err) {
            console.error("Add task failed:", err);
        } finally {
            setAdding(false);
        }
    }, [text, token, adding]);

    const handleDelete = useCallback(async (id) => {
        setTasks(prev => prev.filter(t => t._id !== id));
        try {
            await deleteTask(id, token);
        } catch (err) {
            console.error("Delete failed:", err);
            loadTasks();
        }
    }, [token, loadTasks]);

    const handleEditStart = useCallback((id, currentText) => {
        setEditingId(id);
        setEditText(currentText);
    }, []);

    const handleEditSave = useCallback(async (id) => {
        const savedText = editText;
        setTasks(prev => prev.map(t => t._id === id ? { ...t, text: savedText } : t));
        setEditingId(null);
        setEditText("");
        try {
            await editTask(id, savedText, token);
        } catch (err) {
            console.error("Edit failed:", err);
            loadTasks();
        }
    }, [editText, token, loadTasks]);

    const handleEditChange = useCallback((val) => {
        setEditText(val);
    }, []);

    const handleDragEnd = useCallback((result) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;

        const sourceCol = source.droppableId;
        const destCol = destination.droppableId;
        if (sourceCol === destCol && source.index === destination.index) return;

        setTasks(prev => {
            const updated = prev.map(t =>
                t._id === draggableId ? { ...t, status: destCol } : t
            );
            const colTasks = updated
                .filter(t => t.status === destCol)
                .sort((a, b) => a.order - b.order);

            const moving = colTasks.find(t => t._id === draggableId);
            const rest = colTasks.filter(t => t._id !== draggableId);
            rest.splice(destination.index, 0, moving);
            const reordered = rest.map((t, i) => ({ ...t, order: i }));

            // Fire API without blocking
            if (sourceCol !== destCol) {
                moveTask(draggableId, destCol, token).catch(console.error);
            }
            reorderTasks(reordered, token).catch(console.error);

            return updated.map(t => {
                const r = reordered.find(r => r._id === t._id);
                return r ? r : t;
            });
        });
    }, [token]);

    return (
        <>
            <style>{globalCSS}</style>
            <div style={{ minHeight: "100vh", background: "var(--color-background-tertiary)", padding: "2rem", fontFamily: "var(--font-sans)" }}>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "980px", margin: "0 auto 1.5rem", background: "#185FA5", borderRadius: "14px", padding: "16px 24px" }}>
                    <div>
                        <h1 style={{ fontSize: "22px", fontWeight: "500", color: "E6F1FB", margin: "0 0 2px" }}>Task board</h1>
                        <p style={{ fontSize: "13px", color: "#85B7EB", margin: 0 }}>
                            {tasks.length} task{tasks.length !== 1 ? "s" : ""} total
                        </p>
                    </div>
                    <button className="logout-btn" onClick={logout} style={{ color: "#E6F1FB", borderColor: "rgba(255,255,255,0.3)", fontSize:"22px", fontWeight: "500" }}>Sign out</button>
                </div>

                <div style={{ display: "flex", gap: "8px", maxWidth: "980px", margin: "0 auto 1.5rem" }}>
                    <input
                        className="task-input"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                        placeholder="What needs to be done?"
                    />
                    <button className="add-btn" onClick={handleAdd} disabled={adding}>
                        {adding ? "Adding..." : "Add task"}
                    </button>
                </div>

                <DragDropContext onDragEnd={handleDragEnd}>
                    <div style={{ display: "flex", gap: "14px", maxWidth: "980px", margin: "0 auto", alignItems: "flex-start" }}>
                        {COLUMNS.map(col => {
                            const colTasks = tasks
                                .filter(t => t.status === col.id)
                                .sort((a, b) => a.order - b.order);
                            return (
                                <Column
                                    key={col.id}
                                    col={col}
                                    colTasks={colTasks}
                                    editingId={editingId}
                                    editText={editText}
                                    onEdit={handleEditStart}
                                    onSave={handleEditSave}
                                    onDelete={handleDelete}
                                    onEditChange={handleEditChange}
                                />
                            );
                        })}
                    </div>
                </DragDropContext>
            </div>
        </>
    );
}