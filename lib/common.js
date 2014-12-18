/**
 * 判断开头是否为某字符串
 * @param str
 * @returns
 */
Object.prototype.startWith = function(str) {
	var reg = new RegExp("^" + str);
	return reg.test(this);
};

Object.prototype.endWith = function(str) {
	var reg = new RegExp(str + "$");
	return reg.test(this);
};