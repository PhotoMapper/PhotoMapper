/*
 * GET home page.
 */

var mysql = require('../config/mysql');
var async = require('async');

/////////////////////////////////////////////////-----------페이지 연결 시작-----------/////////////////////////////////////////////////

//예린 언니 통계
exports.hangel = function(req, res) {
	
	console.log(((req.session.user.birth).date()).format());
	console.log((req.session.user.birth).date("YYYY-MM-DD"));
	console.log(typeof(req.session.user.birth));
	if (!req.session.user) {
		res.redirect('/');
	}else{
		res.render('hangel', {
			title : 'hangel',
			user : req.session.user,
			result : {}
		});
	}
	
};

exports.friendPhotoView = function(req, res) {
	
	if (!req.session.user) {
		res.redirect('/');
	}else{
		res.render('friend_photo_view', {
			title : 'friend_photo_view',
			user : req.session.user
		});
	}
	
};

/////////////////////////////////////////////////-----------페이지 연결 끝-----------/////////////////////////////////////////////////