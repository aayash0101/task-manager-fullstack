import { useEffect, useState } from "react";
import { fetchTasks, addTask, deleteTask, toggleTask, editTask, reorderTasks } from "../api/tasksApi";
import { Draggable, DragDropContext, Droppable } from "@hello-pangea/dnd";

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

    const handleToggle = async (id) => {
        try {
            await toggleTask(id, token);
            setTasks(prev =>
                prev.map(task =>
                    task._id === id
                        ? { ...task, completed: !task.completed }
                        : task
                )
            );
        } catch (err) {
            console.error("Toggle failed:", err);
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
                    task._id === id
                        ? { ...task, text: editText }
                        : task
                )
            );
            setEditingId(null);
            setEditText("");
        } catch (err) {
            console.error("Edit failed:", err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex justify-center">
            <div className="w-full max-w-xl p-6">

                {/* HEADER */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Task Manager</h1>
                    <button
                        onClick={logout}
                        className="bg-red-500 text-white px-4 py-1 rounded-lg hover:bg-red-600"
                    >
                        Logout
                    </button>
                </div>

                {/* INPUT */}
                <div className="flex mb-4 gap-2">
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
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

                {/* TASK LIST */}
                <DragDropContext
                    onDragEnd={async (result) => {
                        if (!result.destination) return;

                        const items = Array.from(tasks);
                        const [moved] = items.splice(result.source.index, 1);
                        items.splice(result.destination.index, 0, moved);

                        setTasks(items); // instant UI update

                        await reorderTasks(items, token); // save to DB
                    }}
                >
                    <Droppable droppableId="tasks">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                                {tasks.map((task, index) => (
                                    <Draggable key={task._id} draggableId={task._id} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className="bg-white p-3 rounded-xl shadow mb-2 flex justify-between items-center"
                                            >
                                                <span
                                                    className={task.completed ? "line-through text-gray-400" : ""}
                                                >
                                                    {task.text}
                                                </span>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={async () => {
                                                            await toggleTask(task._id, token);
                                                            loadTasks();
                                                        }}
                                                        className="text-blue-500"
                                                    >
                                                        {task.completed ? "Undo" : "Done"}
                                                    </button>

                                                    <button
                                                        onClick={async () => {
                                                            await deleteTask(task._id, token);
                                                            loadTasks();
                                                        }}
                                                        className="text-red-500"
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
                </DragDropContext>
            </div>
        </div>
    );
}

export default TasksPage;