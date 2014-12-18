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

/**
 * 创建对象扩展数组 该对象主要提供以下方法： 1.设定过滤规则，不允许符合规则的则不进入队列当中 2.
 * 
 */
var Queue = function(options) {
	var self = this;
	self.init(options);

	var length = self.length;
	var queueMaxLength = self.options.queueMaxLength;
	var filter = self.options.filter;
	var formatter = self.options.formatter;
	var isUnique = self.options.isUnique;
	/**
	 * 添加元素到队尾 设置了queueMaxLength属性后，当队伍长度超过该属性则不再添加
	 * 设置了isUnique属性后，当isUnique为true时，队伍验证是否重复，重复则不添加，默认是不验证。
	 */
	self.enter = function(data) {
		var self = this;

		if (data
				&& (queueMaxLength === -1 || (queueMaxLength != -1 && length < queueMaxLength))) {
			// 过滤数据
			if (filter && !filter(data)) {
				return self.length;
			}

			// 格式化数据
			if (formatter) {
				data = formatter(data);
			}

			// 重复性校验
			if (isUnique && self.contain(data)) {
				return self.length;
			}
			self.push(data);
		}
		return self.length;
	};

	/**
	 * 是否已经存在在队列当中（如果仅字符串队列，可考虑不要用这种方法）
	 */
	self.contain = function(data) {
		var datas = self;
		for (var index = 0; index < self.length; index++) {
			var _data = datas[index];
			if (_data.equals(data)) {
				return true;
			}
		}
		return false;
	};
};

Queue.prototype = [];

Queue.prototype.init = function(options) {
	var self = this;
	options = options || {};

	var defaultOptions = {
		isUnique : false, // 重复性校验标识，true为校验，false为不检验
		filter : false, // 队列过滤规则
		formatter : false, // 队列格式化规则
		queueMaxLength : -1
	// 队列最大允许数，默认为-1。缺省值时将不检测队列最大数目。
	};
	self.options = initOptions(defaultOptions, options);
};

// 一些常用方法
/**
 * 判断对象是否相等
 */
Object.prototype.equals = function(x) {
	var p;
	for (p in this) {
		if (typeof (x[p]) === 'undefined') {
			return false;
		}
	}
	for (p in this) {
		if (this[p]) {
			switch (typeof (this[p])) {
			case 'object':
				if (!this[p].equals(x[p])) {
					return false;
				}
				break;
			case 'function':
				if (typeof (x[p]) === 'undefined'
						|| (p != 'equals' && this[p].toString() != x[p]
								.toString())) {
					return false;
				}
				break;
			default:
				if (this[p] != x[p]) {
					return false;
				}
			}
		} else {
			if (x[p]) {
				return false;
			}
		}
	}
	for (p in x) {
		if (typeof (this[p]) == 'undefined') {
			return false;
		}
	}
	return true;
};


exports.Queue = Queue;