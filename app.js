var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const session = require('express-session');
const ejs = require('ejs');
var config; // the global config for dev/pro env
//var pkg = require('./package');
require('./db');


// 应用级中间件绑定到 app 对象 使用 app.use() 和 app.METHOD()
var app = express();
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
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
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
app.use('/round', require('./routes/round'));


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Page Not Found');
  err.status = 404;
  next(err);
});

console.log(process.env.NODE_ENV);

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
  app.listen(config.port);
  console.log('Listening on port : '+config.port);
} else if (app.get('env') === 'production') {
  // npm start
  config = require('./config/pro');
  app.listen(config.port);
  module.exports = app;
  console.log('Listening on port : '+config.port);
}

/* app.listen(config.port, function(){
   console.log(`${pkg.name} listening on port ${config.port}`);
});*/

var schedule = require('node-schedule');
var util = require('./routes/util.js');
var ActionModel = require('./models/action').Action;
var RoundModel = require('./models/round').Round;
var round = require('./routes/round')
//once an hour
schedule.scheduleJob('0 0 * * * *', function(){
  let condition = {
        end_time: "-1"
  };
  var round_ids = new Array();
  RoundModel.find(condition, function (err, docs) {
  if (err) {
    console.log(err);
  } 
  else {
    for(var round of docs){
      ActionModel.find().where("round_id").equals(round.round_id).sort({time_stamp:-1})
      .exec(function(err,docs){
        if(err){
          console.log(err);
        }
        else{
          if(docs[0]){
            var timeStamp = Date.parse(new Date(docs[0].time_stamp))/1000;
            var time_stamp_now = Date.parse(new Date())/1000;
            //100minutes
            if(time_stamp_now-timeStamp >= 6000){
              let condition = {
                round_id: docs[0].round_id
              }
              RoundModel.find(condition,function(err,docs){
                if(err){
                  console.log(err);
                }
                else{
                  if(docs[0]){
                    let TIME = util.getNowFormatDate();
                    docs[0].end_time = TIME;
                    docs[0].save();
                    console.log("close round"+docs[0].round_id);
                  }
                }
              })
            }
          }
        }
      })
      }
    }
  } 
);     
});
