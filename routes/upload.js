var mysql = require('../config/mysql');
var async = require('async');
var path = require('path');
var fs = require('fs');
var easyimage = require('easyimage');

/////////////////////////////////////////////////----------- 포토 업로드 시작 -----------/////////////////////////////////////////////////


exports.photoUpload = function(req, res) {

	var photo_upload_nation_code = req.body.nation_code;
	var photo_upload_city_name = req.body.city_name;
	
	var photo_upload_info = {};
	
	//// 삭제하기
	console.log(photo_upload_nation_code);
	console.log(photo_upload_city_name);
	////삭제하기
	
	//이 국가와 도시가 DB에 있는 도시 인지 체크하기
	if (!req.session.user) {
		res.redirect('/');
	}else{
		if(!photo_upload_nation_code){
			res.send('<script>alert("국가 코드가 없습니다.");history.back();</script>');
		}else{
			if(!photo_upload_city_name){
				photo_upload_city_name = photo_upload_nation_code + "CITY";
			}
		
			photo_upload_info.nation_code = photo_upload_nation_code;
			photo_upload_info.city_name = photo_upload_city_name;
			
			// 0)-1 디비에 국가가 있는건지 체크
			mysql.queryExecute('select * from pm_nation_info where ?', {
				nation_code : photo_upload_nation_code
			}, function(result, status) {
				if (!status.error && !status.empty) {
					console.log('디비에 있는 국가 있습니다.');
					// 0)-2 디비에 도시가 있는건지 체크
					mysql.queryExecute('select * from pm_city_info where ?', {
						city_name : photo_upload_city_name
					}, function(result, status) {
						if (!status.error && !status.empty) {
							console.log('디비에 있는 도시 입니다.');

							console.log(photo_upload_info);

							res.render('photo_upload', {
								title : 'photo_upload',
								user : req.session.user,
								photo_upload : photo_upload_info
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
		}
	}
	
};

exports.upload = function(req, res) {
		
	var userid = req.session.user.id;
	var upfile = req.files.upfile;
	
	var photo_upload_nation_code = req.body.nation_code;
	var photo_upload_city_name = req.body.city_name;
	
	var photo_upload_make_name = req.body.make_name;
	var photo_upload_model_name = req.body.model_name;
	var photo_upload_date = req.body.photo_date;
	
	console.log(photo_upload_nation_code);
	console.log(photo_upload_city_name);
	console.log(photo_upload_make_name);
	console.log(photo_upload_model_name);
	console.log(photo_upload_date);
	
		
	if((!userid) || (!upfile) || (!photo_upload_nation_code)){
		res.redirect('/main');
	}else{
		if(upfile.length > 1){
			console.log('upfile',upfile);
			console.log('upfile 갯수 ', upfile.length);
			res.redirect('/main');
		}else{
			console.log('upfile', upfile);
			// 파일 없을 때
			if (upfile.name === ''){
				res.redirect('/main');
			} else {
				
				if(!photo_upload_city_name){
					photo_upload_city_name = photo_upload_nation_code + "CITY";
				}
				if(!photo_upload_make_name || (photo_upload_make_name === 'undefined')){
					photo_upload_make_name = "SAMSUNG";
				}
				
				if(!photo_upload_model_name || (photo_upload_model_name === 'undefined')){
					photo_upload_model_name = "SHV-E330L";
				}
				if(!photo_upload_date || (photo_upload_date === 'undefined')){
					photo_upload_date = upfile.lastModifiedDate;
				}
				
				
				var userfolder = path.resolve(__dirname, '..', 'uploads', userid);
				var userfolder_nation = path.resolve(__dirname, '..', 'uploads', userid, photo_upload_nation_code);
				var userfolder_city = path.resolve(__dirname, '..', 'uploads', userid, photo_upload_nation_code, photo_upload_city_name);
				
				
				// 폴더가 없으면 만든다.
				// 사용자id -> 국가 -> 도시
				if (!fs.existsSync(userfolder)){
					fs.mkdirSync(userfolder);
				}
				if(!fs.existsSync(userfolder_nation)){
					fs.mkdirSync(userfolder_nation);
				}
				if(!fs.existsSync(userfolder_city)){
					fs.mkdirSync(userfolder_city);
				}
				
				var name = upfile.name; // 파일의 이름
				var srcpath = upfile.path; // 파일의 현재 위치
				var photo_size = upfile.size;
				var destpath = path.resolve(userfolder_city, name); // 파일이 이동할 위치
				
				var idx = destpath.lastIndexOf('.');
				var filename = destpath.substring(0, idx); // 예) c:\Test\upload\uploads\hong\Tulips
				var ext = destpath.substring(idx); // 예) .jpg
				
				// 이름을 어떻게 바꿀지 생각해보기
				// 중복된 이름인지 체크하기
				var ch_destpath = filename + ext;
				// 예) c:\Test\upload\uploads\hong\Tulips-thumbnail.jpg
				
				var photo_url_idx = destpath.lastIndexOf('uploads');
				var photo_url = destpath.substring(photo_url_idx, destpath.length);
				
				console.log(photo_url);
				console.log('destpath', destpath);
				
				// 이미지 확장자 검사하기
				if((ext === ".jpg") || (ext === ".png") || (ext === ".JPG") || (ext === ".PNG") || (ext === ".jpeg") || (ext === ".JPEG") || (ext === ".GIF") || (ext === ".gif")){
					
					//1) 다녀온 국가에 저장되어 있는지 확인하기
					//2) 저장되어 있지 않다면 저장 시키기
					//3) 만약 가고싶은 국가로 선택되어 있다면 삭제하기
					//4) photoDB에 넣기
					
					var photo_vp_id = -1;
					
					async.waterfall([ function(callback) {
						console.log('--- Photo File Upload ---');
						
						//파일 업로드
						var is = fs.createReadStream(srcpath);
						var os = fs.createWriteStream(destpath);
						is.pipe(os);
						//파일 업로드
						
						callback(null, "success");
					},
					
					function(state, callback) {
						console.log('--- Bring Photo Visit Id ---');
						var vpQueryData = [req.session.user.id, photo_upload_nation_code, photo_upload_city_name];
						//1) 다녀온 국가에 저장되어 있는지 확인하기
						//photo_vp_id 가져오기				
						mysql.queryExecute('select * from pm_visit_place where vp_user_id=? and vp_nation_code=? and vp_city_name=?',vpQueryData,
								function(results, status) {
							if (!status.error && !status.empty) {
								console.log('사용자의 다녀온 국가 DB에 있습니다.');
								photo_vp_id = results[0].vp_id;
								callback(null, results);
	
							} else if (!status.error) {
								console.log('사용자의 다녀온 국가 DB에 없습니다.');
								//2) 저장되어 있지 않다면 저장 시키기
								//저장되어 있지 않으면 저장 시키기
								//저장하고 나서 result.insertId 넘기기
								//2)-1 만약 가고싶은 국가로 선택되어 있다면 삭제하기
								
								console.log('새로운 다녀온 국가입니다.');
	
								var alreadyWantQuery = 'from pm_want_place where wp_user_id=? and wp_nation_code=? and wp_city_name =?';
								
								// 2) 가고싶은 국가 디비에 저장되어 있는 건지 체크하기
								// 3) 가고싶은 국가 디비에 저장되어 있으면 가고 싶은 국가 디비에 있는 것을 삭제 하고 다녀온 국가로 다시 저장하게 하기	
								mysql.queryExecute('select * ' + alreadyWantQuery, vpQueryData , function(results, status) {
									if (!status.error && !status.empty) {
										console.log('가고싶은 국가로 저장되어 있습니다.\n');
										console.log('가고싶은 국가를 삭제합니다.\n');
										// 삭제 코드 작성
										mysql.queryExecute('delete ' + alreadyWantQuery, vpQueryData, function(result, status) {
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
										vp_user_id:req.session.user.id,
										vp_nation_code : photo_upload_nation_code,
										vp_city_name : photo_upload_city_name,
										vp_date : photo_upload_date
									}, function(result, status) {
										console.log('다녀온 국가 저장');
										photo_vp_id = result.insertId;
										if(photo_upload_city_name !== photo_upload_nation_code + "CITY"){
											
											vpQueryData[2] = photo_upload_nation_code + "CITY";
											
											mysql.queryExecute('select * ' + alreadyWantQuery, vpQueryData, function(results, status) {
												if (!status.error && !status.empty) {
													console.log('도시에 대한 가고싶은 국가가 있습니다.');
													console.log('도시에 대한 가고싶은 국가 삭제');
													mysql.queryExecute('delete ' + alreadyWantQuery, vpQueryData, function(result, status) {
														callback(null, result);
													});
												} else if (!status.error) {
													console.log('도시에 대한 가고싶은 국가가 없습니다.');
													callback(null, results);
												} else {
													throw "검색 처리중 에러 발생";
												}
											});
										}else{
											console.log('photo_db 저장으로 이동');
											callback(null, result);
										}
									});
								});
							} else {
								throw "검색 처리중 에러 발생";
							}
						});
					},
					
					function(result, callback) {
						console.log('--- Save Photo ---');
						//4) photoDB에 넣기
						console.log(photo_vp_id);
						if(photo_vp_id === -1){
							callback(null, photo_vp_id);
						}else{
							
							//photo_size 더해서 setting에 넣기
							mysql.queryExecute('select * from pm_settings where ?', {
								st_user_id : req.session.user.id
							}, function(results, status) {
								if (!status.error && !status.empty) {
									console.log('사용자의 설정이 있습니다.');
									
									var total_photo_size = Number(results[0].st_user_total_photo_size) + photo_size;
									req.session.user.size = total_photo_size;
									req.session.user.percentage = ((req.session.user.size * 100) / 2147500000);
									 
									if(total_photo_size  > 2147500000){
										callback(null, "size over");
									}else{
										
										//photo_size 더해서 setting에 넣기
										mysql.queryExecute('update pm_settings set st_user_total_photo_size=? where st_user_id=?', [total_photo_size, req.session.user.id ], function(result,status) {
											console.log('사용자 총 사진 크기 계산');
										});
										
										//photo DB 넣기
										mysql.queryExecute('insert into pm_photo set ?',{
											photo_user_id:req.session.user.id,
											photo_vp_id:photo_vp_id,
											img_src: photo_url,
											photo_date:photo_upload_date,
											photo_nation_code:photo_upload_nation_code,
											like_count:"0",
											photo_share:"T",
											photo_size : photo_size,
											photo_model_name : photo_upload_model_name,
											photo_make_name : photo_upload_make_name,
											photo_text: "",
											photo_upload_date:upfile.lastModifiedDate
										},function(result,status){
											callback(null, result);
										});
										
									}
									
								} else if (!status.error) {
									console.log('사용자의 설정이 없습니다.');
									callback(null, "no user setting");
								} else {
									throw "검색 처리중 에러 발생";
								}
							});
						}
					},],
	
					// 모든 task를 끝내고, 아래 callback으로 에러와 배열인자가 전달됩니다.
					// ------------------------------------------------------
					function(err, results) {
						console.log('--- Photo Upload Finish ---');
						console.log(arguments);
						
						res.redirect('/main');
					});
					
				}else{
					res.send('<script>alert(".jpg, .png, .gif, .jpeg 형식의 이미지 파일이 아닙니다.");history.back();</script>');
				}
			}
		}
	}
};


/////////////////////////////////////////////////----------- 포토 업로드 끝 -----------/////////////////////////////////////////////////
