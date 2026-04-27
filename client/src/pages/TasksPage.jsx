import { useEffect, useState } from "react";
import { fetchTasks, addTask, deleteTask, toggleTask, editTask, reorderTasks, moveTask } from "../api/tasksApi";
import { Draggable, DragDropContext, Droppable } from "@hello-pangea/dnd";

const COLUMNS = [
    { id: "todo", label: "📋 To Do", color: "bg-blue-50 border-blue-200" },
    { id: "in-progress", label: "⚙️ In Progress", color: "bg-yellow-50 border-yellow-200" },
    { id: "done", label: "✅ Done", color: "bg-green-50 border-green-200" },
];

function TasksPage({ token, logout }) {
    const [tasks, setTasks] = useState([]);
    const [text, setText] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");

    const loadTasks = async () => {
        try {
            const data = await fetchTasks(token);
            if (Array.isArray(data)) {
                setTasks(data);
            } else {
                setTasks([]);
            }
        } catch (err) {
            console.error("Load tasks failed:", err);
            setTasks([]);
        }
    };

    useEffect(() => {
        loadTasks();
    }, []);

    const handleAdd = async () => {
        if (!text.trim()) return;
        try {
            const newTask = await addTask(text, token);
            setText("");
            setTasks(prev => [...prev, newTask]);
        } catch (err) {
            console.error("Add task failed:", err);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteTask(id, token);
            setTasks(prev => prev.filter(task => task._id !== id));
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    const handleEdit = async (id) => {
        try {
            await editTask(id, editText, token);
            setTasks(prev =>
                prev.map(task =>
                    task._id === id ? { ...task, text: editText } : task
                )
            );
            setEditingId(null);
            setEditText("");
        } catch (err) {
            console.error("Edit failed:", err);
        }
    };

    const handleDragEnd = async (result) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;

        const sourceCol = source.droppableId;
        const destCol = destination.droppableId;

        if (sourceCol === destCol && source.index === destination.index) return;

        // Optimistic UI update
        setTasks(prev => {
            const updated = prev.map(task =>
                task._id === draggableId ? { ...task, status: destCol } : task
            );

            // Reorder within same column
            const colTasks = updated
                .filter(t => t.status === destCol)
                .sort((a, b) => a.order - b.order);

            const moving = colTasks.find(t => t._id === draggableId);
            const rest = colTasks.filter(t => t._id !== draggableId);
            rest.splice(destination.index, 0, moving);

            const reordered = rest.map((t, i) => ({ ...t, order: i }));

            return updated.map(task => {
                const r = reordered.find(r => r._id === task._id);
                return r ? r : task;
            });
        });

        // Save to DB
        if (sourceCol !== destCol) {
            await moveTask(draggableId, destCol, token);
        }

        const colTasks = tasks
            .filter(t => t.status === destCol || t._id === draggableId)
            .map(t => t._id === draggableId ? { ...t, status: destCol } : t)
            .filter(t => t.status === destCol);

        await reorderTasks(colTasks, token);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6 max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold">Task Manager</h1>
                <button
                    onClick={logout}
                    className="bg-red-500 text-white px-4 py-1 rounded-lg hover:bg-red-600"
                >
                    Logout
                </button>
            </div>

            {/* INPUT */}
            <div className="flex mb-6 gap-2 max-w-5xl mx-auto">
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Add a new task..."
                />
                <button
                    onClick={handleAdd}
                    className="bg-blue-500 text-white px-4 rounded-lg hover:bg-blue-600"
                >
                    Add
                </button>
            </div>

            {/* KANBAN BOARD */}
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex gap-4 max-w-5xl mx-auto items-start">
                    {COLUMNS.map(col => {
                        const colTasks = tasks
                            .filter(t => t.status === col.id)
                            .sort((a, b) => a.order - b.order);

                        return (
                            <div key={col.id} className={`flex-1 border-2 rounded-xl p-3 ${col.color}`}>
                                <h2 className="font-bold text-lg mb-3">{col.label} <span className="text-sm font-normal text-gray-500">({colTasks.length})</span></h2>

                                <Droppable droppableId={col.id}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className="min-h-24 space-y-2"
                                        >
                                            {colTasks.map((task, index) => (
                                                <Draggable key={task._id} draggableId={task._id} index={index}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="bg-white p-3 rounded-lg shadow text-sm"
                                                        >
                                                            {/* TASK TEXT / EDIT INPUT */}
                                                            {editingId === task._id ? (
                                                                <input
                                                                    value={editText}
                                                                    onChange={(e) => setEditText(e.target.value)}
                                                                    className="w-full p-1 border rounded mb-2"
                                                                    autoFocus
                                                                />
                                                            ) : (
                                                                <p className={`mb-2 ${task.status === "done" ? "line-through text-gray-400" : ""}`}>
                                                                    {task.text}
                                                                </p>
                                                            )}

                                                            {/* BUTTONS */}
                                                            <div className="flex gap-2 justify-end">
                                                                {editingId === task._id ? (
                                                                    <button
                                                                        onClick={() => handleEdit(task._id)}
                                                                        className="text-green-500 text-xs"
                                                                    >
                                                                        Save
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingId(task._id);
                                                                            setEditText(task.text);
                                                                        }}
                                                                        className="text-yellow-500 text-xs"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDelete(task._id)}
                                                                    className="text-red-500 text-xs"
                                                                >
                                                                    ❌
                                                                </button>
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