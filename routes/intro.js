var mysql = require('../config/mysql');
var async = require('async');

/////////////////////////////////////////////////-----------intro 시작-----------/////////////////////////////////////////////////

exports.intro = function(req, res) {
	res.render('intro', {
		title : 'Intro',
		user : req.session.user
	});
};

exports.tutorial = function(req, res) {
	res.render('tutorial', {
		title : 'tutorial',
		user : req.session.user
	});
};

/////////////////////////////////////////////////-----------intro 끝-----------/////////////////////////////////////////////////