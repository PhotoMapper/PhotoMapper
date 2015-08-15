var mysql = require('../config/mysql');
var async = require('async');

/////////////////////////////////////////////////-----------setting 시작-----------/////////////////////////////////////////////////

exports.setting = function(req, res) {
	if (!req.session.user) {
		res.redirect('/');
	} else {
		res.render('setting', {
			title : 'setting',
			user : req.session.user
		});
	}
};


exports.modityUserColor = function(req, res) {

	var ch_user_color = req.body.user_color;
	
	if(!ch_user_color){
		res.send('<script>alert("색깔 값이 없습니다.");history.back();</script>');
	}else{
		
		// 사용자 지도 색깔 바꾸기
		mysql.queryExecute('update pm_settings set st_user_color=? where st_user_id=?', [ch_user_color, req.session.user.id ], function(result,status) {
			console.log('사용자 지도 색깔 바꾸기');
			
			req.session.user.color = ch_user_color;
			
			res.redirect('/setting');
			
		});
	
	}
};

exports.modityUserBirth = function(req, res) {

	var ch_user_birth = req.body.user_birth;
	
	if(!ch_user_birth){
		res.send('<script>alert("생년월일 값이 없습니다.");history.back();</script>');
	}else{
		// 사용자 생년월일 바꾸기
		mysql.queryExecute('update pm_user_info set user_birth=? where user_id=?', [ch_user_birth, req.session.user.id ], function(result,status) {
			console.log('사용자 생년월일 바꾸기');

			req.session.user.birth = ch_user_birth;
			
			res.redirect('/setting');
							
		});
	}
	
};

exports.modityUserNation = function(req, res) {

	
	var ch_user_nation = req.body.user_nation;
	
	if(!ch_user_nation){
		res.send('<script>alert("국가 값이 없습니다.");history.back();</script>');
	}else{
		// 사용자 국가 바꾸기
		mysql.queryExecute('update pm_user_info set user_nation=? where user_id=?', [ch_user_nation, req.session.user.id ], function(result,status) {
			console.log('사용자 국가 바꾸기');
			
			req.session.user.nation = ch_user_nation;
			
			res.redirect('/setting');
						
		});
	}
};

exports.modityUserEmail = function(req, res) {

	
	var ch_user_email = req.body.user_email;
	
	if(!ch_user_email){
		res.send('<script>alert("이메일 값이 없습니다.");history.back();</script>');
	}else{
		// 사용자 이메일 바꾸기
		mysql.queryExecute('update pm_user_info set user_email=? where user_id=?', [ch_user_email, req.session.user.id ], function(result,status) {
			console.log('사용자 이메일 바꾸기');
			
			req.session.user.email = ch_user_email;
			
			res.redirect('/setting');
			
		});
	}
};

exports.DeleteUser = function(req, res) {
		
	//계정 삭제 하기
	
	//계정 삭제 할때는
	//pm_follower_list 지우고
	//pm_following_list 지우고
	//pm_photo 지우고
	//pm_visit_place 지우고
	//pm_want_place 지우기
	
	//설정 계정 삭제 (없을 때는 삭제 되지 않게 처리하기)
	
	mysql.queryExecute('delete from pm_following_list where fing_user_id=?', req.session.user.id, function(result, status) {

		mysql.queryExecute('delete from pm_follower_list where fer_follower_user_id=?', req.session.user.id, function(result, status) {
			
			mysql.queryExecute('delete from pm_photo where photo_user_id=?', req.session.user.id, function(result, status) {
				
				mysql.queryExecute('delete from pm_visit_place where vp_user_id=?', req.session.user.id, function(result, status) {
					
					mysql.queryExecute('delete from pm_want_place where wp_user_id=?', req.session.user.id, function(result, status) {
						
						mysql.queryExecute('delete from pm_settings where st_user_id=?', req.session.user.id, function(result, status) {
							
							mysql.queryExecute('delete from pm_user_info where user_id=?', req.session.user.id, function(result, status) {
								
								delete req.session.login;
								delete req.session.user;
								req.logout();
								res.redirect('/');
								
							});
						});
					});
				});
			});
		});
	});
};

/////////////////////////////////////////////////-----------setting 끝-----------/////////////////////////////////////////////////
