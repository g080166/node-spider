/**
 * @author wu 
 * 该模块主要是异常事件模块，当项目发生异常时，则通过该模块捕获异常
 * 以让项目能够更好地运行下去。
 *
 */
var utils = require('util'), EventEmitter = require('events').EventEmitter;
var log4js = require('log4js');
var logger = log4js.getLogger();

var ExceptionHandler = function() {
	logger.info(' init exceptionHandler……');
};
utils.inherits(ExceptionHandler, EventEmitter);
var e = new ExceptionHandler();

e.on("error:lackOfParams", function(callback) {
	callback();
});

e.on("warn", function(callback) {
	callback();
});

e.on("end", function(callback) {
	callback();
});

global.$e = e;
