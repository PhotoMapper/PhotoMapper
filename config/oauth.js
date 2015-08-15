module.exports = init;
function init(app) {
	console.log("[알림] 페이스북 연동 성공");
	var pkginfo = require('./config');
	var passport = require('passport');

	var token = "";

	app.use(passport.initialize());
	app.use(passport.session());

	passport.serializeUser(function(user, done) {
		done(null, user);
	});
	passport.deserializeUser(function(obj, done) {
		done(null, obj);
	});

	var FacebookStrategy = require('passport-facebook').Strategy;
	passport.use(new FacebookStrategy({
		clientID: pkginfo.oauth.facebook.FACEBOOK_APP_ID,
		clientSecret: pkginfo.oauth.facebook.FACEBOOK_APP_SECRET,
		callbackURL: pkginfo.oauth.facebook.callbackURL
	},
	function(accessToken, refreshToken, profile, done){
		// print login console log
		console.log("==> Login : "+profile.id+" // "+profile.displayName);
		console.log("==> accessToken : "+accessToken + "\n" + "===> refreshToken : "+refreshToken);
		token = accessToken;
		
		console.log("==> token : "+ token);
		return done(null, profile);
	}));
	

	app.get('/auth/facebook', passport.authenticate('facebook'));
	//
	// redirect 실패/성공의 주소를 기입한다.
	//
	app.get('/auth/facebook/callback', passport.authenticate('facebook', {
		successRedirect: '/auth/facebook/success',
		failureRedirect: '/auth/facebook/fail'
	}));
	app.get('/logout', function(req, res){
		//
		// passport 에서 지원하는 logout 메소드이다.
		// req.session.passport 의 정보를 삭제한다.
		//
		// 로그아웃 설정
		delete req.session.login;
		delete req.session.user;
		req.logout();
		res.redirect('/');
	});
	app.get('/auth/facebook/success',function(req,res){
		//res.json({result:'success'});
		// 디비 존재 여부 처리
		var mysql=require('./mysql');
		var profile=req.session.passport.user;
		var u_email = "hello@gmail.com";
		var u_locale = "South Korea";

		try{
			mysql.queryExecute('select * from pm_user_info where ?',{user_id:profile.id},function(result,status){
				if(!status.error&&!status.empty){
					
					console.log('이미 있는 사용자 입니다.');
					console.log('req.user=', req.user);
					console.log('req.user._json=', req.user._json);
					console.log('req.user._json.email=', req.user._json.email);
					res.redirect('/auth/facebook/success/proc');
					
				}
				else if(!status.error){
					// 가입 처리 부분
					if(req.user._json.email){
						u_email = req.user._json.email;
					}
					if(req.user._json.locale !== "ko_KR"){
						u_locale = req.user._json.locale;
					}
					mysql.queryExecute('insert into pm_user_info set ?',{
						user_id:profile.id,
						user_email:u_email,
						user_name:profile.displayName,
						user_token:token,
						user_birth:19990101,
						user_gender:req.user._json.gender,
						user_nation:u_locale,
						user_check:"F"
					},function(result,status){
						mysql.queryExecute('insert into pm_settings set ?',{
							st_user_id:profile.id,
							st_user_color:"#61c3c3",
							st_user_total_photo_size:0
						},function(result,status){
							//res.redirect('/main');
							res.redirect('/auth/facebook/success/proc');
						});
					});
															
					console.log('새로운 사용자 입니다.');
				}
				else{
					throw "로그인 처리중 에러 발생";
				}
			});
		}
		catch(err){
			console.log(err);
			res.status(500).render('500/500_error');
		}
	});
	app.get('/auth/facebook/success/proc', function(req, res){
		// 로그인 최종 처리
		var mysql = require('./mysql');
		var profile=req.session.passport.user;
		mysql.queryExecute('select * from pm_user_info where ?',{user_id:profile.id},function(user_result,status){
			
			req.session.login=true;
			req.session.user={};
			req.session.user.id = user_result[0].user_id;
			req.session.user.email = user_result[0].user_email;
			req.session.user.name = user_result[0].user_name;
			req.session.user.token = user_result[0].user_token;
			req.session.user.birth = user_result[0].user_birth;
			req.session.user.gender = user_result[0].user_gender;
			req.session.user.nation = user_result[0].user_nation;
			req.session.user.check = user_result[0].user_check;
			
			console.log('세션 저장');
			
			mysql.queryExecute('select * from pm_settings where ?',{st_user_id:profile.id},function(st_result,status){
				req.session.user.color = st_result[0].st_user_color;
				req.session.user.size = st_result[0].st_user_total_photo_size;
				req.session.user.percentage = ((req.session.user.size * 100) / 2147500000);
				
				if(req.session.user.check === "F"){
					res.redirect('/tutorial');
				}else{
					res.redirect('/main');
				}
			});
		});
		console.log('로그인 최종 처리');
	});
	
	
	app.get('/auth/facebook/success/fail', function(req, res){
		res.redirect('/');
	});
	
	
}
