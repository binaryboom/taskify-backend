const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number },
});

const TimeEntry = mongoose.model('TimeEntry', timeEntrySchema);

module.exports = TimeEntry;
