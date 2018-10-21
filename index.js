var app = require("./src/app.js");
var http = require("http");
var server = http.createServer(app);

const port = 3000;
app.set('port', port);
server.listen(port);