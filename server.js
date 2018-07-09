var path = require('path');
var express = require('express');
var app=express();
var bodyParser = require('body-parser')
/*var cors = require('cors')
app.use(cors())*/
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
	extended: true
})); 


app.use(express.static(__dirname + '/public'));             
app.use(require("./controllers/user.js"));

//ORM Configurations
var waterlineConfig = require('./config/connections')
, waterlineOrm = require('./config/init').waterlineOrm;
var modelPath = path.join(__dirname, '/models');
require('./config/init')(modelPath);

//ORM Initialization 
waterlineOrm.initialize(waterlineConfig, function (err, models) {
    if (err) throw err;

    db = function (table) { return models['collections'][table]; };
    db.collections = models.collections;
    db.connections = models.connections;

    app.listen(3000);
	console.log("server is live at port 3000");
});