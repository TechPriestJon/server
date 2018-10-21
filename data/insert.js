// This script inserts information about the planet into the database.
const secrets = require("./../secrets.json");
const globe = require("./../globe_7_0.64.json");
var mysql = require("mysql");
var InsertQuery = require('mysql-insert-multiple');
var Simplex = require('perlin-simplex');

var con = mysql.createConnection({
    host: secrets.database.host,
    user: secrets.database.user,
    password: secrets.database.password,
    database: secrets.database.database,
});

function add(a, b){
    return {
        x: a.x + b.x,
        y: a.y + b.y,
        z: a.z + b.z,
    }
}
function div(a, factor){
    return {
        x: a.x / factor,
        y: a.y / factor,
        z: a.z / factor,
    }
}
let simplex = new Simplex();
let c = 5;
let tiles = globe.tiles.map(tile => {
    let centre = div(tile.map(t => globe.vertices[t]).reduce((a, b) => add(a, b)), tile.length);
    let temperature = 40*simplex.noise3d(centre.x*c, centre.y*c, centre.z*c) - 30; 
    return ({
        height: tile.map(t => globe.vertices[t].h).reduce((a, b) => a + b) / tile.length,
        temperature: temperature
    });
});
con.connect(function(err) {
    if (err) throw err;
    var query = InsertQuery({
        maxRow: tiles.length,
        table: 'Tiles',
        data: tiles
    });
    let sql = query.next();
    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Finished insert.");
    });
});