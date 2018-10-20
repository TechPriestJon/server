var fs = require('fs');
var globe = require('./globe/globe.js');
let data = JSON.stringify(globe.create(0));
fs.writeFile("./globe.json", data, function(err) {
    if(err) {
        return console.log(err);
    }
}); 