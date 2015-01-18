var _ = require('underscore');

function PointBoxer() {
    this.R = 6378;
    this.EQUATOR_DEGREE_KM = (2 * Math.PI * this.R) / 360;  // ~111км
}

/**
 * Возвращает уникальные и объединенные боксы для point.
 * */
PointBoxer.prototype.getBoxes = function(point, fat) {
    var coordinates = point.coordinates;

    var pointBox = this.getPointBox(coordinates, fat);

    return [pointBox];
};

PointBoxer.prototype.getPointBox = function(coordinates, fat) {
    var cosCurrentLat = this.cos(coordinates[0]);
    var currentLatDegreeKm = cosCurrentLat * this.EQUATOR_DEGREE_KM;

    var fatHeightDegree = fat / this.EQUATOR_DEGREE_KM;
    var fatWidthDegree  = fat / currentLatDegreeKm;

    var sw = [coordinates[0]-fatHeightDegree, coordinates[1]-fatWidthDegree];
    var ne = [coordinates[0]+fatHeightDegree, coordinates[1]+fatWidthDegree];

    return [sw, ne];
};


PointBoxer.prototype.cos = function(degree) {
    return Math.cos( this.toRadian(degree) );
};

PointBoxer.prototype.toRadian = function(num) {
    return num * Math.PI / 180;
};


module.exports = PointBoxer;