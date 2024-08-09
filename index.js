const express = require('express')
const app = express()
const cors = require('cors');
const mongoose = require('mongoose')
const User = require('./models/user')
const Task = require('./models/task')
const Time = require('./models/timeEntry')
const Email = require('./models/email')

app.use(cors())

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


main()
  .then(() => {
    console.log("connection successfull");
  })
  .catch((err) => {
    console.log("Error : ", err);
  });

async function main() {
  await mongoose.connect("mongodb+srv://raghavkataria709:DAiK9nFMrmPCDDY5@cluster0.pjqcx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
}

app.get('/', function (req, res) {
  // console.log(req)
  res.send({ a: 'Hello World' })
})

app.listen(3000, () => {
  console.log('listening on 3000')
})

let user1 = new User({
  username: 'raghav',
  password: 'raghav2'
})

// user1.save()
// .then((res) => console.log(res))
// .catch(e => { console.log(e) })

app.post('/api/login', async (req, res) => {
  // let username=req.body.username;
  let { username, password } = req.body;
  // console.log(password)
  let user = await User.findOne({ username: username })
  if (password === undefined) {
    // console.log(user)
    if (user) {
      return (res.send({
        exist: true
      }))
    }
    else {
      return (
        res.send({
          exist: false
        }))
    }
  }
  const hasNumber = /\d/;
  if (!hasNumber.test(password) || password.length < 5) {
    return (res.send({ error: 'Password should be alphanumeric with min 5 characters' }))
  }
  if (user !== null && password) {
    if (user.password === password) {
      return (res.send({
        logged: true,
        userId: user._id,
        username: user.username
      }))
    }
    if (user.password !== password) {
      return (res.send({ error: 'Wrong Password' }))

    }
  }
  if (user === null && password) {
    let newUser = await new User(req.body).save()
    // console.log('new user')
    // console.log(newUser);
    return (res.send({
      logged: true,
      userId: newUser._id,
      username: newUser.username
    }))
  }
})

app.get('/api/findAllUsers', async (req, res) => {
  let allUsers = await User.find({}).select('username')
  res.send(allUsers)
})

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'; // Handle cases where dateString might be null or undefined
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()); // Get last 2 digits of the year
  return `${day}/${month}/${year}`;
};

app.post('/api/task', async (req, res) => {
  let data = req.body;
  console.log(data)
  if (data) {
    let task = await new Task(data).save()
    let taskDummy = await task.populate('assignedBy', 'username');
    // console.log(task)
    let emailData = {
      content: `You have been assigned the following task : "${task.title}" by ${taskDummy.assignedBy.username} . Please complete it on ${task.priority} basis by ${formatDate(task.dueDate)}`,
      priority: data.priority,
      assignedTo: data.assignedTo,  
      from: data.assignedBy,         
    };

    // Save the email
    let email = await new Email(emailData).save();
    // console.log(email);
    res.send({ created: true, task: task, email: email })
  }
  else {
    res.send({ created: false })
  }
})

app.post('/api/findAllTasks', async (req, res) => {
  let userId = req.body.userId;
  let tasks = await Task.find({ assignedTo: userId })
    .populate('assignedTo', 'username') 
    .populate('assignedBy', 'username');
  if (tasks) {
    // console.log(tasks)
    res.send({ found: true, tasks: tasks })
  }
  else {
    res.send({ found: false })
  }
})

app.post('/api/findAllEmails', async (req, res) => {
  let userId = req.body.userId;
  let email = await Email.find({ assignedTo: userId })
    .populate('from', 'username');
  if (email.length > 0) {
    // console.log(email)
    res.send({ found: true, email: email })
  }
  else {
    res.send({ found: false })
  }
})

app.post('/api/deleteTask', async (req, res) => {
  let { whom, userId, taskId } = req.body;
  // console.log(req.body)
  let task = await Task.findById(taskId)
  // console.log(task)
  if (task) {
   console.log( task.assignedBy,userId)
    if (task.assignedBy == userId) {

      if (whom === 'me') {
        let r=await Task.updateOne( { _id: taskId }, { $pull: { assignedTo: userId } } );
        // console.log(r)
        res.send({
          deleted: true,for:'you'
        })
      }
      if (whom === 'everyone') {
       let r= await Task.deleteOne({_id:taskId})
      //  console.log(r)
       res.send({
        deleted: true,for:'everyone'
      })
      }
    }
    else {
      res.send({
        error: "You aren't authorized"
      })
    }
  }
  else {
    res.send({
      error: "Task not found"
    })
    }
})

app.post('/api/task/updateTask', async (req, res) => {
  let up = req.body;
  // console.log(req.body)
  let task=await Task.findById(up.taskId)
  // console.log(task)
  if (task) {
    // console.log( task.assignedBy,up.userId)
    if (task.assignedBy == up.userId) {
      let updated = await Task.findByIdAndUpdate(up.taskId,req.body,{ new: true })
      res.send({ updated: true})
      return;
    }
    else {
      res.send({
        error: "You aren't authorized"
      })
    }
  }
  else {
    res.send({
      error: "Task not found"
    })
    }
})

