var mysql = require('../config/mysql');
var async = require('async');

/////////////////////////////////////////////////-----------통계 시작-----------/////////////////////////////////////////////////

exports.statistics = function(req, res) {
	
	var visit_place_nation_code_lists = [];
	var visit_nation_lists = [];
	var visit_city_lists = [];
	
	var want_place_nation_code_lists = [];
	var want_nation_lists = [];
	var want_city_lists = [];
	
	var most_visit_nation_code = [];
	var most_visit_nation = [];
	var most_visit_nation_count = [];
	var most_visit_city = [];
	var most_visit_city_count = [];
	
	var most_want_nation_code = [];
	var most_want_nation = [];
	var most_want_nation_count = [];
	var most_want_city = [];
	var most_want_city_count = [];
	
	var most_camera_brand = [];
	var most_camera_model = [];
	
	var total_count = {};
	
	total_count.visit_place = 0;
	total_count.want_place = 0;
	total_count.make_name = 0;
	total_count.model_name = 0;
		
	if (!req.session.user) {
		res.redirect('/');
	}else{
		
		async.parallel([
		//visit nation list
		function(callback) {
			console.log('-- visit nation list --');
			
			//visit nation list waterfall
			async.waterfall([ function(callback) {
				console.log('--- visit_place ---');
				//1. 다녀온 국가 리스트에 국가코드 가져오기
				mysql.queryExecute('select * from pm_visit_place where ?', {
					vp_user_id : req.session.user.id
				}, function(results, status) {
					if (!status.error && !status.empty) {
						console.log('다녀온 국가가 있습니다.');
						
						visit_place_nation_code_lists = results.map(function(elem){
							return elem.vp_nation_code;
						}).join("\",\"");
						
						visit_city_lists = results;
						
						console.log('visit_place_nation_code_lists : ',visit_place_nation_code_lists);
						console.log('visit_city_lists : ',visit_city_lists);
						//console.log('results : ',results);
						
					} else if (!status.error) {
						console.log('다녀온 국가가 없습니다.');
					} else {
						throw "검색 처리중 에러 발생";
					}
					callback(null, visit_place_nation_code_lists);
				});
			},
			
			function(visit_place_nation_code_lists, callback) {
				//2. 국가 코드로 nation_info에 국가 이름 리스트 가져오기
				mysql.queryExecute('select * from pm_nation_info where nation_code in (\"' + visit_place_nation_code_lists + '\") order by nation_code asc', {
				}, function(results, status) {
					if(!status.error && !status.empty) {
						console.log(results);
						visit_nation_lists = results;
						console.log('다녀온 국가 리스트에 대한 국가 리스트가 있습니다.');
						
						console.log('visit_nation_lists : ',visit_nation_lists);
						//console.log('results : ',results);
						
					}else if(!status.error) {
						console.log('다녀온 국가 리스트에 대한 국가 리스트가 없습니다.');
					}else{
						throw "검색 처리중 에러 발생";
					}
					callback(null, results);
				});
			},],
			// 모든 task를 끝내고, 아래 callback으로 에러와 배열인자가 전달됩니다.
			// ------------------------------------------------------
			function(err, results) {
				console.log('--- visit_place finish ---');
				console.log(arguments);
				callback(null, arguments);
			});
			//visit nation list waterfall
		},
		
		function(callback) {
			console.log('--- want nation list ---');
			
			//want nation list waterfall
			async.waterfall([ function(callback) {
				console.log('--- want_place ---');
				//1. 가고싶은 국가 리스트에 국가코드 가져오기
				mysql.queryExecute('select * from pm_want_place where ?', {
					wp_user_id : req.session.user.id
				}, function(results, status) {
					if (!status.error && !status.empty) {
						console.log('가고싶은 국가가 있습니다.');
						
						want_place_nation_code_lists = results.map(function(elem){
							return elem.wp_nation_code;
						}).join("\",\"");
						
						want_city_lists = results;
						
						console.log('want_place_nation_code_lists : ',want_place_nation_code_lists);
						console.log('want_city_lists : ',want_city_lists);
						//console.log('results : ',results);
						
					} else if (!status.error) {
						console.log('가고싶은 국가가 없습니다.');
					} else {
						throw "검색 처리중 에러 발생";
					}
					callback(null, want_place_nation_code_lists);
				});
			},
			
			function(want_place_nation_code_lists, callback) {
				//2. 국가 코드로 nation_info에 국가 이름 리스트 가져오기
				mysql.queryExecute('select * from pm_nation_info where nation_code in (\"' + want_place_nation_code_lists + '\") order by nation_code asc', {
				}, function(results, status) {
					if(!status.error && !status.empty) {
						console.log(results);
						want_nation_lists = results;
						console.log('가고싶은 국가 리스트에 대한 국가 리스트가 있습니다.');
						
						console.log('want_nation_lists : ',want_nation_lists);
						//console.log('results : ',results);
						
					}else if(!status.error) {
						console.log('가고싶은 국가 리스트에 대한 국가 리스트가 없습니다.');
					}else{
						throw "검색 처리중 에러 발생";
					}
					callback(null, results);
				});
			},],
			// 모든 task를 끝내고, 아래 callback으로 에러와 배열인자가 전달됩니다.
			// ------------------------------------------------------
			function(err, results) {
				console.log('--- want_place finish ---');
				console.log(arguments);
				callback(null, arguments);
			});
			//want nation list waterfall
			
		},
		
		function(callback) {
			console.log('--- total_photo_make_name ---');
			
			
			mysql.queryExecute('select count(*) as cnt from (select * from pm_photo group by photo_make_name, photo_user_id)cc', {}, function(results, status) {
				if (!status.error && !status.empty) {
					console.log('전체 사진 제조사 갯수가 있습니다.');
					console.log(results);
					console.log(results[0].cnt);
					total_count.make_name = results[0].cnt;
				} else if (!status.error) {
					console.log('전체 사진 제조사 갯수가 없습니다.');
				} else {
					throw "검색 처리중 에러 발생";
				}
				callback(null, results);
			});
		},
		
		function(callback) {
			console.log('--- total_photo_brand_name ---');
			
			mysql.queryExecute('select count(*) as cnt from (select * from pm_photo group by photo_model_name, photo_user_id)cc', {}, function(results, status) {
				if (!status.error && !status.empty) {
					console.log('전체 사진 모델명 갯수가 있습니다.');
					console.log(results);
					console.log(results[0].cnt);
					total_count.model_name = results[0].cnt;
				} else if (!status.error) {
					console.log('전체 사진 모델명 갯수가 없습니다.');
				} else {
					throw "검색 처리중 에러 발생";
				}
				callback(null, results);
			});
		},
		
		
		
		function(callback) {
			console.log('--- total_visit_place ---');
			
			mysql.queryExecute('select count(*) as cnt from pm_visit_place', {}, function(results, status) {
				if (!status.error && !status.empty) {
					console.log('전체 다녀온 갯수가 있습니다.');
					console.log(results);
					console.log(results[0].cnt);
					total_count.visit_place = results[0].cnt;
				} else if (!status.error) {
					console.log('전체 다녀온 갯수가 없습니다.');
				} else {
					throw "검색 처리중 에러 발생";
				}
				callback(null, results);
			});
		},
		
		function(callback) {
			console.log('--- total_want_place ---');
			
			mysql.queryExecute('select count(*) as cnt from pm_want_place', {}, function(results, status) {
				if (!status.error && !status.empty) {
					console.log('전체 가고싶은 갯수가 있습니다.');
					console.log(results);
					console.log(results[0].cnt);
					total_count.want_place = results[0].cnt;
				} else if (!status.error) {
					console.log('전체 가고싶은 갯수가 없습니다.');
				} else {
					throw "검색 처리중 에러 발생";
				}
				callback(null, results);
			});
			
		},
				
		function(callback) {
			console.log('--- most_camera_brand ---');
			
			mysql.queryExecute('select photo_make_name, count(photo_make_name) as photo_make_name_count from (select * from pm_photo group by photo_make_name, photo_user_id)cc group by (photo_make_name) order by count(photo_make_name) desc limit 3', {}, function(results, status) {
				if (!status.error && !status.empty) {
					console.log('사람들이 많이 쓰는 카메라 브랜드 통계 낼 데이터가 있습니다.');
					console.log('most_camera_brand : ', results);
					most_camera_brand = results;
				} else if (!status.error) {
					console.log('사람들이 많이 쓰는 카메라 브랜드 통계 낼 데이터가 없습니다.');
				} else {
					throw "검색 처리중 에러 발생";
				}
				callback(null, results);
			});
		},
		
		
		function(callback) {
			console.log('--- most_camera_model ---');
			mysql.queryExecute('select photo_model_name, count(photo_model_name) as photo_model_name_count from (select * from pm_photo group by photo_model_name, photo_user_id)cc group by (photo_model_name) order by count(photo_model_name) desc limit 3', {}, function(results, status) {
				if (!status.error && !status.empty) {
					console.log('사람들이 많이 쓰는 카메라 모델 통계 낼 데이터가 있습니다.');
					console.log('most_camera_model : ', results);
					most_camera_model = results;
				} else if (!status.error) {
					console.log('사람들이 많이 쓰는 카메라 모델 낼 데이터가 없습니다.');
				} else {
					throw "검색 처리중 에러 발생";
				}
				callback(null, results);
			});
		},
		
		function(callback) {
			console.log('--- most_visit_nation ---');
			
			//most visit nation list waterfall
			async.waterfall([ function(callback) {
				console.log('--- visit_place ---');
				//1. 가고싶은 국가 리스트에 국가코드 가져오기
				
				mysql.queryExecute('select vp_nation_code, COUNT(vp_nation_code) as vp_nation_count from pm_visit_place group by (vp_nation_code) order by count(vp_nation_code) desc limit 3', {}, function(results, status) {
					if (!status.error && !status.empty) {
						console.log('사람들이 많이 다녀온 국가 통계 낼 데이터가 있습니다.');
						console.log('most_visit_nation_code : ', results);
						
						most_visit_nation_code = results.map(function(elem){
							return elem.vp_nation_code;
						}).join("\",\"");
						
						most_visit_nation_count = results.map(function(elem){
							return elem.vp_nation_count;
						});
						
						console.log('most_visit_nation_count : ', most_visit_nation_count);
						
					} else if (!status.error) {
						console.log('사람들이 많이 다녀온 국가 통계 낼 데이터가 없습니다.');
					} else {
						throw "검색 처리중 에러 발생";
					}
					callback(null, most_visit_nation_code);
				});
				
			},

			function(most_visit_nation_code, callback) {
				//2. 국가 코드로 nation_info에 국가 이름 리스트 가져오기
				console.log('most_visit_nation_code : ', most_visit_nation_code);
				mysql.queryExecute('select * from pm_nation_info where nation_code in (\"' + most_visit_nation_code + '\")', {
				}, function(results, status) {
					if(!status.error && !status.empty) {
						console.log(results);
						most_visit_nation = results;
						console.log('사람들이 많이 다녀온 국가 리스트에 대한 국가 리스트가 있습니다.');
						
						console.log('most_visit_nation : ',most_visit_nation);
						//console.log('results : ',results);
						
					}else if(!status.error) {
						console.log('사람들이 많이 다녀온 국가 리스트에 대한 국가 리스트가 없습니다.');
					}else{
						throw "검색 처리중 에러 발생";
					}
					callback(null, results);
				});
			},],
			// 모든 task를 끝내고, 아래 callback으로 에러와 배열인자가 전달됩니다.
			// ------------------------------------------------------
			function(err, results) {
				console.log('--- visit_place finish ---');
				console.log(arguments);
				callback(null, arguments);
			});
			//most visit nation list waterfall
			
		},
		
		function(callback) {
			console.log('--- most_visit_city ---');
			mysql.queryExecute('select vp_city_name, vp_nation_code, COUNT(vp_city_name) as vp_city_count from pm_visit_place group by (vp_city_name) order by count(vp_city_name) desc limit 3', {}, function(results, status) {
				if (!status.error && !status.empty) {
					console.log('사람들이 많이 다녀온 도시 통계 낼 데이터가 있습니다.');
					console.log('most_visit_city : ', results);
					most_visit_city = results;
					
					most_visit_city_count = results.map(function(elem){
						return elem.vp_city_count;
					});
					
					console.log('most_visit_city_count : ', most_visit_city_count);
					
				} else if (!status.error) {
					console.log('사람들이 많이 다녀온 도시 통계 낼 데이터가 없습니다.');
				} else {
					throw "검색 처리중 에러 발생";
				}
				callback(null, results);
			});
		},
		
		function(callback) {
			console.log('--- most_want_nation ---');
			
			//most want nation list waterfall
			async.waterfall([ function(callback) {
				console.log('--- want_place ---');
				//1. 가고싶은 국가 리스트에 국가코드 가져오기
				
				mysql.queryExecute('select wp_nation_code, COUNT(wp_nation_code) as wp_nation_count from pm_want_place group by (wp_nation_code) order by count(wp_nation_code) desc limit 3', {}, function(results, status) {
					if (!status.error && !status.empty) {
						console.log('사람들이 많이 가고싶은 국가 통계 낼 데이터가 있습니다.');
						console.log('most_want_nation_code : ', results);
						
						most_want_nation_code = results.map(function(elem){
							return elem.wp_nation_code;
						}).join("\",\"");
						
						most_want_nation_count = results.map(function(elem){
							return elem.wp_nation_count;
						});
						
						console.log('most_want_nation_count : ', most_want_nation_count);
						
					} else if (!status.error) {
						console.log('사람들이 많이 가고싶은 국가 통계 낼 데이터가 없습니다.');
					} else {
						throw "검색 처리중 에러 발생";
					}
					callback(null, most_want_nation_code);
				});
				
			},

			function(most_want_nation_code, callback) {
				//2. 국가 코드로 nation_info에 국가 이름 리스트 가져오기
				console.log('most_want_nation_code : ', most_want_nation_code);
				mysql.queryExecute('select * from pm_nation_info where nation_code in (\"' + most_want_nation_code + '\")', {
				}, function(results, status) {
					if(!status.error && !status.empty) {
						console.log(results);
						most_want_nation = results;
						console.log('사람들이 많이 가고싶은 국가 리스트에 대한 국가 리스트가 있습니다.');
						
						console.log('most_want_nation : ',most_want_nation);
						//console.log('results : ',results);
						
					}else if(!status.error) {
						console.log('사람들이 많이 가고싶은 국가 리스트에 대한 국가 리스트가 없습니다.');
					}else{
						throw "검색 처리중 에러 발생";
					}
					callback(null, results);
				});
			},],
			// 모든 task를 끝내고, 아래 callback으로 에러와 배열인자가 전달됩니다.
			// ------------------------------------------------------
			function(err, results) {
				console.log('--- want_place finish ---');
				console.log(arguments);
				callback(null, arguments);
			});
			//most want nation list waterfall
			
		},
		
		function(callback) {
			console.log('--- most_want_city ---');
			mysql.queryExecute('select wp_city_name, wp_nation_code, COUNT(wp_city_name) as wp_city_count from pm_want_place group by (wp_city_name) order by count(wp_city_name) desc limit 3', {}, function(results, status) {
				if (!status.error && !status.empty) {
					console.log('사람들이 많이 가고싶은 도시 통계 낼 데이터가 있습니다.');
					console.log('most_want_city : ', results);
					most_want_city = results;
					
					most_want_city_count = results.map(function(elem){
						return elem.wp_city_count;
					});
					
					console.log('most_want_city_count : ', most_want_city_count);
					
				} else if (!status.error) {
					console.log('사람들이 많이 가고싶은 도시 낼 데이터가 없습니다.');
				} else {
					throw "검색 처리중 에러 발생";
				}
				callback(null, results);
			});
		},],

		// 모든 task를 끝내고, 아래 callback으로 에러와 배열인자가 전달됩니다.
		// ------------------------------------------------------
		function(err, results) {
			console.log('--- statistics start ---');
			console.log(arguments);

			res.render('statistics_view', {
				title : 'statistics',
				user : req.session.user,
				
				visit_nation_lists : visit_nation_lists,
				visit_city_lists : visit_city_lists,
				want_nation_lists : want_nation_lists,
				want_city_lists : want_city_lists,
				
				most_visit_nation : most_visit_nation,
				most_visit_nation_count : most_visit_nation_count,
				most_visit_city : most_visit_city,
				most_visit_city_count : most_visit_city_count,
				most_want_nation : most_want_nation,
				most_want_nation_count : most_want_nation_count,
				most_want_city : most_want_city,
				most_want_city_count : most_want_city_count,
				
				most_camera_brand : most_camera_brand,
				most_camera_model : most_camera_model,
				
				total_count : total_count
				
			});

		});
	}
};



exports.DeleteUserVisitPlace = function(req, res) {
	
	var vp_nation_code = req.body.nation_code;
	var vp_city_name = req.body.city_name;

	var checkQueryData;
	var deleteQueryData;
	
	if(!vp_city_name){
		vp_city_name = vp_nation_code + "CITY";
		
		checkQueryData = [req.session.user.id, vp_nation_code];
		deleteQueryData = [req.session.user.id, vp_nation_code, vp_city_name];
		
		console.log(vp_city_name);
		mysql.queryExecute('select * from pm_photo where photo_user_id=? and photo_nation_code=?', checkQueryData, function(results, status) {
			if (!status.error && !status.empty) {
				console.log('다녀온 국가에 사진이 있습니다.');
				res.send('<script>alert("다녀온 국가에 사진이 있습니다.");history.back();</script>');
			} else if (!status.error) {
				console.log('다녀온 국가에 사진이 없습니다.');
				
				mysql.queryExecute('delete from pm_visit_place where vp_user_id=? and vp_nation_code=? and vp_city_name=?', deleteQueryData,
						function(result, status) {
					res.redirect('/statistics');
				});
				
			} else {
				throw "검색 처리중 에러 발생";
			}
		});
	}else{
		checkQueryData = [req.session.user.id, vp_nation_code, vp_city_name];
		deleteQueryData = [req.session.user.id, vp_nation_code, vp_city_name];
		
		console.log(vp_city_name);
		mysql.queryExecute('select * from pm_visit_place where vp_user_id=? and vp_nation_code=? and vp_city_name=?', checkQueryData, function(results, status) {
			if (!status.error && !status.empty) {
				console.log('vp_id를 찾습니다.');
				
				mysql.queryExecute('select * from pm_photo where photo_user_id=? and photo_vp_id=?', [req.session.user.id, results[0].vp_id], function(results, status) {
					if (!status.error && !status.empty) {
						console.log('다녀온 도시에 사진이 있습니다.');
						res.send('<script>alert("다녀온 도시에 사진이 있습니다.");history.back();</script>');
					} else if (!status.error) {
						console.log('다녀온 도시에 사진이 없습니다.');
						
						mysql.queryExecute('delete from pm_visit_place where vp_user_id=? and vp_nation_code=? and vp_city_name=?', deleteQueryData,
								function(result, status) {
							res.redirect('/statistics');
						});
						
					} else {
						throw "검색 처리중 에러 발생";
					}
				});
			} else if (!status.error) {
				console.log('vp_id를 못 찾았습니다.');
				res.send('<script>alert("다녀온 도시로 지정되어 있지 않습니다.");history.back();</script>');
			} else {
				throw "검색 처리중 에러 발생";
			}
		});
	}
};

exports.DeleteUserWantPlace = function(req, res) {
	var wp_nation_code = req.body.nation_code;
	var wp_city_name = req.body.city_name;
	
	if(!wp_city_name){
		wp_city_name = wp_nation_code + "CITY";
		console.log('가고싶은국가 삭제');
	}
	
	var deleteQueryData = [req.session.user.id, wp_nation_code, wp_city_name];

	console.log('삭제 시작');
	mysql.queryExecute('delete from pm_want_place where wp_user_id=? and wp_nation_code=? and wp_city_name=?', deleteQueryData,
			function(result, status) {
		console.log(result);
		console.log('삭제성공');
		res.redirect('/statistics');
	});
};


/////////////////////////////////////////////////-----------통계 끝-----------/////////////////////////////////////////////////