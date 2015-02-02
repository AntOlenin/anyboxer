var _ = require('underscore');
var pointBoxer = require('./pointBoxer');


/**
 * Возвращает уникальные и объединенные боксы для multiPoint.
 * */
function getBoxes(multiPoint, fat) {
    var coordinatesList = multiPoint.coordinates;

    var pointsBoxes = _.map(coordinatesList, function(coordinates) {
        var point = buildPoint(coordinates);
        return pointBoxer(point, fat);
    });

    return _.flatten(pointsBoxes, true);
}

function buildPoint(coordinates) {
    return {
        "type": "Point",
        "coordinates": coordinates
    };
}

module.exports = getBoxes;