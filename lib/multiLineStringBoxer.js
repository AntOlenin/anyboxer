var _ = require('underscore');
var async = require('async');
var lineStringBoxer = require('./lineStringBoxer');


/**
 * Возвращает уникальные и объединенные боксы для multiLineString.
 * */
function getBoxes(multiLineString, options, callback) {
    var coordinatesList = multiLineString.coordinates;
    var series = [];

    _.each(coordinatesList, function(coordinates) {
        var lineString = buildLineString(coordinates);
        var func = function(callback) {
            lineStringBoxer(lineString, options, function(err, boxes) {
                callback(null, boxes)
            });
        };
        series.push(func);
    });

    async.series(series, function(err, result) {
        callback(null, _.flatten(result, true));
    });
}

function buildLineString(coordinates) {
    return {
        "type": "LineString",
        "coordinates": coordinates
    };
};

module.exports = getBoxes;