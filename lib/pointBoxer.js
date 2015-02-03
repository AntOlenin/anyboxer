var _ = require('underscore');

var R = 6378;
var EQUATOR_DEGREE_KM = (2 * Math.PI * R) / 360;


/**
 * Возвращает уникальные и объединенные боксы для point.
 * */
function getBoxes(point, options, callback) {
    var coordinates = point.coordinates;
    var fat = options.fat;

    if (options.reverse) {
        coordinates = reverse(coordinates);
    }

    var pointBox = getPointBox(coordinates, fat);

    callback(null, [pointBox]);
}

function getPointBox(coordinates, fat) {
    var cosCurrentLat = cosd(coordinates[0]);
    var currentLatDegreeKm = cosCurrentLat * EQUATOR_DEGREE_KM;

    var fatHeightDegree = fat / EQUATOR_DEGREE_KM;
    var fatWidthDegree  = fat / currentLatDegreeKm;

    var sw = [coordinates[0]-fatHeightDegree, coordinates[1]-fatWidthDegree];
    var ne = [coordinates[0]+fatHeightDegree, coordinates[1]+fatWidthDegree];

    return [sw, ne];
}

function reverse(coordinates) {
    return [coordinates[1], coordinates[0]];
}

function cosd(degree) {
    return Math.cos( toRadian(degree) );
}

function toRadian(num) {
    return num * Math.PI / 180;
}


module.exports = getBoxes;