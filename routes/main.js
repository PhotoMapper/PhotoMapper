var mysql = require('../config/mysql');
var async = require('async');

/////////////////////////////////////////////////-----------main 시작-----------/////////////////////////////////////////////////


exports.nationStatistic = function(req, res) {
	
	var nation_code = req.body.nation_code;
	
	console.log('nation_code : ',nation_code);
	
	if(!nation_code){
		res.send('<script>alert("국가 코드가 없습니다.");history.back();</script>');
	}else{
		
		mysql.queryExecute("select * from pm_nation_info where ?", {nation_code : nation_code}, function(results, status) {
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
	}
};


exports.main = function(req, res) {

	var visit_results = [];
	var want_results = [];
	var search_result = {};
	var following_lists = [];
	
	var stats = {};

	var search_content = req.body.search_content;
	
	if (!req.session.user) {
		res.redirect('/');
	} else {
		if(req.session.user.check === "F"){
			console.log("처음 사용자 입니다.");
			// user 디비 수정하기 F->T로 바꾸기
			mysql.queryExecute('update pm_user_info set user_check=? where user_id=?', ["T", req.session.user.id ], function(result,status) {
				console.log('처음 사용자 끝 이제 기존 사용자 입니다.');
				req.session.user.check = "T";
			});
		}
		
		async.parallel([
		function(callback) {
			console.log('--- visit_place ---');
			mysql.queryExecute('select * from pm_visit_place where ?', {
				vp_user_id : req.session.user.id
			}, function(results, status) {
				if (!status.error && !status.empty) {
					visit_results = results;
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
			console.log('--- search ---');
			if (!search_content) {
				console.log('search_content : ' + search_content);
				search_content = null;
				callback(null, search_content);

			} else {
				console.log('국가 검색 시작');
				mysql.queryExecute('select * from pm_nation_info where ?', {
					nation_name : search_content
				}, function(result, status) {
					if (!status.error && !status.empty) {
						search_result = result[0];
						console.log('search_content : ' + search_result);
						console.log('국가 검색 한 결과가 있습니다.');

						callback(null, result[0]);

						
					} else if (!status.error) {
						console.log('국가 검색 한 결과가 없습니다.');
						
						console.log('도시 검색 시작');
						mysql.queryExecute('select * from pm_city_info where ?', {
							city_name : search_content
						}, function(c_result, status) {
							if (!status.error && !status.empty) {
								search_result.nation_code = c_result[0].si_nation_code;
								search_result.city_name = c_result[0].city_name;
								console.log('search_content : ' + search_result);
								console.log('도시 검색 한 결과가 있습니다.');
								
							} else if (!status.error) {
								console.log('도시 검색 한 결과가 없습니다.');
								
							} else {
								throw "검색 처리중 에러 발생";
							}
							
							callback(null, c_result[0]);
							
						});

					} else {
						throw "검색 처리중 에러 발생";
					}
				});
			}
		},
		
		function(callback) {
			console.log('--- want_place ---');
			mysql.queryExecute('select * from pm_want_place where ?', {
				wp_user_id : req.session.user.id
			}, function(results, status) {
				if (!status.error && !status.empty) {
					want_results = results;
					console.log('가고싶은 국가가 있습니다.');
				} else if (!status.error) {
					console.log('가고싶은 국가가 없습니다.');
				} else {
					throw "검색 처리중 에러 발생";
				}
				callback(null, results);
			});
		},
		
		function(callback) {
			console.log('--- stats 여행한 국가 갯수 계산 ---');
			mysql.queryExecute('select count(distinct vp_nation_code) cnt from pm_visit_place where ?', {
				vp_user_id : req.session.user.id
			}, function(results, status) {
				if (!status.error && !status.empty) {
					console.log('여행한 국가가 있습니다.');
					console.log('여행한 국가 갯수 : ' + results[0].cnt);
					
					stats.visit_place_count = results[0].cnt;
					stats.percent = parseInt((results[0].cnt / 180) * 100,10);
					
				} else if (!status.error) {
					console.log('여행한 국가가 없습니다.');
					stats.visit_place_count = 0;
				} else {
					throw "검색 처리중 에러 발생";
				}
				callback(null, results);
			});
		},
		
		function(callback) {
			console.log('--- stats 가고싶은 국가 갯수 계산 ---');
			mysql.queryExecute('select count(distinct wp_nation_code) cnt from pm_want_place where ?', {
				wp_user_id : req.session.user.id
			}, function(results, status) {
				if (!status.error && !status.empty) {
					console.log('가고싶은 국가가 있습니다.');
					console.log('가고싶은 국가 갯수 : ' + results[0].cnt);
					
					stats.want_place_count = results[0].cnt;
					
				} else if (!status.error) {
					console.log('여행한 국가가 없습니다.');
					stats.visit_place_count = 0;
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
			console.log('--- main start ---');
			console.log(arguments);

			res.render('main', {
				title : 'main',
				user : req.session.user,
				visit_results : visit_results,
				want_results : want_results,
				search_result : search_result,
				following_lists : following_lists,
				stats : stats
			});

		});
	}
};


exports.paintVisitPlace = function(req, res) {

	// 0) 국가랑 도시가 디비에 저장되어 있는지 체크하기?
	// 1) 이미 다녀온 국가 디비에 저장되어 있는지 체크하기
	// 2) 가고싶은 국가 디비에 저장되어 있는 건지 체크하기
	// 3) 가고싶은 국가 디비에 저장되어 있으면 가고 싶은 국가 디비에 있는 것을 삭제 하고 다녀온 국가로 다시 저장하게 하기
	
	// 4) 도시가 다녀온 국가 이미 국가도 다녀온 국가로 됨.

	var visit_nation_code = req.body.visit_nation_code;
	var visit_city_name = req.body.visit_city_name;
	
	var visit_date = req.body.visit_date;
	

	if(!visit_date){
		visit_date = 19900101;
	}
	
	if (!visit_city_name) {
		console.log('visit_city_name : ' + visit_city_name);
		visit_city_name = visit_nation_code + "CITY";
	}

	
	var alreadyVisitQuery = 'from pm_visit_place where vp_user_id=? and vp_nation_code=? and vp_city_name =?';
	var alreadyVisitData = [req.session.user.id, visit_nation_code, visit_city_name];
	
	// 0)-1 디비에 국가가 있는건지 체크
	mysql.queryExecute('select * from pm_nation_info where ?', {
		nation_code : visit_nation_code
	}, function(result, status) {
		if (!status.error && !status.empty) {
			console.log('디비에 있는 국가 있습니다.');
			// 0)-2 디비에 도시가 있는건지 체크
			mysql.queryExecute('select * from pm_city_info where ?', {
				city_name : visit_city_name
			}, function(result, status) {
				if (!status.error && !status.empty) {
					console.log('디비에 있는 도시 입니다.');
						
					// 1) 이미 다녀온 국가 디비에 저장되어 있는지 체크하기
					mysql.queryExecute('select * ' + alreadyVisitQuery, alreadyVisitData, function(results, status) {
						if (!status.error && !status.empty) {
							
							// res.send('<script>alert("이미 다녀온 국가로 저장 되어 있습니다.");history.back();</script>');
							console.log('이미 다녀온 국가로 저장 되어 있습니다.');
							// 1)-1 다녀온 국가 디비에 삭제
							mysql.queryExecute('delete ' + alreadyVisitQuery, alreadyVisitData, function(result, status) {
								res.redirect('/main');
							});
							
						} else if (!status.error) {

							console.log('새로운 다녀온 국가입니다.');

							var alreadyWantQuery = 'from pm_want_place where wp_user_id=? and wp_nation_code=? and wp_city_name =?';
							var alreadyWantData = [req.session.user.id, visit_nation_code, visit_city_name];
							
							// 2) 가고싶은 국가 디비에 저장되어 있는 건지 체크하기
							// 3) 가고싶은 국가 디비에 저장되어 있으면 가고 싶은 국가 디비에 있는 것을 삭제 하고 다녀온 국가로 다시 저장하게 하기	
							mysql.queryExecute('select * ' + alreadyWantQuery, alreadyWantData , function(results, status) {
								if (!status.error && !status.empty) {
									
									console.log('가고싶은 국가로 저장되어 있습니다.\n');
									console.log('가고싶은 국가를 삭제합니다.\n');
									// 삭제 코드 작성
									mysql.queryExecute('delete ' + alreadyWantQuery, alreadyWantData, function(result, status) {
										
										// 4) 최종 다녀온 국가 저장
										// 4) 도시가 다녀온 국가 이미 국가도 다녀온 국가로 됨.	
										
									});
									
								} else if (!status.error) {
									console.log('가고 싶은 국가로 저장되어 있지 않습니다.');
					
									// 4) 최종 다녀온 국가 저장
									// 4) 도시가 다녀온 국가 이미 국가도 다녀온 국가로 됨.									
											
							
								} else {
									throw "디비 처리중 에러 발생";
								}
								
								// 4) 최종 다녀온 국가 저장
								// 4) 도시가 다녀온 국가 이미 국가도 다녀온 국가로 됨.	
								mysql.queryExecute('insert into pm_visit_place set ?', {
									vp_user_id : req.session.user.id,
									vp_nation_code : visit_nation_code,
									vp_city_name : visit_city_name,
									vp_date : visit_date
								}, function(result, status) {
									console.log('다녀온 국가 저장');
									
									if(visit_city_name !== visit_nation_code + "CITY"){
										
										alreadyWantData[2] = visit_nation_code + "CITY";
										
										mysql.queryExecute('select * ' + alreadyWantQuery, alreadyWantData, function(results, status) {
											if (!status.error && !status.empty) {
												console.log('도시에 대한 가고싶은 국가가 있습니다.');
												console.log('도시에 대한 가고싶은 국가 삭제');
												mysql.queryExecute('delete ' + alreadyWantQuery, alreadyWantData, function(result, status) {
													res.redirect('/main');
												});
												
											} else if (!status.error) {
												console.log('도시에 대한 가고싶은 국가가 없습니다.');
												res.redirect('/main');
											} else {
												throw "검색 처리중 에러 발생";
											}
										});
									}else{
										res.redirect('/main');
									}
																		
								});
								
							});

						} else {
							throw "디비 처리중 에러 발생";
						}
						
					});
				} else if (!status.error) {
					console.log('디비에 없는 도시 입니다.');
					res.send('<script>alert("디비에 없는 도시 입니다.");history.back();</script>');
				} else {
					throw "검색 처리중 에러 발생";
				}
			});
		} else if (!status.error) {
			console.log('디비에 없는 국가 입니다.');
			res.send('<script>alert("디비에 없는 국가 입니다.");history.back();</script>');
		} else {
			throw "검색 처리중 에러 발생";
		}
	});

};



exports.markWantPlace = function(req, res) {
	 
	// 0) 국가랑 도시가 디비에 저장되어 있는지 체크하기?
	// 1) 이미 가고싶은 국가 디비에 저장되어 있는지 체크하기
	// 2) 다녀온 국가 디비에 저장되어 있는 건지 체크하기 다녀온 국가 디비에 저장되어 있으면 가고 싶은 국가로 못함.
	// 3) 사용자의 가고 싶은 국가 디비에 갯수가 5개 이상인지 아닌지 체크하기

	var want_nation_code = req.body.want_nation_code;
	var want_city_name = req.body.want_city_name;
	
	var want_date = req.body.want_date;
	
	if(!want_date){
		want_date = 19900101;
	}

	var alreadyVisitQuery = 'select * from pm_visit_place where vp_user_id=? and vp_nation_code=? and vp_city_name =?';
	var alreadyVisitData = [req.session.user.id, want_nation_code, want_city_name];
	
	
	
	
	if (!want_city_name) {
		console.log('want_city_name : ' + want_city_name);
		want_city_name = want_nation_code + "CITY";
		
		alreadyVisitQuery = 'select * from pm_visit_place where vp_user_id=? and vp_nation_code=?';
		alreadyVisitData = [req.session.user.id, want_nation_code];
	}
	
	var alreadyWantQuery = 'from pm_want_place where wp_user_id=? and wp_nation_code=? and wp_city_name =?';
	var alreadyWantData = [req.session.user.id, want_nation_code, want_city_name];

	
	// 0)-1 디비에 국가가 있는건지 체크
	mysql.queryExecute('select * from pm_nation_info where ?', {
		nation_code : want_nation_code
	}, function(result, status) {
		if (!status.error && !status.empty) {
			console.log('디비에 있는 국가 있습니다.');
			// 0)-2 디비에 도시가 있는건지 체크
			mysql.queryExecute('select * from pm_city_info where ?', {
				city_name : want_city_name
			}, function(result, status) {
				if (!status.error && !status.empty) {
					console.log('디비에 있는 도시 입니다.');
						
					// 1) 이미 가고 싶은 국가 디비에 저장되어 있는지 체크하기
					mysql.queryExecute('select * ' + alreadyWantQuery, alreadyWantData, function(results, status) {
						if (!status.error && !status.empty) {
							
							console.log('이미 가고싶은 국가로 저장 되어 있습니다.\n저장되어 있던 가고싶은 국가를 삭제합니다.');
							// 1)-1 가고싶은 국가 디비에 삭제
							mysql.queryExecute('delete ' + alreadyWantQuery, alreadyWantData, function(result, status) {
								res.redirect('/main');
							});
							
						} else if (!status.error) {

							console.log('새로운 가고싶은 국가입니다.');
							
							// 2) 다녀온 국가 디비에 저장되어 있는 건지 체크하기 다녀온 국가 디비에 저장되어 있으면 가고 싶은 국가로 못함.			
							mysql.queryExecute(alreadyVisitQuery, alreadyVisitData , function(results, status) {
								if (!status.error && !status.empty) {
									
									console.log('이미 다녀온 국가 혹은 다녀온 도시로 저장되어 있습니다.\n가고싶은 국가로 지정할 수 없습니다.');
									res.send('<script>alert("이미 다녀온 국가 혹은 다녀온 도시로 저장되어 있습니다. 가고싶은 국가로 지정할 수 없습니다.");history.back();</script>');
									
								} else if (!status.error) {
									console.log('다녀온 국가로 저장되어 있지 않습니다.');
									
									// 3) 사용자의 가고 싶은 국가 디비에 갯수가 5개 이상인지 아닌지 체크하기
									
									mysql.queryExecute('select count(*) cnt from pm_want_place where ?', {
										wp_user_id : req.session.user.id
									}, function(results, status) {
										if (!status.error && !status.empty && results[0].cnt >= 5) {
											
											console.log('가고싶은 국가와 도시가 다섯 개를 초과하였습니다.');
											res.send('<script>alert("가고싶은 국가와 도시가 다섯 개를 초과하였습니다.");history.back();</script>');
											
										} else if (!status.error) {
											console.log('가고싶은 국가 다섯 개 미만');
											
											// 4) 최종 가고싶은 국가 저장
											mysql.queryExecute('insert into pm_want_place set ?', {
												wp_user_id : req.session.user.id,
												wp_nation_code : want_nation_code,
												wp_city_name : want_city_name,
												wp_date : want_date
											}, function(result, status) {
												console.log('가고싶은 국가 저장');
												res.redirect('/main');
											});
											
										} else {
											throw "디비 처리중 에러 발생";
										}
									});
							
								} else {
									throw "디비 처리중 에러 발생";
								}
							});

						} else {
							throw "디비 처리중 에러 발생";
						}
						
					});
				} else if (!status.error) {
					console.log('디비에 없는 도시 입니다.');
					res.send('<script>alert("디비에 없는 도시 입니다.");history.back();</script>');
				} else {
					throw "검색 처리중 에러 발생";
				}
			});
		} else if (!status.error) {
			console.log('디비에 없는 국가 입니다.');
			res.send('<script>alert("디비에 없는 국가 입니다.");history.back();</script>');
		} else {
			throw "검색 처리중 에러 발생";
		}
	});

};


/////////////////////////////////////////////////-----------main 끝-----------/////////////////////////////////////////////////