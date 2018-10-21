var fs = require('fs');
var globe = require('./globe/globe.js');
let order = 7;
let scale = 0.64;
let g = globe.create(order, scale);
let data = JSON.stringify(g);
fs.writeFile("./globe_"+order+"_"+scale+".json", data, function(err) {
    if(err) {
        return console.log(err);
    }
}); 