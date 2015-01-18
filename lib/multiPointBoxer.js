var _ = require('underscore');
var PointBoxer = require('./pointBoxer');

var pointBoxer = new PointBoxer;

function MultiPointBoxer() {

}

/**
 * Возвращает уникальные и объединенные боксы для multiPoint.
 * */
MultiPointBoxer.prototype.getBoxes = function(multiPoint, fat) {
    var coordinatesList = multiPoint.coordinates;

    var pointsBoxes = _.map(coordinatesList, function(coordinates) {
        var point = MultiPointBoxer.prototype.buildPoint(coordinates);
        return pointBoxer.getBoxes(point, fat);
    });

    return _.flatten(pointsBoxes, true);
};

MultiPointBoxer.prototype.buildPoint = function(coordinates) {
    return {
        "type": "Point",
        "coordinates": coordinates
    };
};

module.exports = MultiPointBoxer;