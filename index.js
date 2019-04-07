const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const app = express()

var routes = require('./routes')
var http = require('http').Server(app)
var io = require('socket.io')(http)
var room = require('./sockets')(io)

app.use(express.static(path.join(__dirname, 'public')))
app.use('/round', routes);
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.get('/', (req, res) => res.render('pages/index'))

http.listen(process.env.PORT || 80, function(){
  console.log('listening on *:5000')
})