var express = require('express');
var app = express();

app.use("/js", express.static(__dirname + '/client'));
app.set('views', __dirname + '/views');

var anyBoxer = require('../index');
var boxer = new anyBoxer;

app.get('/', function (req, res) {
    res.render('index.jade', {name: 'mi'});
});

app.get('/anyboxer', function(req, res) {
    var path = JSON.parse(req.query.path);

    var data = { "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": path
                },
                "properties": {
                    "fat": 5
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "MultiLineString",
                    "coordinates": [
                        [ [0,0], [1,1] ],
                        [ [0,0], [-1, -1] ]
                    ]
                },
                "properties": {
                    "fat": 5
                }
            },
        ]
    };

    var boxes = boxer.getBoxes(data); // вторым параметром можно будет передать split(boolean)
    return res.send(boxes);
});

var server = app.listen(3000, function() {
    var address = server.address();
    console.log('Example app listening at http://%s:%s', address.address, address.port)
});