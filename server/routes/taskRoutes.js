const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const verifyToken = require('../middleware/authMiddleware');

// GET tasks
router.get('/', verifyToken, async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.userId }).sort({ order: 1 });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CREATE task
router.post('/', verifyToken, async (req, res) => {
    try {
        const count = await Task.countDocuments({ userId: req.userId }); 
        const task = new Task({
            text: req.body.text,
            completed: false,
            userId: req.userId,
            order: count,
            status: 'todo'
        });
        await task.save();
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// REORDER — must be before /:id 
router.put('/reorder', verifyToken, async (req, res) => {
    try {
        const { tasks } = req.body;
        for (let i = 0; i < tasks.length; i++) {
            await Task.findByIdAndUpdate(tasks[i]._id, { order: i });
        }
        res.json({ message: "Reordered" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/:id/move', verifyToken, async (req, res) => {
  const { status } = req.body;

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { status },
    { new: true }
  );

  res.json(task);
});

// TOGGLE / EDIT
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: "Not found" });

        if (req.body.text !== undefined) {
            task.text = req.body.text;
        } else {
            task.completed = !task.completed;
        }

        await task.save();
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


module.exports = router;