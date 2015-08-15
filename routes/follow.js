var mysql = require('../config/mysql');
var async = require('async');


/////////////////////////////////////////////////-----------팔로잉/팔로워 시작-----------/////////////////////////////////////////////////

exports.searhPhotoMapperUserList = function(req, res){
	
	var search_photo_mapper_user_name = req.body.user_name;
	
	//이미 사용자 팔로잉 리스트에 있는 사람이면 검색 안되게 하기
	//보낸 사용자 이름이 현재 유저 디비에 있는지 찾기	
	mysql.queryExecute("select * from pm_user_info where user_id !=? and user_name like '%"+ search_photo_mapper_user_name+"%'", [req.session.user.id], function(results, status) {
		if (!status.error && !status.empty) {
			console.log('전체 사용자 디비에서 검색한 이름의 유저가 있습니다.');
			res.json(results);
		} else if (!status.error) {
			console.log('전체 사용자 디비에서 검색한 이름의 유저가 없습니다.');
			res.json(results);
		} else {
			throw "검색 처리중 에러 발생";
		}
	});
};

exports.searhMyFollowingList = function(req, res){
	
	var search_my_following_list_user_name = req.body.user_name;
	
	//보낸 사용자 이름이 사용자의 팔로잉 리스트에 있는지 점검
	mysql.queryExecute("select * from pm_following_list where fing_user_id=? and fing_following_user_name like '%"+ search_my_following_list_user_name+"%'", [req.session.user.id], function(results, status) {
		if (!status.error && !status.empty) {
			console.log('사용자의 팔로잉 리스트 디비에서 검색한 이름의 유저가 있습니다.');
			res.json(results);
		} else if (!status.error) {
			console.log('사용자의 팔로잉 리스트 디비에서 검색한 이름의 유저가 없습니다.');
			res.json(results);
		} else {
			throw "검색 처리중 에러 발생";
		}
	});
};


exports.addFollowing = function(req, res){
	
	var following_id = req.body.following_id;
	var following_name = req.body.following_name;
	
	console.log('following_id : ' + following_id);
	
	//0) 보낸 아이디가 req.session.user.id 와 다른건지 체크하기
	
	//1) 보낸 아이디가 pm_user_info에 있는 id 인지 체크하기
	//2) 이미 팔로잉 한건 아닌지 체크하기
	
	//0) 보낸 아이디가 req.session.user.id 와 다른건지 체크하기
	if(following_id === req.session.user.id){
		res.send('<script>alert("현재 사용자와 같은 id입니다.");location.reload(true);</script>');
	}else{
		//1) 보낸 아이디가 pm_user_info에 있는 id 인지 체크하기
		mysql.queryExecute('select * from pm_user_info where ?', {
			user_id : following_id
		}, function(results, status) {
			if (!status.error && !status.empty) {
				console.log('디비에 있는 사용자 입니다.');
				// 1) 보낸 이름이 pm_user_info에 있는 이름인지 체크하기
				
				console.log('디비 저장된 사용자의 이름 : ' + results[0].user_name);
				console.log('전송받은 사용자의 이름 : ' + following_name);
				
				if(results[0].user_name !== following_name){
					console.log('사용자의 이름이 잘못되었습니다.');
					
					res.send('<script>alert("사용자의 이름이 잘못되었습니다.");location.reload(true);</script>');
				}else{
					// 2) 이미 팔로잉 한건 아닌지 체크하기
					mysql.queryExecute('select * from pm_following_list where fing_user_id =? and fing_following_user_id=?', [req.session.user.id, following_id], function(results, status) {
						if (!status.error && !status.empty) {
							console.log('이미 팔로잉 리스트에 있는 사용자입니다.');
							res.send('<script>alert("이미 팔로잉 리스트에 있는 사용자입니다.");location.reload(true);</script>');
							
						} else if (!status.error) {
							console.log('팔로잉 리스트에 없는 사용자입니다.');
							
							mysql.queryExecute('insert into pm_following_list set ?',{
								fing_user_id:req.session.user.id,
								fing_following_user_id:following_id,
								fing_following_user_name:following_name
							},function(result,status){
								mysql.queryExecute('insert into pm_follower_list set ?',{
									fer_user_id:following_id,
									fer_follower_user_id:req.session.user.id,
									fer_follower_user_name:req.session.user.name
								},function(result,status){
									res.send('<script>alert("팔로잉이 추가되었습니다.");location.reload(true);</script>');
								});
							});
							
							
						} else {
							throw "검색 처리중 에러 발생";
						}
					});
				}
			} else if (!status.error) {
				console.log('디비에 없는 사용자 입니다.');
				res.send('<script>alert("디비에 없는 사용자 입니다.");location.reload(true);</script>');
			} else {
				throw "검색 처리중 에러 발생";
			}
			
		});
	}
};


exports.followingWorldMap = function(req, res) {
	
	var following_user_id = req.body.user_id;
	var following_user_name = req.body.user_name;
	
	var following_visit_results = [];
	var following_lists = [];
	
	var following_user = {};
	following_user.id = following_user_id;
	following_user.name = following_user_name;
	
	console.log('following_user_id : ' + following_user_id);
	console.log('following_user_name : ' + following_user_name);
	
	if (!following_user_id || !following_user_name || !req.session.user.id) {
		res.redirect('/');
	} else {
		async.parallel([
		function(callback) {
			console.log('--- following user visit_place ---');
			mysql.queryExecute('select * from pm_visit_place where ?', {
				vp_user_id : following_user_id
			}, function(results, status) {
				if (!status.error && !status.empty) {
					following_visit_results = results;
					console.log('다녀온 국가가 있습니다.');
				} else if (!status.error) {
					console.log('다녀온 국가가 없습니다.');
				} else {
					throw "검색 처리중 에러 발생";
				}
				callback(null, results);
			});
		},
		
		function(callback) {
			console.log('--- following user color find ---');
			mysql.queryExecute('select * from pm_settings where ?', {
				st_user_id : following_user_id
			}, function(results, status) {
				if (!status.error && !status.empty) {
					
					following_user.color = results[0].st_user_color;
					
					console.log('팔로잉 유저의 설정이 있습니다.');
				} else if (!status.error) {
					console.log('팔로잉 유저의 설정이 없습니다.');
				} else {
					throw "검색 처리중 에러 발생";
				}
				callback(null, results);
			});
		},
		
		function(callback) {
			console.log('--- show following list ---');
						
			mysql.queryExecute('select * from pm_following_list where ?', {
				fing_user_id : req.session.user.id
			}, function(results, status) {
				if (!status.error && !status.empty) {
					following_lists = results;
					console.log('팔로잉 리스트가 있습니다.');
				} else if (!status.error) {
					console.log('팔로잉 리스트가 없습니다.');
				} else {
					throw "검색 처리중 에러 발생";
				}
				callback(null, results);
			});
		},],

		// 모든 task를 끝내고, 아래 callback으로 에러와 배열인자가 전달됩니다.
		// ------------------------------------------------------
		function(err, results) {
			console.log('--- following World Map start ---');
			console.log(arguments);
			
			res.render('following_world_map', {
				title : 'following_world_map',
				user : req.session.user,
				following_user : following_user,
				following_lists : following_lists,
				following_visit_results : following_visit_results
			});

		});
	}
	
};

exports.allFollowingWorldMap = function(req, res) {

	// 내가 팔로잉 한 사람들이 다녀온 국가 필요
	// 내가 팔로잉 한 사람들의 리스트 그 사람들이 다녀온 국가 리스트

	var following_info_lists = [];
	var following_visit_results = [];
	var following_lists_tmp = [];

	if (!req.session.user.id) {
		res.redirect('/');
	} else {
		
		mysql.queryExecute('select * from pm_following_list where ?', {
			fing_user_id : req.session.user.id
		}, function(results, status) {
			if (!status.error && !status.empty) {
				console.log('팔로잉 리스트가 있습니다.');
				
				following_info_lists = results;
				
				console.log(results);
				
				following_lists_tmp = results.map(function(elem){
					return elem.fing_following_user_id;
				}).join(",");
				
				console.log(following_lists_tmp);
				
				console.log('--- show following visit list ---');
				
				mysql.queryExecute('select * from pm_visit_place where vp_user_id in (' + following_lists_tmp + ') order by vp_nation_code asc', {
				}, function(results, status) {
					if(!status.error && !status.empty) {
						console.log(results);
						following_visit_results = results;
						
						
						console.log('--- All following World Map start ---');
		
						console.log('following lists : ');
						console.log(following_info_lists);
						console.log('following_visit_results : ');
						console.log(following_visit_results);
						
						res.render('all_following_world_map', {
							title : 'all_following_world_map',
							user : req.session.user,
							following_lists : following_info_lists,
							following_visit_results : following_visit_results
						});
				
					}else if(!status.error) {
						console.log('팔로잉에 다녀온 국가가 없습니다.');
						res.send('<script>alert("팔로잉에 다녀온 국가가 없습니다.");history.back();</script>');
					}else{
						throw "검색 처리중 에러 발생";
					}
				});
				
			} else if (!status.error) {
				console.log('팔로잉 리스트가 없습니다.');
				res.send('<script>alert("팔로잉 리스트가 없습니다.");history.back();</script>');
			} else {
				throw "검색 처리중 에러 발생";
			}
		});
	}
};

/////////////////////////////////////////////////-----------팔로잉/팔로워 끝-----------/////////////////////////////////////////////////