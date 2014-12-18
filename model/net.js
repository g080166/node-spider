function Net(db) {
	this.init = function() {

	}
	this.save = function(nets, callback) {
		if (!callback) {
			callback = function(err) {
				if (err) {
					console.info(err);
				}

			}
		}

		// 读取 Nets 集合
		db.collection('nets', function(err, collection) {
			if (err) {
				return callback(err);
			}
			// 为 name 属性添加索引
			collection.ensureIndex('ip', {
				unique : true,

			}, function(err, result) {
				if (err) {
					console.error(err);

				}
			});
			// 写入 Net 文档
			collection.insert(nets, {
				safe : true
			}, function(err, nets) {
				callback(err);

			});
		});
	};

	this.get = function(callback) {
		// 读取 Nets 集合
		db.collection('nets', function(err, collection) {
			if (err) {
				return callback(err);
			}
			// 查找 name 属性为 Netname 的文档
			var collection = db.collection('nets');
			// Insert some documents
			collection.find({}).toArray(function(err, docs) {
				callback(err, docs);
			});
		});
	}
};

module.exports = Net;