var config = require('../config/config');
var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;

module.exports = new Db(config.db, new Server(config.host,
		Connection.DEFAULT_PORT, {}));
