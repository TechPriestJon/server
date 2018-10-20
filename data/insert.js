// This script inserts information about the planet into the database.
const secrets = require("./../secrets.json");
var mysql = require("mysql");
var InsertQuery = require('mysql-insert-multiple');

var con = mysql.createConnection({
    host: secrets.database.host,
    user: secrets.database.user,
    password: secrets.database.password,
    database: secrets.database.database,
});



nx = 4; ny = 5
for x in range(nx):
    lon = 360 * ((x+0.5) / nx)
    for y in range(ny):                                                         
        midpt = (y+0.5) / ny                                                    
        lat = 180 * asin(2*((y+0.5)/ny-0.5))                                    
        print lon,lat   

let tiles = [];
for(let i=0;i<10;i++){
    tiles.push({
        height: Math.random()*1000,
        temperature: Math.random()*40-30
    });
}

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected to database.");
    console.log(tiles);
    var query = InsertQuery({
        maxRow: tiles.length,
        table: 'Tiles',
        data: tiles
    });
       
    let sql = query.next();
    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log(result);
    });
});