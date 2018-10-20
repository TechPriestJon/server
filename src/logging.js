const bunyan = require("bunyan");

let logger = bunyan.createLogger({
    name: "test",
    streams: [{
      type: 'rotating-file',
      path: './logs/log.json',
    },
  {
    stream: process.stdout
  }]
});
exports.logger = logger;
exports.request_logger = function(req, res, next) {
    logger.info("["+req.ip+"] for [" + req.originalUrl + "]");
    next();
}