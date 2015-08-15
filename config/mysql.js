var mysql = require('mysql');
var config = require('./config');
var pool = mysql.createPool(config.mysql);
// ===========================================================
pool.queryExecute = function(query, data, callback) { // 쿼리 실행 후 결과 리턴
	pool.getConnection(function(err, connection) {
		connection.query(query, data, function(err, rows, fields, test) {
			if (err === null) {
				if (rows.length === 0) {
					callback([], {
						error : false,
						empty : true
					});
				} else {
					callback(rows, {
						error : false,
						empty : false
					});
				}
			} else {
				console.log(err);
				callback([], {
					error : true,
					empty : false
				});
			}
			connection.release();
		});
	});
};
pool.sendQueryResult = function(query, data, res, callback) { // 쿼리 실행 후 결과 전송
																// (ajax 처리용)
	pool.getConnection(function(err, connection) {
		connection.query(query, data, function(err, rows) {
			if (err === null) {
				if (rows.length === 0) {
					res.send({
						data : [],
						status : {
							error : false,
							empty : true
						}
					});
				} else {
					res.send({
						data : rows,
						status : {
							error : false,
							empty : false
						}
					});
				}
			} else {
				console.log(err);
				res.send({
					data : [],
					status : {
						error : true,
						empty : false
					}
				});
			}
			connection.release();
		});
	});
};
//===========================================================

module.exports = pool;