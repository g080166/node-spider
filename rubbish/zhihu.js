var config = require("../config/config");
var http = require('http');
var $url = require('url');
var log4js = require('log4js');
var logger = log4js.getLogger();
var c = require('../lib/crawler');
var q = require('../lib/queue');
var e = require('../lib/exception');
var mongodb = require("../lib/db");
var User = require("../model/user");
var Net = require("../model/net")
var Queue = q.Queue;
var async = require('async');

function testCrawlerOptions() {
	mongodb.open(function(err, db) {
		if (err) {
			return;
		}
		var userTb = new User(mongodb);
		var netTb = new Net(mongodb);
		var proxies = new Array();

		netTb.get(function(err, data) {
			var validProxies = function(data) {
				logger.info("检测代理ip是否可用》》》》》》》》");

				var index = 0;
				var index3 = 0;
				var validProxy = function(callback, proxy) {
					// ip : "111.161.126.99",
					// // port : "80"

					var urlEntity = {
						host : proxy.ip,
						port : proxy.port,
						path : 'http://www.zhihu.com/people/xie-xin-ting',
						method : 'GET'
					};

					var req = http.request(urlEntity, function(res) {
						var content = "";
						res.on("data", function(data) {
							content += data;
						});
						res.on('end', function() {
							// 获取到数据
							index++;
							var statusCode = res.statusCode;
							var tmpProxy = proxy;
							if (statusCode && statusCode != 200) {
								proxy = null;
							} else {
								console.info(statusCode + "," + proxy.ip);
							}
							callback(null, proxy);
							console.info(index + ":" + tmpProxy.ip + "执行结束");

						}).on('error', function(e) {
							console.info("响应时发生错误：" + e.getMessage());
						});

					});

					req.on("error", function(e) {
						console.info(e);
						// 遇到异常
						req.abort();
						index++;
						callback(null, null);
						console.info(index + ":" + proxy.ip + "发生错误");
					})

					req.setTimeout(20000, function() {
						console.info(index + ":" + proxy.ip + "超时");
						req.abort();

					});
					req.end();
				}

				var eventList = [];
				var index2 = 0;
				data.forEach(function(proxy) {
					eventList.push(function(callback) {

						validProxy(callback, proxy);
					});
				});
				// for (var index = 0; index < data.length;
				// index++) {
				// console.info(index);
				//
				// }

				async.parallel(eventList,
				// optional callback
				function(err, results) {
					// results is now equal to ['one', 'two']
					if (err) {
						console.info(results);
						return;
					}
					console.info(results);

				});

			};
			validProxies(data);
		});

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
			queueMaxLength : 1000,
			rateLimits : 2000,
			proxy : [ {
				ip : "111.161.126.99",
				port : "80"
			} ],
			// proxy : proxies,
			contentFilter : function($, content, statusCode, urlEntity) {
				// 提问（askNum)、回答(answerNum)、赞同(agreeNum)、感谢(thanksNum)、关注人(followNum)、被关注数目(beFollowedNum)
				if (statusCode === 200) {
					var user = {};
					var name = $(".zm-profile-header-main").find(".name").text();
					var thanks = parseInt($(".zm-profile-header-user-thanks").find("strong").text());
					var agree = parseInt($(".zm-profile-header-user-agree").find("strong").text());
					var followsArray = $(".zm-profile-side-following").find("strong");
					var followNum = parseInt($(followsArray[0]).text());
					var beFollowedNum = parseInt($(followsArray[1]).text());
					logger.info("准备存储：" + urlEntity.path);
					userTb.save({
						name : name,
						url : urlEntity.path,
						thanks : thanks,
						agree : agree,
						followNum : followNum,
						beFollowedNum : beFollowedNum
					});
				}

				return true;
			},
			urlFilter : urlFilter

		});
		crawler.start();

	});
}

testCrawlerOptions();

function testCrawlerOptions() {
	mongodb.open(function(err, db) {
		if (err) {

			console.error(err);
			return;
		}
		var userTb = new User(mongodb);
		var Crawler = c.Crawler;
		var urlFilter = function(data) {
			if (data.startWith("(http|https|\/)")) {

				var reg = new RegExp("/nt/\\d*");
				return reg.test(data);
			}
			return false;
		};
		var netTb = new Net(mongodb);
		var crawler = new Crawler({
			host : "www.xici.net.co",
			seeds : [ "http://www.xici.net.co/nt/" ],
			queueMaxLength : 1000,
			rateLimits : 2000,
			proxy : [ {
				ip : "117.21.192.8",
				port : "80"
			} ],
			contentFilter : function($, content, statusCode, urlEntity) {
				// 提问（askNum)、回答(answerNum)、赞同(agreeNum)、感谢(thanksNum)、关注人(followNum)、被关注数目(beFollowedNum)
				if (statusCode === 200) {
					console.info("=========================================");
					console.info("访问路径：" + urlEntity.path);
					$("#ip_list").find("tr").each(function() {
						var ips = $(this).find("td");
						var ip = $(ips[2]).text();
						var port = $(ips[3]).text();
						var urlEntity = {
							host : ip,
							port : port,
							path : 'http://www.zhihu.com/people/2zhuang',
							method : 'GET'
						};
						var req = http.request(urlEntity, function(res) {

							var content = "";
							res.on("data", function(data) {
								content += data;
							});

							res.on('end', function() {
								// 获取到数据
								var statusCode = res.statusCode;
								console.info(statusCode);
								if (statusCode === 200) {
									netTb.save({
										'ip' : ip,
										'port' : port
									});
								}
							});

						});

						req.on("error", function(e) {
							console.info(e);
							// 遇到异常
						});

						req.end();

					});
					console.info("=========================================");
				}

				return true;
			},
			urlFilter : urlFilter

		});
		crawler.start();

	});
}

// testCrawlerOptions();
