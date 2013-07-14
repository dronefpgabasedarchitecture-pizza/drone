// Generated by CoffeeScript 1.6.3
(function() {
  var Drone, EventEmitter, arDrone, enable_opencv, opencv, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ = require('lodash');

  arDrone = require('ar-drone');

  EventEmitter = require('events').EventEmitter;

  opencv = require('opencv');

  enable_opencv = false;

  Drone = (function(_super) {
    __extends(Drone, _super);

    function Drone(log) {
      var _this = this;
      this.log = log;
      this.arClient = arDrone.createClient();
      this.pngStream = this.arClient.getPngStream();
      this.pngStream.on('data', function(data) {
        return _this.processMatrix(data, function(error, faces) {
          if (error) {
            _this.log.error(error);
            return;
          }
          return _this.emit('frame', data, faces);
        });
      });
    }

    Drone.prototype.processMatrix = function(data, callback) {
      if (!((opencv != null) && enable_opencv)) {
        return callback(null, {});
      }
      return opencv.readImage(data, function(error, mat) {
        if (error) {
          return callback(new Error('error reading image:' + error.message));
        }
        return mat.detectObject(opencv.FACE_CASCADE, {}, function(error, faces) {
          if (error) {
            return callback(new Error('error processing image:' + error.message));
          }
          return callback(null, faces);
        });
      });
    };

    Drone.prototype.takeoff = function() {
      this.log.info('taking off...');
      return this.arClient.takeoff(function() {
        this.log.notice('drone took off');
        return this.arClient.stop();
      });
    };

    Drone.prototype.land = function() {
      this.log.info('landing...');
      this.arClient.stop();
      return this.arClient.land(function() {
        return this.log.notice('drone landed');
      });
    };

    return Drone;

  })(EventEmitter);

  module.exports = function(log) {
    return new Drone(log);
  };

}).call(this);