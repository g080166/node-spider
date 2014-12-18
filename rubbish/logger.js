require("./global");

var Logger = function(options) {
	var self = this;
	options = options || {};
	var format = options.format || new Date().Format("yyyy-MM-dd hh:mm:ss");

	self.info = function(msg) {
		console.info("[" + format + "] [info] ", msg);
	};

	self.debug = function(msg) {
		console.debug("[" + format + "] [debug] ", msg);
	};

	self.error = function(msg) {
		console.error("[" + format + "] [error] ", msg);
	};
};

module.exports = Logger;