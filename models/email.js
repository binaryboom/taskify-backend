const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  content: { type: String ,required:true},
  time: { type: Date, default: Date.now },
  priority: { type: String, enum: ['Low', 'Medium', 'Urgent'], default: 'Low' ,required:true},
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' ,required:true}],
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' ,required:true},
  isOpened:{type:Boolean,default:false}
});

const Email = mongoose.model('Email', emailSchema);

module.exports = Email;