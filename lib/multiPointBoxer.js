var _ = require('underscore');
var async = require('async');
var pointBoxer = require('./pointBoxer');


/**
 * Возвращает уникальные и объединенные боксы для multiPoint.
 * */
function getBoxes(multiPoint, options, callback) {
    var coordinatesList = multiPoint.coordinates;
    var series = [];

    _.each(coordinatesList, function(coordinates) {
        var point = buildPoint(coordinates);
        var func = function(callback) {
            pointBoxer(point, options, function(err, boxes) {
                callback(null, boxes)
            });
        };
        series.push(func);
    });

    async.series(series, function(err, result) {
        callback(null, _.flatten(result, true));
    });
}

function buildPoint(coordinates) {
    return {
        "type": "Point",
        "coordinates": coordinates
    };
}

module.exports = getBoxes;