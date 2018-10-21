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

try {
    const secrets = require("./../secrets.json");
    var con = mysql.createConnection({
        host: secrets.database.host,
        user: secrets.database.user,
        password: secrets.database.password,
        database: secrets.database.database,
    });
}
catch {
    logger.warn("Failed to find secrets file.")
    try {
        logger.debug(process.env.host);
        logger.debug(process.env.user);
        logger.debug(process.env.database);
        logger.debug(process.env.password);
        var con = mysql.createConnection({
            host: process.env.host,
            user: process.env.user,
            password: process.env.password,
            database: process.env.database
        });
    }
    catch(err){
        logger.debug(err);
    }
}
logger.info("did I error..?");
logger.info("Hi Ben :D");
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
                expeditionStatusTypeId: 1,
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
    logger.info("Updating expedition: "+expeditionStatusId);
    if (massOfFood > 0) {
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
    else {
        con.query("UPDATE ExpeditionStatuses SET routeProgress="+nextRouteProgress+",massOfFood="+massOfFood+",expeditionStatusTypeId=3 WHERE id="+expeditionStatusId, function (err, result) {
            if (err) logger.error(err);
            logger.info("Expedition failed :(");
        });
    }
}

function calculateTimeToNextWaypoint(expeditionStatus, callback){
    logger.debug("Calculating the time to reach the next waypoint.")
    con.query("SELECT * FROM WayPoints WHERE expeditionId="+expeditionStatus.expeditionId+" AND routeOrder="+expeditionStatus.routeProgress, (err, result) => {
        if (err && callback) callback(err);
        let currentWayPoint = result[0];
        con.query("UPDATE Tiles SET discovered=1 WHERE id="+currentWayPoint.tileId, function (err, result) {
            if (err && callback) callback(err);
            let nextRouteProgress = currentWayPoint.routeOrder+1;
            con.query("SELECT * FROM WayPoints WHERE routeOrder="+nextRouteProgress, (err, result) => {
                if (err && callback) callback(err);
                if (result.length == 0){
                    con.query("UPDATE ExpeditionStatuses SET expeditionStatusTypeId=2 WHERE id="+expeditionStatus.id, function (err, result) {
                        if (callback) callback();
                        logger.info("Expedition has completed successfully!");
                    });
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

function getDatabase(table, id){
    return function(req, res){
        try{
            let sql;
            if (id) sql = "SELECT * FROM "+table+" WHERE id="+req.params.id;
            else sql = "SELECT * FROM "+table;
            con.query(sql, function (err, result) {
                if (err) throw err;
                res.json(result);
            });
        }
        catch (err){
            logger.error(err);
        }
    }
}
app.get("/api/tiles", (req, res) => {
    try{
        let sql = "SELECT * FROM Tiles"
        con.query(sql, function (err, result) {
            if (err) throw err;
            res.json(result.map(tile => {
                if (tile.discovered === 1){
                    return ({
                        id: tile.id,
                        h: tile.height,
                        t: tile.temperature,
                    });
                }
                else {
                    return ({
                        id: tile.id
                    });
                }
            }));
        });
    }
    catch (err){
        logger.error(err);
    }
});
app.get("/api/expeditions", (req, res) => {
    try{
        let sql = "SELECT * FROM ExpeditionStatuses"
        con.query(sql, function (err, result) {
            if (err) throw err;
            res.json(result.map(expedition => {


            }));
        });
    }
    catch (err){
        logger.error(err);
    }
});


// debugs
app.get("/api/debug/expeditions", getDatabase("Expeditions"));
app.get("/api/debug/expedition-statuses", getDatabase("ExpeditionStatuses"));
app.get("/api/debug/expedition-status-types", getDatabase("ExpeditionStatusTypes"));
app.get("/api/debug/tiles", getDatabase("Tiles"));
app.get("/api/debug/tiles/:id", getDatabase("Tiles", true));
app.get("/api/debug/waypoints", getDatabase("Waypoints"));

app.listen(port, function() {
    logger.info("Server running at http://localhost:"+port+"/");
});