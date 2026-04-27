const BASE_URL = "http://localhost:5000";

const getHeaders = (token) => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
});

export const fetchTasks = async (token) => {
    const res = await fetch(`${BASE_URL}/tasks`, {
        headers: getHeaders(token)
    });
    return res.json();
};

export const addTask = async (text, token) => {
    const res = await fetch(`${BASE_URL}/tasks`, {
        method: "POST",
        headers: getHeaders(token),
        body: JSON.stringify({ text })
    });
    return res.json();
};

export const deleteTask = async (id, token) => {
    const res = await fetch(`${BASE_URL}/tasks/${id}`, {
        method: "DELETE",
        headers: getHeaders(token)
    });
    return res.json();
};

export const toggleTask = async (id, token) => {
    const res = await fetch(`${BASE_URL}/tasks/${id}`, {
        method: "PUT",
        headers: getHeaders(token)
    });
    return res.json();
};

export const editTask = async (id, text, token) => {
    const res = await fetch(`${BASE_URL}/tasks/${id}`, {
        method: "PUT",
        headers: getHeaders(token),
        body: JSON.stringify({ text })
    });
    return res.json();
};

export const reorderTasks = async (tasks, token) => {
    const res = await fetch(`${BASE_URL}/tasks/reorder`, {
        method: "PUT",   
        headers: getHeaders(token),
        body: JSON.stringify({ tasks })
    });
    return res.json();
};