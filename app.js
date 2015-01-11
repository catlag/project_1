var express = require("express"),
  async = require("async"),
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
  routeMiddleware = require("./config/routes"),
  parseString = require('xml2js').parseString,
  geocoder = require('geocoder');
 

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
app.get('/', function(req,res){
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
   function(){
    passport.authenticate('local')(req,res,function(){
      res.redirect('/myrecipes');
    });
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

var url = "http://api.yummly.com/v1/api/recipes?_app_id=" +process.env.YUMMLY_APP_ID +"&_app_key=" + process.env.YUMMLY_APP_KEY+ "&q=" +searchTerm +"&requirePictures=true&maxResult=30&start=0";

request(url, function (error, response, body) {
if (!error && response.statusCode == 200) {
      var recipes = JSON.parse(body);

      res.render('results', {Results: recipes.matches});
    }
    else{
      console.log(error);
    }
  });  
});


// show all recipes
app.get('/myrecipes', routeMiddleware.checkAuthentication, function(req,res){

    req.user.getFoods().done(function(err, foods){
    res.render('myrecipes', { allFoods: foods});
  });
});



var states = [ "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];


// show recipe details
app.get('/details/:id', routeMiddleware.checkAuthentication, function(req, res){
    var foodId = req.params.id;
    var obj;


    var url ="http://api.yummly.com/v1/api/recipe/" + foodId + "?_app_id=83f9f74b&_app_key=e5effbbe06740d184e03db23a8b71bef";

    request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var details = JSON.parse(body);
      res.render('details', {results: details, states:states});
      }
  });
});


// ADD RECIPES
app.post('/myrecipes/:id', function(req,res){
	var foodId = req.params.id;
	var name = req.body.results.name;
	var imageUrl= req.body.results.imgUrl;


  db.Food.findOrCreate({
    where: {
      foodId: foodId,
      name: name,
      imageUrl: imageUrl 
    }
  }).done(function(err, food, created){
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




var stores = [];
// get all stores in zipcode
var geoLocateStore = function (store, callback) {

  var mapUrl = "http://open.mapquestapi.com/geocoding/v1/address?key=" +process.env.MAPQUEST_KEY+"&callback=&inFormat=kvp&outFormat=json&location=";
  mapUrl += store.Address + " ";
  mapUrl += store.City + " ";
  mapUrl += store.State;

  request(mapUrl, function (error, response, body) {
    if (!error && response.statusCode == 200) {
   
      var locations = JSON.parse(body);
       if (locations.results[0].locations.length > 0){
      store.Lat = locations.results[0].locations[0].latLng.lat;
      store.Lon = locations.results[0].locations[0].latLng.lng;
      var location = [];
      location.push(store.Lat, store.Lon, store.Storename, store.Address );
      stores.push(location);
    }
      callback();
    } else {
      console.log("ERROR geocoding " + store.Address);
      callback(error);
    }

  });
  
};


app.get('/stores', function(req, res){

  var city = req.query.city;
  var state = req.query.state; // var ingredient = req.query.ingredient;
  var zip = req.query.Zip;
  var info = [];
  stores = [];
  var geocode_api = process.env.MAPQUEST_KEY;


console.log(zip);
  var nextUrl = "http://www.SupermarketAPI.com/api.asmx/StoresByCityState?APIKEY="+process.env.SUPERMARKET_KEY+ "&SelectedCity=" +city+"&SelectedState="+ state;

if ( city !== undefined ){
    request(nextUrl, function (error, response, body) {

      if (!error && response.statusCode == 200) {

        parseString(body, {explicitArray : false}, function (err, result) {
          if(typeof(result.ArrayOfStore.Store) === 'undefined'){
            var message = "Oops, something went wrong! Try again.";
            res.render('index', {message : message});
          } else {
            for (var i = result.ArrayOfStore.Store.length - 1; i >= 0; i--) {       
              info.push(result.ArrayOfStore.Store[i]);
            }
            async.each(info, geoLocateStore, function (err) {
              // console.log(stores);
              res.render('stores', {Stores: stores, states:states, geocode_api:geocode_api, zip:zip});
            });
          }
        });
      }
    });
  }
 else{
  res.render('stores', {Stores: null, states:states, geocode_api:geocode_api, zip:null});
 }   
});


// log out
app.get('/logout', function(req,res){
  req.logout();
  res.redirect('/');
});


app.get('*', function(req,res){
  res.render('404');
});


app.listen(process.env.PORT || 3000, function(){
  "Server is listening on port 3000. Yay!";
});


