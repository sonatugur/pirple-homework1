//Dependencies
var http = require('http');
var https = require('https');
var fs = require('fs');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');




//The server should respond to all requests with a string
const httpServer = http.createServer( (req,res) => {
    unifiedServer(req,res);
})
httpServer.listen(config.httpPort,()=> 
    console.log('server is listening on port '+config.httpPort));

var httpsServerOptions = {
    'key' : fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem'),
};
const httpsServer = https.createServer(httpsServerOptions, (req,res) => {
    unifiedServer(req,res);
})

httpsServer.listen(config.httpsPort,()=> 
    console.log('server is listening on port '+config.httpsPort));

    

var unifiedServer = function(req,res) {
    var parsedUrl = url.parse(req.url,true);    

    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g,'');

    var queryStringObject = parsedUrl.query;

    var method = req.method.toLowerCase(); 

    var headers = req.headers;

    var decoder = new StringDecoder('utf-8');
    let buffer = '';

    req.on('data', (data) => {
        buffer += decoder.write(data);
    });

    req.on('end',()=> {
        buffer += decoder.end();

        var data = {
            'method' : method,
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'headers' : headers,
            'payload' : buffer
        }
        var chosenHandler = typeof(routers[trimmedPath]) !== 'undefined' ? routers[trimmedPath] : routers.notFound;

        chosenHandler(data, (statusCode,payload) => {
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
            payload = typeof(payload) == 'object' ? payload : {};
            var payloadString = JSON.stringify(payload);
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
            console.log('returning this response', statusCode,payloadString);
        });
        
    })
}


var handlers = { };

handlers.hello = function(data,callback) {
    callback(200,{'message':'hello world!'});
};

handlers.notFound = function (data,callback) {
    callback(404); 
};    
    

var routers = {
    'hello' : handlers.hello
}