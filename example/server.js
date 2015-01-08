var express = require('express');
var app = express();

var anyBoxer = require('anyboxer');
var boxer = new anyBoxer;

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.get('/boxer-test', function(req, res) {
    var lineString = [[1, 1], [2, 2]];
    var options = {
        data: {
            lineString: lineString
        },
        fat: 2,
        split: true
    };
    var boxes = boxer.getBoxes(options);
    return res.send(boxes);
});

var server = app.listen(3000, function() {
    var address = server.address();
    console.log('Example app listening at http://%s:%s', address.address, address.port)
});