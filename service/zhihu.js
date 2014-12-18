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
			var index = 0;
			var validProxy = function(callback, proxy) {
				var urlEntity = {
					host : proxy.ip,
					port : proxy.port,
					path : "http://www.zhihu.com/people/xie-xin-ting",
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
						console.info(index + ":" + proxy.ip + "执行结束：" + statusCode);
						if (statusCode && statusCode != 200) {
							proxy = null;
						}

						callback(null, proxy);
					});
				});

				req.on("error", function(e) {
					index++;
					logger.error(e);
					// 遇到异常
					req.abort();
					callback(null, null);
					console.info(index + ":" + proxy.ip + "发生错误");
				})

				req.setTimeout(5000, function() {
					console.info(proxy.ip + "超时");
					req.abort();
				});
				req.end();

			};

			var eventList = [];
			data.forEach(function(proxy) {
				eventList.push(function(callback) {

					validProxy(callback, proxy);
				});
			});

			async.parallel(eventList,
			// optional callback
			function(err, results) {
				// results is now equal to ['one', 'two']
				if (err) {
					return;
				}
				var proxies = [];
				if (results) {
					for (var index = 0; index < results.length; index++) {
						var rs = results[index];
						if (rs && rs.ip && rs.port) {
							proxies.push({
								ip : rs.ip,
								port : rs.port
							});
						}
					}

					if (proxies.length === 0) {
						logger.info("不存在可使用的代理");
						return;
					}
					logger.info("共有可用代理：" + proxies.length);
					var Crawler = c.Crawler;
					var urlFilter = function(data) {
						if (data.startWith("(http|https|\/)")) {

							// var reg = new RegExp("/nt/\\d*");
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
						// proxy : proxies,
						proxy : [ {
							ip : "111.161.126.99",
							port : "80"
						} ],
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
				}
			});

			// 启动爬虫

		});
	});
}

testCrawlerOptions();