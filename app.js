var coffeeScript = require('coffee-script');
var express = require('express'),
    routes = require('./routes'),
    api = require('./routes/api'),
    http = require('http'),
    drone = require('./drone'),
    path = require('path'),
    utils = require('./utils'),
    io = require('socket.io'),
    log = new utils.Log('drone'),
    fs = require('fs');

log.verbose(true);
log.info('starting application...');

var app = express();

app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.enable('case sensitive routing');
    app.enable('strict routing');
    app.use(express.favicon());
    app.configure('development', function(){
      app.use(express.logger('dev'));
    });
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.locals.pretty = true;
});

log.info('creating AR.drone control...');
droneControl = drone(log);

api(app, droneControl);
routes(app);

server = http.createServer(app).listen(app.get('port'), function(){
    log.info("express server listening on port %d in mode %s.",
                app.get('port'), app.settings.env);
});

io = io.listen(server);
io.set('log level', 1);

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});

droneControl.on('frame', function (png, faces) {
    log.info('received frame, with ' + faces.length + ' faces');
    io.sockets.emit('png-update', {
        png: new Buffer(png).toString('base64'),
        faces: faces
    });
});

droneControl.on('ready', function () {
    io.sockets.emit('ready', {});
});

var landed = true;

io.sockets.on('connection', function (socket) {

    socket.on('png-saved', function(data) {
        log.info('socket.io: png-save');
        timestamp = (new Date()).getTime().toString();
        fs.writeFile('samples/sample-' + timestamp + '.png',
                     data.png, 'base64', function(error) {
            if (error) log.error('error saving sample');
        });
    })

    socket.on('power', function() {
        log.info('socket.io: power');
        if (landed) {
            droneControl.takeoff();
        } else {
            droneControl.land();
        }
        landed = !landed;
    });

    socket.on('stabilize', function() {
        log.info('socket.io: stabilize');
        //droneControl.calibrate();
    });

});
