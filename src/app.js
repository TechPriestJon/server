const secrets = require("./../secrets.json");
const express = require("express");
const datastore = require('mysql');
const logging = require("./logging.js");
const bodyParser = require('body-parser');
const sqlgen = new (require('sql-generator'))();
var InsertQuery = require('mysql-insert-multiple');

let logger = logging.logger;
const port = 80;
const url="on-thin-ice.github.com"
var mysql = require("mysql");
const uuidv1 = require('uuid/v1');

var app = express();
app.use(logging.request_logger);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

logger.info("Starting server");

var con = mysql.createConnection({
    host: secrets.database.host,
    user: secrets.database.user,
    password: secrets.database.password,
    database: secrets.database.database,
});
con.connect(function(err) {
    if (err) throw err;
});

app.post('/api/plan', (req, res) => {
    createExpedition(req, (err, expedition) => {
        if (err) logger.error(err);
        else res.redirect(url+"/globe.html?expedition="+expedition.guid);
    });
});

function createExpedition(req, callback) {
    logger.info("Creating new expedition: " + req.body.title);
    let expedition = {
        title: req.body.title,
        guid: uuidv1(),
        massOfFood: req.body.massOfFood,
        numberOfPeople: req.body.numberOfPeople,
    }
    con.query(InsertQuery({table:"Expeditions", data: [expedition], maxRow:1}).next(), (err, expeditionResult) => {
        if (err && callback) callback(err);
        let waypoints = [];
        for(let i=0;i<req.body.waypoints.length;i++){
            let request_waypoint = req.body.waypoints[i];
            waypoints.push({
                expeditionId: expeditionResult.insertId,
                tileId: request_waypoint,
                routeOrder: i,
            });
        }
        con.query(InsertQuery({table:"WayPoints", data: waypoints, maxRow: waypoints.length}).next(), (err, result) => {
            if (err && callback) callback(err);
            let expeditionStatus = {
                expeditionId: expeditionResult.insertId,
                routeProgress: 0,
                massOfFood: 10,
            }
            con.query(InsertQuery({table:"ExpeditionStatuses", data: [expeditionStatus], maxRow:1}).next(), (err, result) => {
                if (err && callback) callback(err);
                else {
                    expeditionStatus.id = result.insertId;
                    calculateTimeToNextWaypoint(expeditionStatus);
                    callback(null, expedition);
                }
            });
        });
    });
}

function updateStatus(expeditionStatusId, nextRouteProgress){
    con.query("UPDATE ExpeditionStatuses SET routeProgress="+nextRouteProgress+" WHERE id="+expeditionStatusId, function (err, result) {
        if (err) logger.error(err);
        else {         
            con.query("SELECT * FROM ExpeditionStatuses WHERE id="+expeditionStatusId, function (err, result) {
                let expeditionStatus = result[0];
                calculateTimeToNextWaypoint(expeditionStatus);
            });
        }
    });
}

function calculateTimeToNextWaypoint(expeditionStatus, callback){
    logger.debug("Calculcating the time to reach the next waypoint.")
    con.query("SELECT * FROM WayPoints WHERE expeditionId="+expeditionStatus.expeditionId+" AND routeOrder="+expeditionStatus.routeProgress, (err, result) => {
        if (err && callback) callback(err);
        let currentWayPoint = result[0];
        let nextRouteProgress = currentWayPoint.routeOrder+1;
        console.log(currentWayPoint);
        console.log("nextRouteProgress:"+nextRouteProgress);
        con.query("SELECT * FROM WayPoints WHERE routeOrder="+nextRouteProgress, (err, result) => {
            if (err && callback) callback(err);
            let nextWayPoint = result[0];
            let timeToNextWayPoint = 1000;

            if (nextWayPoint == null) {
                logger.info("route completed!");
                if (callback) callback();
            }
            else {
                setTimeout(updateStatus, timeToNextWayPoint, expeditionStatus.id, nextRouteProgress);
                if (callback) callback(err);
            }
        });
    });
}

function getDatabase(table){
    return function(req, res){
        try{
            con.query("SELECT * FROM "+table, function (err, result) {
                if (err) throw err;
                res.json(result);
            });
        }
        catch (err){
            logger.error(err);
        }
    }
}
app.get("/api/expeditions", getDatabase("Expeditions"));
app.get("/api/expedition-statuses", getDatabase("ExpeditionStatuses"));
app.get("/api/tiles", getDatabase("Tiles"));
app.get("/api/waypoints", getDatabase("Waypoints"));

app.listen(port, function() {
    logger.info("Server running at http://localhost:"+port+"/");
});