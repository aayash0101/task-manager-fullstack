const express = require('express');
const router = express.Router();

const Task = require('../models/Task');
const verifyToken = require('../middleware/authMiddleware');

// GET tasks
router.get('/', verifyToken, async (req, res) => {
  const tasks = await Task.find({ userId: req.userId }).sort({ order: 1 });
  res.json(tasks);
});

// CREATE task
router.post('/', verifyToken, async (req, res) => {
  const task = new Task({
    text: req.body.text,
    completed: false,
    userId: req.userId,
  });

  await task.save();
  res.json(task);
});

// DELETE
router.delete('/:id', verifyToken, async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// TOGGLE
router.put('/:id', verifyToken, async (req, res) => {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Not found" });

    if (req.body.text !== undefined) {
        task.text = req.body.text;  
    } else {
        task.completed = !task.completed;  
    }

    await task.save();
    res.json(task);
});

router.put('/reorder', verifyToken, async (req, res) => {
  const { tasks } = req.body;

  for (let i = 0; i < tasks.length; i++) {
    await Task.findByIdAndUpdate(tasks[i]._id, {
      order: i
    });
  }

  res.json({ message: "Reordered" });
});


module.exports = router;