const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/user');
const Task = require('./models/task');
const Time = require('./models/timeEntry');
const Email = require('./models/email');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

main()
  .then(() => {
    console.log("Connection successful");
  })
  .catch((err) => {
    console.error("Error connecting to the database: ", err);
  });

async function main() {
  await mongoose.connect("mongodb+srv://raghavkataria709:DAiK9nFMrmPCDDY5@cluster0.pjqcx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
}

app.get('/', function (req, res) {
  res.send({ message: 'Hello World' });
});

app.listen(3000, () => {
  console.log('Listening on 3000');
});

// Global error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Something went wrong!' });
});

app.post('/api/login', async (req, res, next) => {
  try {
    let { username, password } = req.body;
    let user = await User.findOne({ username: username });

    if (password === undefined) {
      if (user) {
        return res.send({ exist: true });
      } else {
        return res.send({ exist: false });
      }
    }

    const hasNumber = /\d/;
    if (!hasNumber.test(password) || password.length < 5) {
      return res.send({ error: 'Password should be alphanumeric with min 5 characters' });
    }

    if (user && password) {
      if (user.password === password) {
        return res.send({
          logged: true,
          userId: user._id,
          username: user.username,
        });
      } else {
        return res.send({ error: 'Wrong Password' });
      }
    }

    if (!user && password) {
      let newUser = await new User(req.body).save();
      return res.send({
        logged: true,
        userId: newUser._id,
        username: newUser.username,
      });
    }
  } catch (err) {
    next(err);
  }
});

app.get('/api/findAllUsers', async (req, res, next) => {
  try {
    let allUsers = await User.find({}).select('username');
    res.send(allUsers);
  } catch (err) {
    next(err);
  }
});

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
};

app.post('/api/task', async (req, res, next) => {
  try {
    let data = req.body;
    if (data) {
      let task = await new Task(data).save();
      let taskDummy = await task.populate('assignedBy', 'username');

      let emailData = {
        content: `You have been assigned the following task: "${task.title}" by ${taskDummy.assignedBy.username}. Please complete it on ${task.priority} basis by ${formatDate(task.dueDate)}`,
        priority: data.priority,
        assignedTo: data.assignedTo,
        from: data.assignedBy,
      };

      let email = await new Email(emailData).save();
      res.send({ created: true, task: task, email: email });
    } else {
      res.send({ created: false });
    }
  } catch (err) {
    next(err);
  }
});

app.post('/api/findAllTasks', async (req, res, next) => {
  try {
    let userId = req.body.userId;
    let tasks = await Task.find({ assignedTo: userId })
      .populate('assignedTo', 'username')
      .populate('assignedBy', 'username');
    if (tasks) {
      res.send({ found: true, tasks: tasks });
    } else {
      res.send({ found: false });
    }
  } catch (err) {
    next(err);
  }
});

app.post('/api/findAllEmails', async (req, res, next) => {
  try {
    let userId = req.body.userId;
    let email = await Email.find({ assignedTo: userId })
      .populate('from', 'username');
    if (email.length > 0) {
      res.send({ found: true, email: email });
    } else {
      res.send({ found: false });
    }
  } catch (err) {
    next(err);
  }
});

app.post('/api/deleteTask', async (req, res, next) => {
  try {
    let { whom, userId, taskId } = req.body;
    let task = await Task.findById(taskId);

    if (task) {
      if (task.assignedBy.toString() === userId) {
        if (whom === 'me') {
          await Task.updateOne({ _id: taskId }, { $pull: { assignedTo: userId } });
          res.send({ deleted: true, for: 'you' });
        } else if (whom === 'everyone') {
          await Task.deleteOne({ _id: taskId });
          res.send({ deleted: true, for: 'everyone' });
        }
      } else {
        res.send({ error: "You aren't authorized" });
      }
    } else {
      res.send({ error: "Task not found" });
    }
  } catch (err) {
    next(err);
  }
});

app.post('/api/task/updateTask', async (req, res, next) => {
  try {
    let up = req.body;
    let task = await Task.findById(up.taskId);

    if (task) {
      if (task.assignedBy.toString() === up.userId) {
        let updated = await Task.findByIdAndUpdate(up.taskId, req.body, { new: true });
        res.send({ updated: true });
      } else {
        res.send({ error: "You aren't authorized" });
      }
    } else {
      res.send({ error: "Task not found" });
    }
  } catch (err) {
    next(err);
  }
});
