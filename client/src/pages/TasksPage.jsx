import { useEffect, useState } from "react";
import { fetchTasks, addTask, deleteTask, editTask, reorderTasks, moveTask } from "../api/tasksApi";
import { Draggable, DragDropContext, Droppable } from "@hello-pangea/dnd";

const COLUMNS = [
    { id: "todo", label: "To Do", accent: "#378ADD", bg: "#E6F1FB", border: "#B5D4F4", count_color: "#185FA5" },
    { id: "in-progress", label: "In Progress", accent: "#BA7517", bg: "#FAEEDA", border: "#FAC775", count_color: "#854F0B" },
    { id: "done", label: "Done", accent: "#3B6D11", bg: "#EAF3DE", border: "#C0DD97", count_color: "#639922" },
];

function TasksPage({ token, logout }) {
    const [tasks, setTasks] = useState([]);
    const [text, setText] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");

    const loadTasks = async () => {
        try {
            const data = await fetchTasks(token);
            if (Array.isArray(data)) setTasks(data);
            else setTasks([]);
        } catch (err) {
            console.error("Load tasks failed:", err);
            setTasks([]);
        }
    };

    useEffect(() => { loadTasks(); }, []);

    const handleAdd = async () => {
        if (!text.trim()) return;
        try {
            const newTask = await addTask(text, token);
            setText("");
            setTasks(prev => [...prev, newTask]);
        } catch (err) { console.error("Add task failed:", err); }
    };

    const handleDelete = async (id) => {
        try {
            await deleteTask(id, token);
            setTasks(prev => prev.filter(t => t._id !== id));
        } catch (err) { console.error("Delete failed:", err); }
    };

    const handleEdit = async (id) => {
        try {
            await editTask(id, editText, token);
            setTasks(prev => prev.map(t => t._id === id ? { ...t, text: editText } : t));
            setEditingId(null);
            setEditText("");
        } catch (err) { console.error("Edit failed:", err); }
    };

    const handleDragEnd = async (result) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;
        const sourceCol = source.droppableId;
        const destCol = destination.droppableId;
        if (sourceCol === destCol && source.index === destination.index) return;

        setTasks(prev => {
            const updated = prev.map(t => t._id === draggableId ? { ...t, status: destCol } : t);
            const colTasks = updated.filter(t => t.status === destCol).sort((a, b) => a.order - b.order);
            const moving = colTasks.find(t => t._id === draggableId);
            const rest = colTasks.filter(t => t._id !== draggableId);
            rest.splice(destination.index, 0, moving);
            const reordered = rest.map((t, i) => ({ ...t, order: i }));
            return updated.map(t => { const r = reordered.find(r => r._id === t._id); return r ? r : t; });
        });

        if (sourceCol !== destCol) await moveTask(draggableId, destCol, token);
        const colTasks = tasks
            .filter(t => t.status === destCol || t._id === draggableId)
            .map(t => t._id === draggableId ? { ...t, status: destCol } : t)
            .filter(t => t.status === destCol);
        await reorderTasks(colTasks, token);
    };

    const styles = {
        page: {
            minHeight: "100vh",
            background: "var(--color-background-tertiary)",
            padding: "2rem",
            fontFamily: "var(--font-sans)",
        },
        header: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            maxWidth: "960px",
            margin: "0 auto 1.5rem",
        },
        title: {
            fontSize: "22px",
            fontWeight: "500",
            color: "var(--color-text-primary)",
            margin: 0,
        },
        logoutBtn: {
            background: "transparent",
            border: "0.5px solid var(--color-border-secondary)",
            borderRadius: "8px",
            padding: "6px 14px",
            fontSize: "13px",
            color: "var(--color-text-danger)",
            cursor: "pointer",
        },
        inputRow: {
            display: "flex",
            gap: "8px",
            maxWidth: "960px",
            margin: "0 auto 1.5rem",
        },
        input: {
            flex: 1,
            padding: "9px 14px",
            fontSize: "14px",
            border: "0.5px solid var(--color-border-secondary)",
            borderRadius: "10px",
            background: "var(--color-background-primary)",
            color: "var(--color-text-primary)",
            outline: "none",
        },
        addBtn: {
            padding: "9px 18px",
            background: "#185FA5",
            color: "#E6F1FB",
            border: "none",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
        },
        board: {
            display: "flex",
            gap: "16px",
            maxWidth: "960px",
            margin: "0 auto",
            alignItems: "flex-start",
        },
        column: (col) => ({
            flex: 1,
            background: col.bg,
            border: `0.5px solid ${col.border}`,
            borderRadius: "14px",
            padding: "14px",
            minWidth: 0,
        }),
        colHeader: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
        },
        colTitle: (col) => ({
            fontSize: "13px",
            fontWeight: "500",
            color: col.accent,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            margin: 0,
        }),
        colCount: (col) => ({
            fontSize: "12px",
            fontWeight: "500",
            color: col.count_color,
            background: col.border,
            borderRadius: "20px",
            padding: "2px 8px",
        }),
        dropZone: {
            minHeight: "80px",
        },
        card: {
            background: "var(--color-background-primary)",
            border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: "10px",
            padding: "12px",
            marginBottom: "8px",
            cursor: "grab",
        },
        cardText: (isDone) => ({
            fontSize: "14px",
            color: isDone ? "var(--color-text-tertiary)" : "var(--color-text-primary)",
            textDecoration: isDone ? "line-through" : "none",
            margin: "0 0 10px",
            lineHeight: "1.5",
        }),
        editInput: {
            width: "100%",
            padding: "6px 10px",
            fontSize: "14px",
            border: "0.5px solid var(--color-border-secondary)",
            borderRadius: "8px",
            background: "var(--color-background-secondary)",
            color: "var(--color-text-primary)",
            marginBottom: "10px",
            boxSizing: "border-box",
            outline: "none",
        },
        cardActions: {
            display: "flex",
            gap: "6px",
            justifyContent: "flex-end",
        },
        editBtn: {
            fontSize: "12px",
            padding: "3px 10px",
            border: "0.5px solid #FAC775",
            borderRadius: "6px",
            background: "transparent",
            color: "#854F0B",
            cursor: "pointer",
        },
        saveBtn: {
            fontSize: "12px",
            padding: "3px 10px",
            border: "0.5px solid #C0DD97",
            borderRadius: "6px",
            background: "transparent",
            color: "#3B6D11",
            cursor: "pointer",
        },
        deleteBtn: {
            fontSize: "12px",
            padding: "3px 10px",
            border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: "6px",
            background: "transparent",
            color: "var(--color-text-danger)",
            cursor: "pointer",
        },
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.title}>Task board</h1>
                <button style={styles.logoutBtn} onClick={logout}>Sign out</button>
            </div>

            <div style={styles.inputRow}>
                <input
                    style={styles.input}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    placeholder="Add a new task..."
                />
                <button style={styles.addBtn} onClick={handleAdd}>Add task</button>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <div style={styles.board}>
                    {COLUMNS.map(col => {
                        const colTasks = tasks
                            .filter(t => t.status === col.id)
                            .sort((a, b) => a.order - b.order);

                        return (
                            <div key={col.id} style={styles.column(col)}>
                                <div style={styles.colHeader}>
                                    <p style={styles.colTitle(col)}>{col.label}</p>
                                    <span style={styles.colCount(col)}>{colTasks.length}</span>
                                </div>

                                <Droppable droppableId={col.id}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            style={styles.dropZone}
                                        >
                                            {colTasks.map((task, index) => (
                                                <Draggable key={task._id} draggableId={task._id} index={index}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            style={{ ...styles.card, ...provided.draggableProps.style }}
                                                        >
                                                            {editingId === task._id ? (
                                                                <input
                                                                    style={styles.editInput}
                                                                    value={editText}
                                                                    onChange={(e) => setEditText(e.target.value)}
                                                                    onKeyDown={(e) => e.key === "Enter" && handleEdit(task._id)}
                                                                    autoFocus
                                                                />
                                                            ) : (
                                                                <p style={styles.cardText(task.status === "done")}>{task.text}</p>
                                                            )}

                                                            <div style={styles.cardActions}>
                                                                {editingId === task._id ? (
                                                                    <button style={styles.saveBtn} onClick={() => handleEdit(task._id)}>Save</button>
                                                                ) : (
                                                                    <button style={styles.editBtn} onClick={() => { setEditingId(task._id); setEditText(task.text); }}>Edit</button>
                                                                )}
                                                                <button style={styles.deleteBtn} onClick={() => handleDelete(task._id)}>Delete</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>
            </DragDropContext>
        </div>
    );
}

export default TasksPage;