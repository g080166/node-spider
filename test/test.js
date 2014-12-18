/**
 * author:wuey desc:该文件为单元测试文件
 */
var assert = require('assert');
var config = require("../config/config");
var log4js = require('log4js');
var logger = log4js.getLogger();
var c = require('../lib/crawler');
var q = require('../lib/queue');
var e = require('../lib/exception');

var Queue = q.Queue;

/**
 * 检测数据是否能正常传入队列当中
 */
function testQueueEnter() {
	var queue = new Queue({
		isUnique : true
	});
	var a = 1;
	queue.enter(a);
	assert.equals(queue.length, 1, "[testQueueEnter]长度错误");
	logger.info("][testQueueIsFilter]检测数据插入成功》》》》》");
}

/**
 * 检测数据是否过滤
 * @returns
 */
function testQueueIsFilter() {
	var queue = new Queue({
		filter : function(data) {
			if (data > 1) {
				return true;
			}
			return false;
		}
	});
	queue.enter(1);
	queue.enter(2);
	assert.ok((queue.length < 2), "[testQueueIsFilter]数组长度错误实际长度"
			+ queue.length);
	logger.info("][testQueueIsFilter]检测数据过滤性成功》》》》》");
}

function testQueueIsUnique() {
	// 检测字符串
	var queue = new Queue({
		isUnique : true
	});

	queue.enter(1);
	queue.enter(1);
	assert.ok(queue.length == 1, "[testQueueIsUnique]数组长度错误，实际长度"
			+ queue.length);
	logger.info("][testQueueIsUnique]检测字符串数据重复性成功》》》》》");

	// 检测数组
	var queue = new Queue({
		isUnique : true
	});
	queue.enter([ 1, 2 ]);
	queue.enter([ 1, 2 ]);
	assert.ok(queue.length == 1, "[testQueueIsUnique]数组长度错误，实际长度"
			+ queue.length);
	logger.info("][testQueueIsUnique]检测数组数据重复性成功》》》》》");

	var queue = new Queue({
		isUnique : true
	});
	queue.enter({
		id : 2,
		name : 1
	});
	queue.enter({
		name : 1,
		id : 2
	});
	assert.ok(queue.length == 1, "[testQueueIsUnique]数组长度错误，实际长度"
			+ queue.length);
	logger.info("][testQueueIsUnique]检测对象数据重复性成功》》》》》");
}

function testQueueIsFormatter() {
	var queue = new Queue({
		formatter : function(data) {
			if (!isNaN(data)) {
				return data + 2;
			}
			return data;
		}

	});

	queue.enter(1);
	assert.ok(queue[0] == 3, "[testQueueIsFormatter]不等于3：" + queue[0]);
	logger.info("[testQueueIsFormatter]数据校验成功》》》》》》》");
}

// testQueueEnter();
// testQueueIsFilter();
// testQueueIsUnique();
// testQueueIsFormatter();

/**
 * 测试crawler是否能够获取到options
 */
function testCrawlerOptions() {
	var Crawler = c.Crawler;
	var urlFilter = function(data) {
		if (data.startWith("(http|https|\/)")) {

			var reg = new RegExp("/people/[^/]+$");
			return reg.test(data);
		}
		return false;
	};

	var crawler = new Crawler({
		host : "www.zhihu.com",
		seeds : [ "http://www.zhihu.com/people/xie-xin-ting" ],
		queueMaxLength : 30,
		rateLimits : 3000,
		proxy : [ {
			ip : "111.161.126.99",
			port : "80"
		} ],
		contentFilter : function($, content, statusCode, urlEntity) {
			console.info(content);
			return true;
		},
		urlFilter : urlFilter

	});
	crawler.start();
}

// testCrawlerOptions();

var http = require('http');
var $url = require('url');
function testRequest() {

	var urlEntity = {
		host : '192.168.60.88',
		port : "8809",
		path : '/slatedecryption/selectGradeData?grade=%E7%AE%80%E5%8D%95',
		method : 'GET'
	};
	var req = http.request(urlEntity, function(res) {
		res.setEncoding("UTF-8");

		var content = "";
		res.on("data", function(data) {
			content += data;
		});

		res.on('end', function() {
			// 获取到数据
			console.info(content);
			var statusCode = res.statusCode;
			console.info(statusCode);
		});

	});

	req.on("error", function(e) {
		console.info(e);
		// 遇到异常
	});

	req.end();

}

function test() {
	for (var index = 0; index < 10000; index++) {
		console.info(index);
		testRequest();
	}

}
test();