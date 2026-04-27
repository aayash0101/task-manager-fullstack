import { useEffect, useState } from "react";
import { fetchTasks, addTask, deleteTask, toggleTask, editTask } from "../api/tasksApi";

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
                <div className="space-y-3">
                    {tasks.map(task => (
                        <div
                            key={task._id}
                            className="flex justify-between items-center bg-white p-3 rounded-xl shadow"
                        >
                            {/* LEFT SIDE */}
                            {editingId === task._id ? (
                                <input
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="flex-1 p-1 border rounded"
                                />
                            ) : (
                                <span className={task.completed ? "line-through text-gray-400" : ""}>
                                    {task.text}
                                </span>
                            )}

                            {/* RIGHT SIDE BUTTONS */}
                            <div className="flex gap-2">

                                {/* DONE / UNDO */}
                                <button
                                    onClick={() => handleToggle(task._id)}
                                    className="text-blue-500"
                                >
                                    {task.completed ? "Undo" : "Done"}
                                </button>

                                {/* EDIT / SAVE */}
                                {editingId === task._id ? (
                                    <button
                                        onClick={() => handleEdit(task._id)}
                                        className="text-green-500"
                                    >
                                        Save
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setEditingId(task._id);
                                            setEditText(task.text);
                                        }}
                                        className="text-yellow-500"
                                    >
                                        Edit
                                    </button>
                                )}

                                {/* DELETE */}
                                <button
                                    onClick={() => handleDelete(task._id)}
                                    className="text-red-500"
                                >
                                    ❌
                                </button>

                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default TasksPage;