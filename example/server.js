var express = require('express');
var app = express();
var _ = require('underscore');

app.use("/js", express.static(__dirname + '/client'));
app.set('views', __dirname + '/views');

var anyBoxer = require('../index');

app.get('/', function (req, res) {
    res.render('index.jade', {name: 'mi'});
});

app.get('/check', function (req, res) {
    res.send('Операция обработана...');
});

app.get('/anyboxer', function(req, res) {
    var path = JSON.parse(req.query.path);

    path = _.map(path, function(coords) {return [coords[1], coords[0]]});

    var data = { "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": path
                },
                "properties": {
                    "fat": 3
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "MultiLineString",
                    "coordinates": [
                        [ [0,1], [1,1] ],
                        [ [0,1], [-1, -1] ]
                    ]
                },
                "properties": {
                    "fat": 5
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [5,15]
                },
                "properties": {
                    "fat": 20
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "MultiPoint",
                    "coordinates": [
                        [10,20], [20, 30]
                    ]
                },
                "properties": {
                    "fat": 40
                }
            }
        ]
    };

    var options = {
        split: false,
        reverse: true
    };

    anyBoxer(data, options, function(err, boxes) {
        return res.send(boxes);
    });
});

var server = app.listen(3000, function() {
    var address = server.address();
    console.log('Example app listening at http://%s:%s', address.address, address.port)
});