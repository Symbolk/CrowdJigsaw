var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const session = require('express-session');
const ejs = require('ejs');
var fs = require('fs');  
var config; // the global config for dev/pro env
//var pkg = require('./package');
require('./db');

// 应用级中间件绑定到 app 对象 使用 app.use() 和 app.METHOD()
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
// Control-Allow-Origin
app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  // res.header("Content-Type", "application/json;charset=utf-8");
  next();
});

// 没有挂载路径的中间件，应用的每个请求都会执行该中间件
// config session
app.use(session({
  secret: 'secret',
  cookie: { maxAge: 1000 * 60 * 30 },
  resave: false,
  saveUninitialized: false
}));

app.use(function (req, res, next) {
  res.locals.user = req.session.user;
  var err = req.session.error;
  delete req.session.error;
  // res.locals对象保存在一次请求范围内的响应体中的本地变量值。
  res.locals.message = '';
  if (err) {
    res.locals.message = '' + err;
  }
  next();
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('.html', ejs.__express);
app.set('view engine', 'html');
// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.png')));


console.log("Environment : "+process.env.NODE_ENV);
var accessLog = fs.createWriteStream('logs/access.log', {flags : 'a'}); 
if (app.get('env') == 'production') {
  app.use(logger('common', { skip: function(req, res) { return res.statusCode < 400 }, stream: accessLog }));
} else {
  // app.use(logger('common', { stream: accessLog }));
  app.use(logger('dev',  { skip: function(req, res) { return (res.statusCode == 304 || res.statusCode == 302  || res.statusCode == 200) }}));
  // app.use(logger('dev',  { skip: function(req, res) { return (res.statusCode == 304 || res.statusCode == 302 ) }}));

}
//Node.js body parsing middleware. req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// 加载用于解析 cookie 的第三方中间件
app.use(cookieParser());
// Express 唯一内置的中间件。它基于 serve-static，负责在 Express 应用中提托管静态资源。
// set the static folder as the public
app.use(express.static(path.join(__dirname, 'public')));
// 定义应用级路由
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/user'));
app.use('/graph', require('./routes/graph'));
app.use('/round', require('./routes/round')(io));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Page Not Found');
  err.status = 404;
  next(err);
});


app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  // no stacktraces leaked to user in production env
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

if (app.get('env') === 'development') {
  // nodemon or npm test
  config = require('./config/dev');
  server.listen(config.port);
  console.log('Listening on port : '+config.port);
} else if (app.get('env') === 'production') {
  // npm start
  config = require('./config/pro');
  serve.listen(config.port);
  module.exports = app;
  console.log('Listening on port : '+config.port);
}

/* app.listen(config.port, function(){
   console.log(`${pkg.name} listening on port ${config.port}`);
});*/
/**
 * socket.io to send&receive the msg
 */
if(server){
  io.on('connection', function(socket){
    socket.on('join', function(data){
      // console.log(data);
      socket.emit('hello', {hello: 'Hello '+ data.player_name});
    });
    socket.on('iSolved', function(data){
      console.log('!!!Round '+data.round_id+' : '+ data.player_name+' solves!');
      socket.broadcast.emit('someoneSolved', data);
    });
  });
}

/**
 * A schedule job to clear the endless rounds
 */
var schedule = require('node-schedule');
var util = require('./routes/util.js');
var ActionModel = require('./models/action').Action;
var RoundModel = require('./models/round').Round;
//once an hour
schedule.scheduleJob('0 0 * * * *', function(){
  var condition = {
        end_time: "-1"
  };
  RoundModel.find(condition, function (err, docs) {
  if (err) {
    console.log(err);
  }
  else {
    for(var round of docs){
      var createTime = Date.parse(new Date(round.create_time))/1000;
      var timeNow = Date.parse(new Date())/1000;
      if(timeNow - createTime >= 7200){
          // var TIME = util.getNowFormatDate();
          round.end_time = "-2"; // not ended but killed
          round.save();
          console.log("Autoclose Round"+round.round_id);
      }
      }
    }
  }
);
});
