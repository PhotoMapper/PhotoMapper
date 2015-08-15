var mysql = require('../config/mysql');
var async = require('async');

/////////////////////////////////////////////////----------- 포토 보기 시작 -----------/////////////////////////////////////////////////


exports.cityPhotoView = function(req, res) {
	
	
	var page_user_id = req.body.user_id;
	var page_user_name = req.body.user_name;
	var photo_nation_code = req.body.nation_code;
	var photo_nation_name = req.body.nation_code;
	var photo_city_name =  req.body.city_name;

	var photo_vp_id_lists = [];
	var photo_vp_city_lists = [];
	
	var page_info = {};
		
	var visit_city_lists = [];
	var visit_city_photo_lists = [];
	
	//삭제하기
	console.log(photo_nation_code);
	console.log(photo_city_name);
	//삭제하기
	
	// 1. 이 국가가 사용자가 다녀온 국가 인지 체크하기
	//  - 다녀온 국가가 아니거나 다녀온 국가인데 사진이 없으면 사진 보기 페이지로 이동하지 않는다.
	// 2. 사용자가 다녀온 다른 국가 리스트 출력
	// 3. 각 국가마다의 포토 뷰 출력
	
	if (!req.session.user) {
		res.redirect('/');
	}else{
		if(!photo_nation_code){
			res.send('<script>alert("국가 코드가 없습니다.");history.back();</script>');
		}else{
			if(!photo_city_name){
				res.send('<script>alert("도시 이름이 없습니다.");history.back();</script>');
			}
			else{
				
				if(!page_user_id){
					page_user_id = req.session.user.id;
				}
				if(!page_user_name){
					page_user_name = req.session.user.name;
				}
				
				// 1. 이 국가가 사용자가 다녀온 도시 인지 체크하기
				mysql.queryExecute('select * from pm_visit_place where vp_user_id=? and vp_nation_code=? and vp_city_name=?', [page_user_id, photo_nation_code, photo_city_name], function(results, status) {
					if (!status.error && !status.empty) {
						console.log('사용자가 다녀온 도시 입니다.');
						console.log(results);
						
						//2. 다녀온 도시인데 사진이 업로드된 도시인지 체크하기
						mysql.queryExecute('select * from pm_photo where photo_user_id=? and photo_vp_id=?', [page_user_id, results[0].vp_id], function(results, status) {
							if (!status.error && !status.empty) {
								console.log('사용자가 다녀온 도시에 사진 리스트가 있습니다.');
								console.log(results);
								// 사용자가 다녀온 도시에 사진 리스트 저장
								visit_city_photo_lists = results;
								
								// 다녀온 국가인데 사진이 업로드된 국가이면 이 국가에 이름 알아내기
								mysql.queryExecute('select * from pm_nation_info where ?', {
									nation_code : photo_nation_code
								}, function(results, status) {
									if (!status.error && !status.empty) {
										photo_nation_name = results[0].nation_name;
										console.log('국가이름 넣기 성공');
									
										page_info.id = page_user_id;
										page_info.name = page_user_name;
										page_info.nation_name = photo_nation_name;
										page_info.nation_code = photo_nation_code;
										page_info.city_name = photo_city_name;
										
									} else if (!status.error) {
										console.log('국가이름 넣기 실패');
									} else {
										throw "검색 처리중 에러 발생";
									}
								});
								
								//3. photo_nation_code가 photo_nation_code인 사진 리스트의 photo_vp_id 리스트
								//photo_vp_id리스트로 다녀온 국가 리스트 출력
								
								async.waterfall([ function(callback) {
									console.log('--- 사용자의 photo_nation_code가 photo_nation_code인 사진 리스트의 photo_vp_id 리스트 ---');
									mysql.queryExecute('select * from pm_photo where photo_user_id=? and photo_nation_code=?', [page_user_id, photo_nation_code], function(results, status) {
										if (!status.error && !status.empty) {
											console.log('사용자의 photo_nation_code가 photo_nation_code인 사진 리스트의 photo_vp_id 리스트가 있습니다.');
											
											photo_vp_id_lists = results.map(function(elem){
												return elem.photo_vp_id;
											}).join(",");
											
											console.log(results);
											console.log(photo_vp_id_lists);

										} else if (!status.error) {
											console.log('사용자의 photo_nation_code가 photo_nation_code인 사진 리스트의 photo_vp_id 리스트가 없습니다.');
										} else {
											throw "검색 처리중 에러 발생";
										}
										callback(null, photo_vp_id_lists);
									});
								},
								
								function(photo_vp_id_lists, callback) {
									console.log('--- 다녀온 vp_id 리스트에 대한 도시 리스트 ---');
									console.log(photo_vp_id_lists);
									//photo_vp_nation_lists.join("\",\"")
									//in (AFG, KOR)
									mysql.queryExecute('select vp_city_name from pm_visit_place where vp_city_name!=? and vp_id in (' + photo_vp_id_lists + ') order by vp_city_name asc', [page_info.nation_code + "CITY"], function(results, status) {
										if(!status.error && !status.empty) {
											console.log(results);
											visit_city_lists = results;
											
//											visit_city_lists = results.map(function(elem){
//												return elem.vp_city_name;
//											}).join(",");
											
											console.log('다녀온 vp_id 리스트에 대한 도시 리스트가 있습니다.');
										}else if(!status.error) {
											console.log('다녀온 vp_id 리스트에 대한 도시 리스트가 없습니다.');
										}else{
											throw "검색 처리중 에러 발생";
										}
										callback(null, results);
									});
								},],
								
								
								// 모든 task를 끝내고, 아래 callback으로 에러와 배열인자가 전달됩니다.
								// ------------------------------------------------------
								function(err, results) {
									console.log('--- nation photo view start ---');
									console.log(arguments);
									
									console.log('page_info : ',page_info);
									console.log('visit_city_lists : ',visit_city_lists);
									console.log('visit_city_photo_lists : ',visit_city_photo_lists);
									
									
																		
									res.render('city_photo_view', {
										title : 'city_photo_view',
										user : req.session.user,
										page_info : page_info,
										visit_city_lists : visit_city_lists,
										visit_city_photo_lists : visit_city_photo_lists,
									});

								});
								
								//3. photo_nation_code가 photo_nation_code인 사진 리스트의 photo_vp_id 리스트
								//photo_vp_id리스트로 다녀온 국가 리스트 출력
								
								
								
								
							} else if (!status.error) {
								console.log('사용자가 다녀온 도시에 사용자의 사진 리스트가 없습니다.');
								res.send('<script>alert("사용자가 다녀온 도시에 사용자의 사진 리스트가 없습니다.");history.back();</script>');
							} else {
								throw "검색 처리중 에러 발생";
							}
						});//2. 다녀온 도시인데 사진이 업로드된 도시인지 체크하기
						
						
					} else if (!status.error) {
						console.log('사용자가 다녀온 도시가 아닙니다.');
						res.send('<script>alert("사용자가 다녀온 도시가 아닙니다.");history.back();</script>');
					} else {
						throw "검색 처리중 에러 발생";
					}
				});// 1. 이 국가가 사용자가 사진 도시 인지 체크하기
				
				
				
				
				
			}
		}
	}
};

exports.nationPhotoView = function(req, res) {

	var page_user_id = req.body.user_id;
	var page_user_name = req.body.user_name;
	var photo_nation_code = req.body.nation_code;
	var photo_nation_name = req.body.nation_code;
	var photo_city_name = photo_nation_code + "CITY";

	var photo_vp_id_lists = [];
	var photo_vp_nation_lists = [];
	
	var visit_nation_lists = [];
	var visit_nation_photo_lists = [];

	// 1. 이 국가가 사용자가 사진 국가 인지 체크하기
	// 2. 사용자가 다녀온 다른 국가 리스트 출력
	// 3. 각 국가마다의 포토 뷰 출력
	
	var page_info = {};
	
	if (!req.session.user) {
		res.redirect('/');
	} else {
		if (!photo_nation_code) {
			res.send('<script>alert("국가 코드가 없습니다.");history.back();</script>');
		} else {
			
			if(!page_user_id){
				page_user_id = req.session.user.id;
			}
			if(!page_user_name){
				page_user_name = req.session.user.name;
			}
			
			
			// 1. 이 국가가 사용자가 다녀온 국가 인지 체크하기
			mysql.queryExecute('select * from pm_visit_place where vp_user_id=? and vp_nation_code=?', [page_user_id, photo_nation_code], function(results, status) {
				if (!status.error && !status.empty) {
					console.log('사용자가 다녀온 국가 입니다.');
					console.log(results);
					
					//2. 다녀온 국가인데 사진이 업로드된 국가인지 체크하기
					mysql.queryExecute('select * from pm_photo where photo_user_id=? and photo_nation_code=?', [page_user_id, results[0].vp_nation_code], function(results, status) {
						if (!status.error && !status.empty) {
							console.log('사용자가 다녀온 국가에 사진 리스트가 있습니다.');
							console.log(results);
							// 사용자가 다녀온 국가에 사진 리스트 저장
							visit_nation_photo_lists = results;
							
							// 다녀온 국가인데 사진이 업로드된 국가이면 이 국가에 이름 알아내기
							mysql.queryExecute('select * from pm_nation_info where ?', {
								nation_code : photo_nation_code
							}, function(results, status) {
								if (!status.error && !status.empty) {
									photo_nation_name = results[0].nation_name;
									console.log('국가이름 넣기 성공');
								} else if (!status.error) {
									console.log('국가이름 넣기 실패');
								} else {
									throw "검색 처리중 에러 발생";
								}
							});
							
							
							// 3. 사용자가 다녀온 국가인데 사진이 업로드된 다른 국가 리스트 출력
							async.waterfall([ function(callback) {
								console.log('--- 사용자의 사진 리스트의 국가 코드 ---');
								mysql.queryExecute('select * from pm_photo where ?', {
									photo_user_id : page_user_id
								}, function(results, status) {
									if (!status.error && !status.empty) {
										console.log('사용자의 사진 리스트가 있습니다.');
										
										photo_vp_nation_lists = results.map(function(elem){
											return elem.photo_nation_code;
										}).join("\",\"");
										
										console.log(results);
										console.log(photo_vp_nation_lists);

									} else if (!status.error) {
										console.log('사용자의 사진 리스트가 없습니다.');
									} else {
										throw "검색 처리중 에러 발생";
									}
									callback(null, photo_vp_nation_lists);
								});
							},
							
							function(photo_vp_nation_lists, callback) {
								console.log('--- 다녀온 국가 리스트에 대한 국가 리스트 ---');
								console.log(photo_vp_nation_lists);
								//photo_vp_nation_lists.join("\",\"")
								//in (AFG, KOR)
								mysql.queryExecute('select * from pm_nation_info where nation_code in (\"' + photo_vp_nation_lists + '\") order by nation_code asc', {
								}, function(results, status) {
									if(!status.error && !status.empty) {
										console.log(results);
										visit_nation_lists = results;
										console.log('다녀온 국가 리스트에 대한 국가 리스트가 있습니다.');
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
								console.log('--- nation photo view start ---');
								console.log(arguments);
								
								page_info.id = page_user_id;
								page_info.name = page_user_name;
								page_info.nation_name = photo_nation_name;
								page_info.nation_code = photo_nation_code;
								page_info.city_name = photo_city_name;
								
								console.log(page_info);
								console.log(visit_nation_lists);
								console.log(visit_nation_photo_lists);
								
								console.log(typeof((visit_nation_photo_lists[0].photo_date).toString()));
//								console.log(((visit_nation_photo_lists[0].photo_date).date()).format());
								console.log((visit_nation_photo_lists[0].photo_date).toString().date("YYYY-MM-DD"));
								
//								var tmp = visit_nation_photo_lists[0].photo_date.lastIndexOf('GMT');
//								var photo_url = destpath.substring(photo_url_idx, destpath.length);
								
								console.log('visit_nation_photo_lists_photo_date : ',visit_nation_photo_lists[0].photo_date);

								
								res.render('nation_photo_view', {
									title : 'nation_photo_view',
									user : req.session.user,
									page_info : page_info,
									visit_nation_lists : visit_nation_lists,
									visit_nation_photo_lists : visit_nation_photo_lists,
								});

							});// 3. 사용자가 다녀온 국가인데 사진이 업로드된 다른 국가 리스트 출력
							
							
						} else if (!status.error) {
							console.log('사용자가 다녀온 국가에 사용자의 사진 리스트가 없습니다.');
							res.send('<script>alert("사용자가 다녀온 국가에 사용자의 사진 리스트가 없습니다.");history.back();</script>');
						} else {
							throw "검색 처리중 에러 발생";
						}
					});//2. 다녀온 국가인데 사진이 업로드된 국가인지 체크하기
					
					
				} else if (!status.error) {
					console.log('사용자가 다녀온 국가가 아닙니다.');
					res.send('<script>alert("사용자가 다녀온 국가가 아닙니다.");history.back();</script>');
				} else {
					throw "검색 처리중 에러 발생";
				}
			});// 1. 이 국가가 사용자가 사진 국가 인지 체크하기
		}//국가 코드 없어서 넘어감
	}//로그인 안된 상태라 넘어감

};







exports.allPhotoView = function(req, res) {
	
	
	var page_user_id = req.body.user_id;
	var page_user_name = req.body.user_name;
	var photo_nation_code = req.body.nation_code;
	var photo_nation_name = req.body.nation_code;
	var photo_city_name = photo_nation_code + "CITY";

	var photo_vp_id_lists = [];
	var photo_vp_nation_lists = [];
	
	var visit_nation_lists = [];
	var visit_nation_photo_lists = [];

	// 1. 포토 리스트가 있는지 체크하기
	// 2. visit_nation_lists
	// 3. visit_nation_photo_lists 만들기
	
	var page_info = {};
	
	if (!req.session.user) {
		res.redirect('/');
	} else {
		if(!page_user_id){
			page_user_id = req.session.user.id;
		}
		if(!page_user_name){
			page_user_name = req.session.user.name;
		}
		
		// 1) 사용자의 포토 리스트가 있는지 체크하기
		mysql.queryExecute('select * from pm_photo where ?', {
			photo_user_id : page_user_id
		}, function(results, status) {
			if (!status.error && !status.empty) {
				console.log('사용자의 사진 리스트가 있습니다.');
				
				photo_vp_nation_lists = results.map(function(elem){
					return elem.photo_nation_code;
				}).join("\",\"");
				
				console.log(results);
				console.log(photo_vp_nation_lists);
				
				// 2) 사용자의 포토 리스트의 국가 리스트 가져오기
				mysql.queryExecute('select * from pm_nation_info where nation_code in (\"' + photo_vp_nation_lists + '\") order by nation_code asc', {
				}, function(results, status) {
					if(!status.error && !status.empty) {
						
						visit_nation_lists = results;
						console.log('사용자의 포토 리스트의 국가 리스트가 있습니다.');
						console.log(results);
						console.log(visit_nation_lists);
						
						mysql.queryExecute('select * from pm_photo where photo_user_id=? and photo_nation_code=?', [page_user_id, visit_nation_lists[0].nation_code], function(results, status) {
							if(!status.error && !status.empty) {
								console.log(results);
								visit_nation_photo_lists = results;
								console.log('포토 리스트가 있습니다.');
								
								page_info.id = page_user_id;
								page_info.name = page_user_name;
								page_info.nation_name = visit_nation_lists[0].nation_name;
								page_info.nation_code = visit_nation_lists[0].nation_code;
								page_info.city_name = visit_nation_lists[0].nation_name + "CITY";
								
								console.log(page_info);
								console.log(visit_nation_lists);
								console.log(visit_nation_photo_lists);
								
								res.render('nation_photo_view', {
									title : 'nation_photo_view',
									user : req.session.user,
									page_info : page_info,
									visit_nation_lists : visit_nation_lists,
									visit_nation_photo_lists : visit_nation_photo_lists,
								});
								
							}else if(!status.error) {
								console.log('포토 국가 리스트가 없습니다.');
								res.send('<script>alert("포토 국가 리스트가 없습니다.");history.back();</script>');
							}else{
								throw "검색 처리중 에러 발생";
							}
						});
					}else if(!status.error) {
						console.log('사용자의 포토 리스트의 국가 리스트가 없습니다.');
						res.send('<script>alert("사용자의 포토 리스트의 국가 리스트가 없습니다.");history.back();</script>');
					}else{
						throw "검색 처리중 에러 발생";
					}
				});
			} else if (!status.error) {
				console.log('사용자의 사진 리스트가 없습니다.');
				res.send('<script>alert("사용자의 사진 리스트가 없습니다.");history.back();</script>');
			} else {
				throw "검색 처리중 에러 발생";
			}
		});
	}//로그인 안된 상태라 넘어감
};

exports.modityPhotoText = function(req, res) {
	
	var photo_id = req.body.photo_id;
	var photo_text = req.body.photo_text;
	
	console.log(photo_id);
	console.log(photo_text);
	console.log(photo_text.length);

	if(!photo_text){
		res.send('<script>alert("사진 텍스트 값이 없습니다.");history.back();</script>');
	}else{
		if(photo_text.length > 50){
			res.send('<script>alert("글자 수는 50자 이내로 써주세요.");history.back();</script>');
		}else{
			// photo_id 값 맞는지 체크하기
			mysql.queryExecute('select * from pm_photo where ?', {
				photo_id : photo_id
			}, function(results, status) {
				if(!status.error && !status.empty) {
					console.log(results);
					console.log('photo_id가 맞습니다.');
	
					// 사용자 생년월일 바꾸기
					mysql.queryExecute('update pm_photo set photo_text=? where photo_id=?', [photo_text, photo_id ], function(result,status) {
						console.log('사진 텍스트 값 바꾸기');
						res.json(result);
					});
					
				}else if(!status.error) {
					console.log('photo_id가 틀립니다.');
					res.send('<script>alert("photo_id가 틀립니다.");history.back();</script>');
				}else{
					throw "검색 처리중 에러 발생";
				}
			});
		}
	}
	
};

/////////////////////////////////////////////////----------- 포토 보기 끝 -----------/////////////////////////////////////////////////