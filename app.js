
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , intro = require('./routes/intro')
  , main = require('./routes/main')
  , setting = require('./routes/setting')
  , upload = require('./routes/upload')
  , photoView = require('./routes/photo_view')
  , follow = require('./routes/follow')
  , statistics = require('./routes/statistics')
  , http = require('http')
  , path = require('path')
  , date = require('date-utils')
  , date_format = require("date-format-lite");

var app = express();
var passport = require('passport');
var flash = require('connect-flash');

var util = require('util');
var expressLayouts = require('express-ejs-layouts');
var url = require("url");

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());

app.configure(function() {
	app.use(express.logger('dev'));
	app.use(express.cookieParser());
	app.use(express.bodyParser());
	app.set('view engine', 'ejs');
	app.use(express.session({ secret: 'my_secret_key' }));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(flash());
});

require('./config/oauth')(app); // 요거 페이스북 관련 모듈임

app.use(express.multipart()); // 업로드 가능
app.use(express.methodOverride());

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

//uploads 폴더 지정
app.use('/uploads', express.directory(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}


//intro
app.get('/', intro.intro);
app.get('/users', user.list);
app.get('/intro',intro.intro);
app.get('/tutorial',intro.tutorial);


//main
app.get('/main', main.main);
app.post('/main', main.main);
app.post('/paint_visit_place', main.paintVisitPlace);
app.post('/mark_want_place', main.markWantPlace);
app.post('/nation_statistics', main.nationStatistic);


//photo_view
app.get('/nation_photo_view',photoView.nationPhotoView);
app.post('/nation_photo_view',photoView.nationPhotoView);
app.get('/city_photo_view',photoView.cityPhotoView);
app.post('/city_photo_view',photoView.cityPhotoView);
app.get('/all_photo_view',photoView.allPhotoView);
app.post('/modify_photo_text',photoView.modityPhotoText);


//page
app.get('/friend_photo_view',routes.friendPhotoView);
app.get('/hangel',routes.hangel);


//setting
app.get('/setting',setting.setting);
app.post('/modify_user_color',setting.modityUserColor);
app.post('/modify_user_birth',setting.modityUserBirth);
app.post('/modify_user_nation',setting.modityUserNation);
app.post('/modify_user_email',setting.modityUserEmail);
app.post('/delete_user',setting.DeleteUser);


//followeing, follower
app.post('/add_following', follow.addFollowing);
app.post('/search_pm_f', follow.searhPhotoMapperUserList);
app.post('/search_my_f', follow.searhMyFollowingList);

app.post('/following_world_map', follow.followingWorldMap);
app.get('/following_world_map',follow.followingWorldMap);

app.post('/all_following_world_map', follow.allFollowingWorldMap);
app.get('/all_following_world_map',follow.allFollowingWorldMap);


//photo_upload
app.post('/upload', upload.upload);
app.get('/photo_upload',upload.photoUpload);
app.post('/photo_upload',upload.photoUpload);

//statistics
app.get('/statistics', statistics.statistics);

app.post('/delete_visit_place',statistics.DeleteUserVisitPlace);
app.post('/delete_want_place',statistics.DeleteUserWantPlace);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

app.use(function(req, res){
	res.status(404).render('404/404_error');
	//res.redirect('/');
	//res.send(404, 'Sorry, we cannot find that!');
});