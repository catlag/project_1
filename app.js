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
  app = express();
 


app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride('_method'));
require('locus');


//index
app.get('/', function(req,res){
	res.render('index');
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

app.get('/details/:id', function(req, res){
    var foodId = req.params.id;
    var obj;

    var url ="http://api.yummly.com/v1/api/recipe/" + foodId + "?_app_id=83f9f74b&_app_key=e5effbbe06740d184e03db23a8b71bef";
    console.log(url);

    request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var details = JSON.parse(body);
      res.render('details', {results: details});
      }
  });
});

app.post('/myrecipes:id', function(req,res){
	var foodId = req.params.id;

})









app.get('*', function(req,res){
  res.render('404');
});

app.listen(3000, function(){
  "Server is listening on port 3000. Yay!";
});