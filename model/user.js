function User(db) {
	this.init = function() {

	}
	this.save = function(users, callback) {
		if (!callback) {
			callback = function(err) {
				if (err) {
					console.info(err);
				}

			}
		}

		// 读取 users 集合
		db.collection('users', function(err, collection) {
			if (err) {
				return callback(err);
			}
			// 为 name 属性添加索引
			collection.ensureIndex('url', {
				unique : true,

			}, function(err, result) {
				if (err) {
					console.error(err);

				}
			});
			// 写入 user 文档
			collection.insert(users, {
				safe : true
			}, function(err, users) {
				callback(err);

			});
		});
	};

	this.get = function(users, callback) {
		// 读取 users 集合
		db.collection('users', function(err, collection) {
			if (err) {
				return callback(err);
			}
			// 查找 name 属性为 username 的文档
			var collection = db.collection('users');
			// Insert some documents
			collection.find({}).toArray(function(err, docs) {
				callback(err, docs);
			});
		});
	}
};

module.exports = User;
