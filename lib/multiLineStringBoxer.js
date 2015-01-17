var _ = require('underscore');
var LineStringBoxer = require('./lineStringBoxer');

var lineStringBoxer = new LineStringBoxer;

function MultiLineStringBoxer() {

}

/**
 * Возвращает уникальные и объединенные боксы для multiLineString.
 * */
MultiLineStringBoxer.prototype.getBoxes = function(multiLineString, fat) {
    var coordinatesList = multiLineString.coordinates;

    var lineStrinsBoxes = _.map(coordinatesList, function(coordinates) {
        var lineString = MultiLineStringBoxer.prototype.buildLineString(coordinates);
        return lineStringBoxer.getBoxes(lineString, fat);
    });

    return _.flatten(lineStrinsBoxes, true);
};

MultiLineStringBoxer.prototype.buildLineString = function(coordinates) {
    return {
        "type": "LineString",
        "coordinates": coordinates
    };
};

module.exports = MultiLineStringBoxer;