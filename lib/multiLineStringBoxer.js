var _ = require('underscore');
var lineStringBoxer = require('./lineStringBoxer');


/**
 * Возвращает уникальные и объединенные боксы для multiLineString.
 * */
function getBoxes(multiLineString, fat) {
    var coordinatesList = multiLineString.coordinates;

    var lineStrinsBoxes = _.map(coordinatesList, function(coordinates) {
        var lineString = buildLineString(coordinates);
        return lineStringBoxer(lineString, fat);
    });

    return _.flatten(lineStrinsBoxes, true);
}

function buildLineString(coordinates) {
    return {
        "type": "LineString",
        "coordinates": coordinates
    };
};

module.exports = getBoxes;