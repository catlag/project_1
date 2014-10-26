var express = require("express"),
  bodyParser = require("body-parser"),
  passport = require("passport"),
  passportLocal = require("passport-local"),
  cookieParser = require("cookie-parser"),
  session = require("cookie-session"),
  db = require("./models/index"),
  flash = require('connect-flash'),
  methodOverride = require('method-override'),
  request = require('request'),
  app = express(),
  routeMiddleware = require("./config/routes");
 


app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride('_method'));
require('locus');

app.use(session( {
  secret: 'dasecret',
  name: 'macademia nut',

  maxage: 3600000
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


passport.serializeUser(function(user, done){
  console.log("SERIALIZED JUST RAN!");
  done(null, user.id);
});

passport.deserializeUser(function(id, done){
  console.log("DESERIALIZED JUST RAN!");
  db.User.find({
      where: {
        id: id
      }
    })
    .done(function(error,user){
      done(error, user);
      // console.log(user);
    });
});


//index
app.get('/', routeMiddleware.preventLoginSignup, function(req,res){
	res.render('index');
});

app.get('/signup', routeMiddleware.preventLoginSignup, function(req,res){
    res.render('signup', { username: ""});
});

app.get('/login', routeMiddleware.preventLoginSignup, function(req,res){
    res.render('login', {message: req.flash('loginMessage'), username: ""});
});

app.post('/submit', function(req,res){

  db.User.createNewUser(req.body.username, req.body.password,
  function(err){
    res.render("signup", {message: err.message, username: req.body.username});
  },
  function(success){
    res.render("myrecipes", {message: success.message});
  });
});


app.post('/login', passport.authenticate('local', {
  successRedirect: '/myrecipes',
  failureRedirect: '/login',
  failureFlash: true
}));

app.get('/logout', function(req,res){
  req.logout();
  res.redirect('/');
});

app.get('/search', function(req, res){

var searchTerm = req.query.recipe;

var url = "http://api.yummly.com/v1/api/recipes?_app_id=83f9f74b&_app_key=e5effbbe06740d184e03db23a8b71bef&q=" +searchTerm +"&requirePictures=true";

request(url, function (error, response, body) {
if (!error && response.statusCode == 200) {
      var recipes = JSON.parse(body);
    
      res.render('results', {Results: recipes.matches});
    }
  });  
});

app.get('/myrecipes', routeMiddleware.checkAuthentication, function(req,res){
	db.Food.findAll().done(function(err, recipes){;
    console.log(recipes.foodId)
		res.render('myrecipes',{ allFoods: recipes});
	});
	
});


app.get('/details/:id', function(req, res){
    var foodId = req.params.id;
    var obj;
    console.log(foodId);

    var url ="http://api.yummly.com/v1/api/recipe/" + foodId + "?_app_id=83f9f74b&_app_key=e5effbbe06740d184e03db23a8b71bef";


    request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var details = JSON.parse(body);
      res.render('details', {results: details});
      }
  });
});

app.post('/myrecipes/:id', function(req,res){
	var foodId = req.params.id;
	var name = req.body.results.name;
	var imageUrl= req.body.results.imgUrl;

	db.Food.create({
		foodId: foodId,
		imageUrl: imageUrl, 
		name: name}).done(function(err,success){
			if(err) {
				console.log(err);
				res.render('details');
			}
			else {
				res.redirect('/myrecipes');
			}
		});
	});

app.delete('/myrecipes/:id/delete', function(req,res){
  db.Food.find({ where: { foodId: req.params.id}}).success(function(food){
    food.destroy().success(function(){
    res.redirect('/myrecipes'); 
    });
  }); 
});

app.get('/location', function(req, res){

var id = req.body.results.id;
var name = req.body.results.name;
var imgUrl = req.body.results.imgUrl;

var url = "http://api.yummly.com/v1/api/recipes?_app_id=83f9f74b&_app_key=e5effbbe06740d184e03db23a8b71bef&q=" + name;

request(url, function (error, response, body) {
if (!error && response.statusCode == 200) {
      var recipes = JSON.parse(body);
      res.render('location', {Results: recipes.matches});
    }
  });  
});








app.get('*', function(req,res){
  res.render('404');
});

app.listen(3000, function(){
  "Server is listening on port 3000. Yay!";
});