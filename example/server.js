var express = require('express');
var app = express();

app.use("/js", express.static(__dirname + '/client'));

var anyBoxer = require('anyboxer');
var boxer = new anyBoxer;

app.get('/', function (req, res) {
    res.render('index.jade', {name: 'mi'});
});

app.get('/anyboxer', function(req, res) {
    var lineString = JSON.parse(req.query.path);

    var options = {
        data: {
            lineString: lineString
        },
        fat: 10,
        split: true
    };
    var boxes = boxer.getBoxes(options);
    return res.send(boxes);
});

var server = app.listen(3000, function() {
    var address = server.address();
    console.log('Example app listening at http://%s:%s', address.address, address.port)
});