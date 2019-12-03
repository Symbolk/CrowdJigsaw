var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const session = require('express-session');
var RedisStore = require('connect-redis')(session);
const ejs = require('ejs');
var fs = require('fs');
const glob = require('glob');
var gm = require('gm');
var config; // the global config for dev/pro env
//var pkg = require('./package');
require('./db');
const redis = require('./redis');
var FileStreamRotator = require('file-stream-rotator');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
// Control-Allow-Origin
app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    // res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

// config session
app.use(session({
    secret: 'secret',
    cookie: { maxAge: 1000 * 60 * 60 * 6 },
    resave: false,
    saveUninitialized: false,
    store: new RedisStore({
        host: "127.0.0.1",
        port: 6379,
        db: 1
    })
}));

app.use(function (req, res, next) {
    res.locals.user = req.session.user;
    var err = req.session.error;
    delete req.session.error;
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


console.log("Environment : " + process.env.NODE_ENV);
var logDir = __dirname + '/logs';
console.log('Access logs :' + logDir);
// ensure log directory exists
fs.existsSync(logDir) || fs.mkdirSync(logDir);
// create a rotating write stream
var accessLogStream = FileStreamRotator.getStream({
    date_format: 'YYYYMMDD',
    filename: logDir + '/%DATE%.log',
    frequency: 'daily',
    verbose: false
});
// setup the logger
app.use(logger('short', { skip: function (req, res) { return (res.statusCode == 304 || res.statusCode == 302 || res.statusCode == 200) } }, { stream: accessLogStream }));


// var accessLog = fs.createWriteStream('logs/access.log', {flags : 'a'});
// if (app.get('env') == 'production') {
//   app.use(logger('common', { stream: accessLog }));
// } else {
// app.use(logger('common', { stream: accessLog }));
//   app.use(logger('dev',  { skip: function(req, res) { return (res.statusCode == 304 || res.statusCode == 302  || res.statusCode == 200) }}));
//   // app.use(logger('dev',  { skip: function(req, res) { return (res.statusCode == 304 || res.statusCode == 302 ) }}));
// }

//Node.js body parsing middleware. req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cookieParser());

// set the static folder as the public
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes/index'));
app.use('/users', require('./routes/user'));
app.use('/graph', require('./routes/graph')(io));
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
    module.exports = app;
    console.log('Listening on port : ' + config.port);
} else if (app.get('env') === 'production') {
    // npm start
    config = require('./config/pro');
    server.listen(config.port);
    module.exports = app;
    console.log('Listening on port : ' + config.port);
}

/* app.listen(config.port, function(){
   console.log(`${pkg.name} listening on port ${config.port}`);
});*/
/**
 * socket.io to send&receive the msg
 */
var ImagesModel = require('./models/images').Images;
if (server) {
    // update the image paths to database: "images/raw/starter_thumb.png"
    // empty the last database and save the latest
    for (let i = 1; i < 11; i++) {
        redis.del('image:' + i); 
        for (let j = 1; j < 101; j++) {
            redis.del('image:' + i + ':' + j);
        }  
    }
    ImagesModel.remove({}, function (err) {
        if (err) {
            console.log(err);
        } else {
            glob('./public/images/raw/*_thumb.jpg', function (err, files) {
                if (err) {
                    console.log(err);
                } else {
                    var thumbnails = files.map(f => f.substring(9));
                    thumbnails.forEach(async function (item, index, input) {
                        let num = Number(item.split('_')[1].split('x')[0]);
                        if (num != undefined && num !== 10) {
                            return;
                        }
                        let difficult = await redis.hgetAsync('gaps:images:difficult', item.split('_')[0].split('/')[2])
                        difficult = difficult ? difficult : 0;
                        if (num) {
                            ImagesModel.create({
                                image_path: item,
                                row_num: num,
                                col_num: num,
                                difficult: difficult
                            }, function (err) {
                                if (err) {
                                    console.log(err);
                                } else if (num <= 10) {
                                    real_path = item.split('_')[0] + '_' + num + 'x' + num + '.jpg';
                                    redis.sadd('jigsaw_image', real_path);
                                    redis.sadd('jigsaw_image:' + difficult, real_path);
                                }
                            });
                        }
                    });
                    console.log('[OK] Images Collection Rebuilt.');
                };
            });
        }
    });
    io.on('connection', function (socket) {

        socket.on('puzzle_size_update',function (data) {
            let condition = { 
                'difficult': data.puzzle_difficult
            };
            ImagesModel.find(condition,null,{limit:10}, function (err, docs) {
                if (err) {
                    console.log(err);
                } else {
                    socket.emit('thumbnails', { thumblist: docs });
                }
            });

        });

        // more images listener
        socket.on('nextPage', function (data) {
            //select the next n results and send
            let pageSize = 10;
            let condition = { 
                'difficult': data.puzzle_difficult
            };
            ImagesModel.find(condition, null, { skip: pageSize * data.pageCount, limit: pageSize }, function (err, docs) {
                if(err){
                    console.log(err);
                }else{
                    socket.emit('refresh', { thumblist: docs });
                }
            });
        });
    });
}

var PythonShell = require('python-shell');
function ComputeOfficialScore() {
    var options = {
        mode: 'text',
        pythonPath: 'python3',
        pythonOptions: ['-u'], // get print results in real-time
        scriptPath: '/Users/weiyuhan/git/CrowdJigsaw/dbscripts'
    };
    let pyshell = new PythonShell('official_round_score.py', options);
    pyshell.on('message', function (message) {
        // received a message sent from the Python script (a simple "print" statement)
        console.log(message);
    });
    // end the input stream and allow the process to exit
    pyshell.end(function (err,code,signal) {
        if (err){
            console.log(err);
        }
    });
}
/**
 * A schedule job to clear the endless rounds
 */
var schedule = require('node-schedule');
var RoundModel = require('./models/round').Round;
//once an hour
schedule.scheduleJob('0 0 * * * *', async function () {
    var condition = {
        end_time: "-1"
    };
    ComputeOfficialScore();
    var removeActiveRound = async () => {
        let active_round_count = await redis.zcardAsync('active_round');
        if (!active_round_count) {
            await redis.delAsync('active_total_players');
            await redis.delAsync('active_players');
            await redis.delAsync('active_scoreboard');
        }
    }
    RoundModel.find(condition, async function (err, docs) {
            if (err) {
                console.log(err);
            }
            else {
                for (var round of docs) {
                    var createTime = Date.parse(new Date(round.create_time)) / 1000;
                    var timeNow = Date.parse(new Date()) / 1000;
                    if (timeNow - createTime >= 7200) {
                        // var TIME = util.getNowFormatDate();
                        round.end_time = "-2"; // not ended but killed
                        round.save();
                        console.log("Autoclose Round" + round.round_id);
                        await redis.zremAsync('active_round', round.round_id);
                    }
                }
                await removeActiveRound();
            }
        }
    );
    await removeActiveRound();
});
