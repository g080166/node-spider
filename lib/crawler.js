var http = require('http');
var $url = require('url');
var cheerio = require('cheerio');

var log4js = require('log4js');
var logger = log4js.getLogger();

var qe = require("./queue");
var Queue = qe.Queue;

var config = require("../config/config");
var common = require("./common");

var requireParams = [ "host", "seeds" ];
var BOOT_MODE_FULL = 0;// 完全启动
var BOOT_MODE_FILE = 1;// 临时文件启动
var BOOT_MODE_CACHE = 2;// 缓存启动

var RES_SUCCESS_CODE = 200;

/**
 * 初始化参数
 */
var initOptions = function(defaultOptions, options) {
	for ( var index in defaultOptions) {
		if (!options[index]) {
			options[index] = defaultOptions[index];
		}
	}
	return options;
};

var Crawler = function(options) {
	var self = this;
	self.init(options);
};

/**
 * Crawler对象初始化
 * 
 * @param options
 * @returns {___anonymous475_481}
 */
Crawler.prototype.init = function(options) {
	var self = this;
	options = options || {};
	var defaultOptions = {
		host : null, // 主机地址，必须
		seeds : [], // url种子，必须
		proxy : [ {
			ip : "localhost",
			port : "80"
		} ],// 代理服务器,非必须，默认为localhost
		queueMaxLength : -1, // 一次性执行url的最大数
		reqMethod : "GET", // 请求方式，默认为GET
		reqEncode : "utf-8",// 请求编码,默认为utf-8
		urlFilter : false,// url过滤器，传入回调方法
		urlFormatter : false,// url格式化，传入回调方法
		rateLimits : 1000, // 限制速度，单位毫秒
		headers : "", // 请求头部
		onSuccess : false, // 成功响应的方法
		onError : false, // 错误响应方法
		contentFilter : function() {
			return true;
		}
	//
	};
	self.options = initOptions(defaultOptions, options);

	// 状态集合
	self.statusBox = {
		runStatus : false
	// 运行状态,初始为false
	};

	// 注册一个任务
	self.task = null;

};

Crawler.prototype.start = function() {
	var self = this;
	// 常规性参数校验
	var options = self.options;
	var task = self.task;
	var rateLimits = options.rateLimits;
	var queueMaxLength = options.queueMaxLength;
	// 检测必要参数规范，如果不规范，则输出异常抛出
	if (!validOptions(options)) {
		return;
	}

	// 初始化等待队列，执行队列，已执行队列
	// 需要提供一个参数，说明初始化的数据的来源，以方便后期扩展中断用。
	// 提供启动方式：
	// 0：完全重启，即从默认种子捕捉；
	// 1：非完全重启，即从临时文件开始捕捉；
	// 2：缓存重启，从缓存开始捕获数据
	var queueLs = initQueue(options, BOOT_MODE_FULL);
	var waitingQueue = queueLs.waitingQueue;
	var visitedQueue = queueLs.visitedQueue;
	var visitingQueue = queueLs.visitingQueue;

	// 设置crawler的状态空间
	if (self.statusBox.runStatus) {
		$e.emit("warn", function() {
			logger.warn("[wuey]爬虫运行中");
		});
		return;
	}
	// 改变运行状态为true
	self.statusBox.runStatus = true;
	// 设置开始/停止标识，当flag为true时，无限循环执行下去，知道flag变为false
	task = setInterval(function() {

		// 如果访问队列为0，且等待的队列为0，则此时触发结束事件
		if (visitingQueue.length === 0 && waitingQueue.length === 0) {
			$e.emit("end", function() {
				end();
			});
			return;
		}

		// 从等候队列获取url

		if (visitingQueue.length === 0) {
			queueLs.visitingQueue = getFromWaitingQueue(waitingQueue, visitingQueue, queueMaxLength);
			loadVisitingQueue(queueLs, self);
		}

		// 读取访问队列

		// 发送请求，接收响应

		// 数据解析

		// 结束
	}, rateLimits);

};

/**
 * 校验参数合法性
 */
var validOptions = function(options) {
	for (var index = 0; index < requireParams.length; index++) {
		var property = requireParams[index];
		if (!options[property] || options[property] === "" || options[property].length === 0) {
			errorHanderlLackOfParams("lackOfParam,key:" + property + ",value:" + options[property]);
			return false;
		}
	}
	return true;
};

/**
 * 
 * @param options
 * @param type：启动方式。 0：完全重启，即从默认种子捕捉；
 * 1：非完全重启，即从临时文件开始捕捉；
 * 2：缓存重启，从缓存开始捕获数据
 */
var initQueue = function(options, type) {
	// 等待队列
	var waitingQueue = new Queue({
		filter : options.urlFilter,
		formatter : options.urlFormatter
	});

	// 访问队列
	var visitingQueue = new Queue({
		queueMaxLength : options.queueMaxLength
	});

	// 已访问队列，负责查重
	var visitedQueue = {};

	if (type !== BOOT_MODE_FULL) {
		waitingQueue = contact(waitingQueue, getTmpWaitingData(type));
		// waitingQueue = getTmpWaitingData(type).concat();
		visitedQueue = contact(visitedQueue, getTmpWaitingData(type));

	} else {

		waitingQueue = contact(waitingQueue, options.seeds);

		// waitingQueue = options.seeds.concat();
	}
	logger.info(" 初始化等待队列成功,等待队列长度为： " + waitingQueue.length + "》》》");
	logger.info(" 初始化访问队列成功,访问队列长度为： " + visitingQueue.length + "》》》");
	logger.info(" 初始化已访问队列成功,已访问队列长度为： " + visitedQueue + "》》》");

	return {
		waitingQueue : waitingQueue,
		visitingQueue : visitingQueue,
		visitedQueue : visitedQueue
	};
}

var getFromWaitingQueue = function(waitingQueue, visitingQueue, queueMaxSize) {
	if (waitingQueue.length === 0) {
		return [];
	}
	// visitingQueue = waitingQueue.splice(0, queueMaxSize).concat();
	var _visitingQueue = waitingQueue.splice(0, queueMaxSize)
	contact(visitingQueue, _visitingQueue);
	logger.info("[wuey]访问队列获取数据完毕,共有" + visitingQueue.length + "条数据,等候队列剩余" + waitingQueue.length + "条数据");
	return visitingQueue;
};

/**
 * 读取访问队列，生成request
 */

var loadVisitingQueue = function(queueLs, self) {
	var waitingQueue = queueLs.waitingQueue;
	var visitedQueue = queueLs.visitedQueue;
	var visitingQueue = queueLs.visitingQueue;

	// 优化代码中这个变量可以删除
	var progressing = {
		repeatNum : 0,
		errorNum : 0,
		successNum : 0,
		otherNum : 0,
		total : visitingQueue.length
	};

	var factualLength = visitingQueue.length;
	for (var index = 0; index < factualLength; index++) {
		var url = visitingQueue.shift();
		if (visitedQueue[url]) {
			progressing.repeatNum++;
			continue;
		}
		progressing.otherNum++;
		visitedQueue[url] = true;
		executeRequest(queueLs, self, url, progressing);
	}

	logger.info("进度：总条目【" + progressing.total + "】" + ",重复条目：" + progressing.repeatNum);
};

/**
 * 执行请求
 */
var executeRequest = function(queueLs, self, url, progressing) {
	var urlEntity = getUrlEntity(url, self);
	if (!urlEntity) {
		logger.warn("[wuey]url[" + url + "]无法生成实体类");
		return;
	}
	var waitingQueue = queueLs.waitingQueue;
	var visitedQueue = queueLs.visitedQueue;
	var visitingQueue = queueLs.visitingQueue;
	// 发送请求
	var req = http.request(urlEntity, function(res) {
		res.setEncoding(self.reqEncode);

		var content = "";
		res.on("data", function(data) {
			content += data;
		});

		res.on('end', function() {
			// 获取到数据

			var statusCode = res.statusCode;
			// console.info("url:" + url + ",statusCode:" + statusCode)
			if (statusCode && RES_SUCCESS_CODE === statusCode) {

				progressing.successNum++;

				var $ = toDom(content);
				if (self.options.contentFilter($, content, statusCode, urlEntity)) {
					pushUrl($, queueLs, self, urlEntity);
				}

				req.emit("progress", msg);
				// 将返回来的数据转换成dom
			} else {
				req.emit("progress");
				// throw new Error("request fail,host[" + urlEntity.host
				// + "],path[" + urlEntity.path + "],url[" + url
				// + "],the status code is " + res.statusCode);
				var msg = "request fail,host[" + urlEntity.host + "],path[" + urlEntity.path + "],url[" + url + "],the status code is " + res.statusCode;
				req.emit("error:statusCodeError", msg);
			}
		});

	});

	req.on("error", function(e) {
		console.info(e);
		// 遇到异常
		progressing.errorNum++;
	});

	req.on("progress", function(msg) {
		logger.info("进度：成功条目【" + progressing.successNum + "】," + "失败条目【" + progressing.errorNum + "】,总条目【" + progressing.total + "】" + ",重复条目："
				+ progressing.repeatNum + ",剩余条目：" + (progressing.total - progressing.successNum - progressing.errorNum - progressing.repeatNum));
	});

	req.on("error:statusCodeError", function(msg) {
		console.error(msg);
		progressing.errorNum++;
	});

	// 结束
	req.end();
};

/**
 * 将url放入到等候队列当中,存在问题
 */
var pushUrl = function($, queueLs, self, urlEntity) {
	var waitingQueue = queueLs.waitingQueue;
	$("a").each(function(i, e) {
		var href = $(e).attr("href");
		if (href) {
			if (!isRelativeAddress(href)) {
				href = "http://" + urlEntity.baseDir + href;
			}
			waitingQueue.enter(href);
		}
	});
};
/**
 * 判断是否为相对地址
 */
var isRelativeAddress = function(url) {
	return url.startWith("(http|https)");
};
/**
 * 转换成dom
 */
var toDom = function(content) {
	var $ = cheerio.load(content);
	return $;
};

/**
 * 获取url实体，存在问题
 */
var getUrlEntity = function(url, self) {
	var urlInfo = null;
	var _host = null;
	var _path = null;

	if (url.startWith("(http|https)")) {
		var reg = new RegExp("^(?:http|https)://(.*?)(?:(?:(/.*?)$)|$)");
		var matcher = reg.exec(url);
		if (matcher) {
			_host = matcher[1];
			_path = matcher[2] || "/";
		}
	} else if (url.startWith("/")) {
		_host = self.options.host;
		_path = url.substring(0, url.length);
	}

	if (_host) {
		var _url = $url.parse(_path);
		return {
			host : getRandomProxy(self).ip,
			port : getRandomProxy(self).port,
			path : "http://" + _host + ("/" == _url.path ? "" : _url.path),
			url : "http://" + _host + ("/" == _url.path ? "" : _url.path),
			method : self.options.reqMethod,
			headers : self.options.headers,
			baseDir : _host
		}

	}
	return null;
};

var getRandomProxy = function(self) {
	var proxy = self.options.proxy;
	if (proxy) {
		var l = proxy.length;
		var index = random(0, l);
		return proxy[index];
	}
};

var random = function(min, max) {
	return Math.floor(min + Math.random() * (max - min));
}

var end = function() {
	logger.info("[wuey]程序结束，正在保存缓存》》》》》》");
};

var contact = function(origialQueue, tmpQueue) {
	for (var index = 0; index < tmpQueue.length; index++) {
		origialQueue.enter(tmpQueue[index]);
	}

	return origialQueue;
};

/**
 * 获取等待队列数据
 */
var getTmpWaitingData = function(type) {
	return [];
};

/**
 * 获取已经访问队列数据
 */
var getTmpVisitedData = function(type) {
	return [];
};

/**
 * 错误列表
 */
var errorHanderlLackOfParams = function(msg) {
	$e.emit("error:lackOfParams", function() {
		logger.error(msg);
	});
};

exports.Crawler = Crawler;
