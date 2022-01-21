const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
require('dotenv').config()

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

app.use(cors())
app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

console.log(mongoose.connection.readyState)

const schema = new mongoose.Schema({
  username: {type: String, required: true},
  logs: [Object]
})

let Username = mongoose.model("Username", schema)

app.get("/api/", (req, res) => {
  Username.deleteMany({} , (err, result) => {
    if(err){
      console.log(err)
    }
    res.send("done")
  })
})

/*Create User*/
app.post("/api/users", (req, res) => {
  let name = req.body.username
  let addNewUser = new Username({
    username: name
  })
  addNewUser.save((err,data) => {
    if(err){
      console.log(err)
    }
    res.json({username: data.username, _id: data.id})
  })
})

/*Find user by id and create an exercise*/
app.post("/api/users/:id/exercises", (req, res) => {
  let id = req.params.id
  let description = req.body.description
  let duration = req.body.duration
  let date = req.body.date ? new Date(req.body.date).toDateString() 
                                  : new Date().toDateString()

  let newLog = {
    "description": description,
    "duration": duration,
    "date": date
  }

  for(let items in newLog){
    if(newLog[items] == ""){
      res.send(`Path ${items} is required`)
      return 0 
    }
  }

  duration = parseInt(duration)
  Username.findById(id, (err, user) => {
    if(err){
      console.log(err)
    }
    newLog.duration = parseInt(newLog.duration)
    user.logs.push(newLog)
    user.save((err, data) => {
      if(err){
        console.log(err)
      }
      res.json({'_id': id, "username": data.username, "date": date, "duration": duration, "description": description})
    })
  })
})

/*Getting all the users*/
app.get("/api/users", (req, res) => {
  Username.find({}, (err, result) => {
    if(err){
      console.log(err)
    }
    let allUsers = []
    for(let users in result){
      allUsers.push({"_id": result[users].id, "username": result[users].username, "__v": result[users].__v})
    }
    res.send(allUsers)
  })
})

app.get("/api/users/:id/logs?", (req, res) => {
  let id = req.params.id
  let from = req.query.from
  let to = req.query.to
  let limit = req.query.limit
  
  Username.findById(id, (err, user) => {
    if(err){
      console.log(err)
    }

    // let numberOfLogs = []
    // let numberOfLogsWithFromAndTo = []

    // if(limit != undefined){
    //   for(let i = 0; i < limit; i++){
    //     numberOfLogs.push(user.logs[i])
    //   }
    // } else {
    //   numberOfLogs = user.logs
    // }
  
    let newArr = []
    if(from != undefined && to != undefined){
      let fromMilliseconds = new Date(from).getTime()
      let toMilliseconds = new Date(to).getTime()

      for(let i = 0; i < user.logs.length; i++){
        let testDate = new Date(user.logs[i].date).getTime()
        if(fromMilliseconds <= testDate && testDate <= toMilliseconds){
          newArr.push(user.logs[i])
        }
      }
      newArr.sort((a, b) => {
        let da = new Date(a.date),
            db = new Date(b.date);
            return da - db;
      })
    } else {
      newArr = user.logs
    }

    if(limit != undefined && from != undefined){
      newArr = newArr.slice(0, limit)
    } else if(limit != undefined && from == undefined){
      newArr = user.logs.slice(0, limit)
    }

    res.json({"_id": id, "username": user.username, "count": newArr.length,"log": newArr})
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
