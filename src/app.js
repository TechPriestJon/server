const express = require("express");
const datastore = require('mysql');
const bodyParser = require('body-parser');
const logging = require("./logging.js");
let logger = logging.logger;
const port = 80;
const url="on-thin-ice.github.com"

const uuidv1 = require('uuid/v1');

var app = express();
app.use(logging.request_logger);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

logger.info("Starting server");

app.post('/api/plan', function(req, res) {
    db.getAutoId(function(err, id) {
        var title = req.body.title;
        logger.info("Creating new expedition: " + title);

        let guid = uuidv1();

        res.redirect(url+"/globe.html?expedition="+guid);
    });
});


app.get("/api/tiles", function(req, res){

});