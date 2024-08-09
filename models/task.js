const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true ,unique:true},
  description: { type: String },
  dueDate: { type: Date },
  priority: { type: String, enum: ['Low', 'Medium', 'Urgent'], default: 'Low' },
  status: { type: String, enum: ['To Do', 'In Progress', 'Done'], default: 'To Do' },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
