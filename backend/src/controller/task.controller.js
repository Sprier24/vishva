const mongoose = require("mongoose");
const Task = require("../model/taskSchema.model");
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const createTask = async (req, res) => {
  try {
    const taskData = req.body;

    // Check if a task with the same title already exists
    const existingTask = await Task.findOne({ title: taskData.title });
    if (existingTask) {
      return res.status(400).json({
        success: false,
        message: "Task with this title already exists",
      });
    }

    // Create a new task if no duplicate is found
    const newTask = await Task.create(taskData);

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: newTask,
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};


const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find({});
    res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};

const updateTask = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid task ID format.",
    });
  }

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    const updatedTask = await Task.findByIdAndUpdate(id, updates, {
      new: true, 
      runValidators: true, 
    });

    res.status(200).json({
      success: true,
      message: "Task updated successfully.",
      data: updatedTask,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};

const deleteTask = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid task ID format.",
    });
  }

  try {
    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Task deleted successfully.",
      data: deletedTask,
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};


const normalizeStatus = (status) => {
  const statusMap = {
    "inprogress": "In Progress",
    "pending": "Pending",
    "resolved": "Resolved"
  };
  return statusMap[status.toLowerCase()] || "Pending"; // Default to "Pending"
};

const updateStatus = async (req, res) => {
  const { taskId, status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return res.status(400).json({ success: false, message: "Invalid task ID" });
  }

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    task.status = normalizeStatus(status);
    await task.save();

    res.json({ success: true, message: "Task status updated successfully" });
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



module.exports = {
  createTask,
  getAllTasks,
  updateTask,
  deleteTask,
  updateStatus
};
