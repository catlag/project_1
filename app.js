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
  // console.log("SERIALIZED JUST RAN!");
  done(null, user.id);
});

passport.deserializeUser(function(id, done){
  // console.log("DESERIALIZED JUST RAN!");
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


// sign up page
app.get('/signup', routeMiddleware.preventLoginSignup, function(req,res){
    res.render('signup', { username: ""});
});


// login page
app.get('/login', routeMiddleware.preventLoginSignup, function(req,res){
    res.render('login', {message: req.flash('loginMessage'), username: ""});
});


// create new user
app.post('/submit', function(req,res){

  db.User.createNewUser(req.body.username, req.body.password,
  function(err){
    res.render("signup", {message: err.message, username: req.body.username});
  },
  function(success){
    res.render("myrecipes", {message: success.message, allFoods: null });
  });
});

// login
app.post('/login', passport.authenticate('local', {
  successRedirect: '/myrecipes',
  failureRedirect: '/login',
  failureFlash: true
}));


// search for foods
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


// show all recipes
app.get('/myrecipes', routeMiddleware.checkAuthentication, function(req,res){

    req.user.getFoods().done(function(err, foods){
      console.log(foods);
    res.render('myrecipes', { allFoods: foods});
  });
});


// show recipe details
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


// ADD RECIPES
app.post('/myrecipes/:id', function(req,res){
	var foodId = req.params.id;
	var name = req.body.results.name;
	var imageUrl= req.body.results.imgUrl;

console.log(req.user);

  db.Food.findOrCreate({
    where: {
      foodId: foodId,
      name: name,
      imageUrl: imageUrl 
    }
  }).done(function(err, food, created){
    console.log("adding food", food);
    console.log("food was created?", created);
    req.user.addFood(food);
    res.redirect('/myrecipes');
  });
});


// delete recipe from list
app.delete('/myrecipes/:id/delete', function(req,res){
  db.Food.find({ where: { foodId: req.params.id}}).success(function(food){
    food.destroy().success(function(){
    res.redirect('/myrecipes'); 
    });
  }); 
});


// get zipcode
app.post('/location', function(req, res){

var foodId = req.body.results;
var name = req.body.name;
var match;

var url = "http://api.yummly.com/v1/api/recipes?_app_id=83f9f74b&_app_key=e5effbbe06740d184e03db23a8b71bef&q=" + name;

request(url, function (error, response, body) {
if (!error && response.statusCode == 200) {
      var recipes = JSON.parse(body);
      for (var i = recipes.matches.length - 1; i >= 0; i--) {
        if (recipes.matches[i].id == foodId)
           match = recipes.matches[i].ingredients;
            
          }
        
      res.render('location', {Results: match});
    }
  });  
});


// get all store in zipcode
app.get('/stores', function(req, res){

var zipcode = req.body.zipcode;
var ingredients = req.body.ingredients;

console.log(zipcode);

var url = "http://www.SupermarketAPI.com/api.asmx/StoresByZip?APIKEY=d364ba8062&ZipCode=" + zipcode;

request(url, function (error, response, body) {
if (!error && response.statusCode == 200) {
        console.log('PARSING');

     var details = JSON.parse(body);
     console.log('THIS IS THE BODY');
      console.log(body);
      res.render('stores' );
    }
  });  
});


// log out
app.get('/logout', function(req,res){
  req.logout();
  res.redirect('/');
});



app.get('*', function(req,res){
  res.render('404');
});


app.listen(3000, function(){
  "Server is listening on port 3000. Yay!";
});
