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
                numberOfPeople: parseInt(expedition.numberOfPeople),
                routeProgress: 0,
                massOfFood: parseFloat(expedition.massOfFood),
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

function updateStatus(expeditionStatusId, nextRouteProgress, massOfFood){
    con.query("UPDATE ExpeditionStatuses SET routeProgress="+nextRouteProgress+",massOfFood="+massOfFood+" WHERE id="+expeditionStatusId, function (err, result) {
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
        con.query("SELECT * FROM WayPoints WHERE routeOrder="+nextRouteProgress, (err, result) => {
            if (err && callback) callback(err);
            if (result.length == 0){
                logger.info("Expedition has completed successfully!");
                if (callback) callback();
            }
            else {
                let nextWayPoint = result[0];
                let timeToNextWayPoint = 1000;
                calcFoodRequired(expeditionStatus.numberOfPeople, currentWayPoint.tileId, nextWayPoint.tileId, (err, foodRequired) => {
                    if (err && callback) callback(err);
                    let newMassOfFood = Math.max(0, expeditionStatus.massOfFood - foodRequired);
                    setTimeout(updateStatus, timeToNextWayPoint, expeditionStatus.id, nextRouteProgress, newMassOfFood);
                });
            }
        });
    });
}

function calcFoodRequired(numberOfPeople, currentTileId, nextTileId, callback){
    con.query("SELECT * FROM Tiles WHERE id="+currentTileId, (err, result) => {
        if (callback && err) callback(err);
        else {
            let currentTile = result[0];
            con.query("SELECT * FROM Tiles WHERE id="+nextTileId, (err, result) => {
                if (callback && err) callback(err);
                let nextTile = result[0];
                let elevationChange = nextTile.height - currentTile.height;
                let elevationFactor = 1 + Math.max(0, elevationChange) * 0.0001;
                let temperatureFactor = 1 - Math.min(0, nextTile.temperature) * 0.001;
                const baseAmountOfFood = 10;
                let foodRequired = Math.max(0, numberOfPeople * (baseAmountOfFood * elevationFactor * temperatureFactor));
                callback(null, foodRequired);
            });
        }
    });
}

function totalMassCapacity(numberOfPeople){
    return Math.exp(numberOfPeople); 
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