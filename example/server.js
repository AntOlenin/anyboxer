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

    var reversePath = _.map(path, function(coords) {return [coords[1], coords[0]]});

    var data = { "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": reversePath
                },
                "properties": {
                    "fat": 1
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "MultiLineString",
                    "coordinates": [
                        [ [0,1], [1,1] ], // TODO не пашет. разобраться почему
                        [ [0,1], [1,-1] ],
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
                    "fat": 2000
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
    console.log('Example app listening at http://localhost:3000')
});