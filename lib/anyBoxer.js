var _ = require('underscore');
var LineStringBoxer = require('./lineStringBoxer');
var MultiLineStringBoxer = require('./multiLineStringBoxer');
var PointBoxer = require('./pointBoxer');
var MultiPointBoxer = require('./multiPointBoxer');

var lineStringBoxer = new LineStringBoxer;
var multiLineStringBoxer = new MultiLineStringBoxer;
var pointBoxer = new PointBoxer;
var multiPointBoxer = new MultiPointBoxer;

function AnyBoxer() {

}

/**
 * @param data {Object} FeatureCollection http://geojson.org/geojson-spec.html#examples}
 * @param split {Boolean} если true то разделит результат, иначе объединит. Default: false.
 *
 * Параметр fat каждого элемента FeatureCollection - жирность, учитывая которую нужно
 * строить боксы. Для Point жирностью является радиус. Для LineString - поля от краев.
 *
 * @example data
 *
 *  { "type": "FeatureCollection",
 *       "features": [
 *           {
 *               "type": "Feature",
 *               "geometry": {
 *                   "type": "LineString",
 *                   "coordinates": [ [0,0], [1,1] ] // [ [lat, lon], [lat, lon] ]
 *               },
 *               "properties": {
 *                  "fat": 5
 *               }
 *           },
 *       ]
 *   };
 *
 * Бокс - прямоугольные границы, выраженные Юго-Западным и Северо-Восточным углами.
 *
 * @example box
 *
 *  sw = [lat, lon] // координаты Юго-Западного угла
 *  ne = [lat, lon] // координаты Северо-Восточного угла
 *  box = [sw, ne]
 *
 * @return {Array} массив боксов объединенный или разделенный, в зависимости от split.
 *
 * */
AnyBoxer.prototype.getBoxes = function(data, split) {
    var boxes = [];

    if (data['type'] != "FeatureCollection") {
        console.warn('data type must be a FeatureCollection http://geojson.org/geojson-spec.html#examples');
    }

    var features = data.features;
    var featureLineStrings = this.extractOneType(features, "LineString");
    var featureMultiLineStrings = this.extractOneType(features, "MultiLineString");
    var featurePoints = this.extractOneType(features, "Point");
    var featureMultiPoints = this.extractOneType(features, "MultiPoint");

    var featureLineStringsBoxes = this.getOneTypeBoxes(featureLineStrings, lineStringBoxer);
    var featureMultiLineStringsBoxes = this.getOneTypeBoxes(featureMultiLineStrings, multiLineStringBoxer);
    var featurePointsBoxes = this.getOneTypeBoxes(featurePoints, pointBoxer);
    var featureMultiPointsBoxes = this.getOneTypeBoxes(featureMultiPoints, multiPointBoxer);

//    var featureMultiLineStringsBoxes = _.map(featureMultiLineStrings, function(featureMultiLineString) {
//        var multiLineString = AnyBoxer.prototype.buildGeoJsonType(featureMultiLineString);
//        var fat = featureMultiLineString.properties.fat;
//        return multiLineStringBoxer.getBoxes(multiLineString, fat);
//    });
//
//    var featurePointsBoxes = _.map(featurePoints, function(featurePoint) {
//        var point = AnyBoxer.prototype.buildGeoJsonType(featurePoint);
//        var fat = featurePoint.properties.fat;
//        return pointBoxer.getBoxes(point, fat);
//    });
//
//    var featureMultiPointsBoxes = _.map(featureMultiPoints, function(featureMultiPoint) {
//        var multiPoint = AnyBoxer.prototype.buildGeoJsonType(featureMultiPoint);
//        var fat = featureMultiPoint.properties.fat;
//        return multiPointBoxer.getBoxes(multiPoint, fat);
//    });

    if (split) {
        boxes.push(featureLineStringsBoxes);
        boxes.push(featureMultiLineStringsBoxes);
        boxes.push(featurePointsBoxes);
        boxes.push(featureMultiPointsBoxes);
    } else {
        boxes.push(_.flatten(featureLineStringsBoxes, true));
        boxes.push(_.flatten(featureMultiLineStringsBoxes, true));
        boxes.push(_.flatten(featurePointsBoxes, true));
        boxes.push(_.flatten(featureMultiPointsBoxes, true));
        boxes = _.flatten(boxes, true);
    }

    return boxes;
};

AnyBoxer.prototype.extractOneType = function(features, type) {
    return _.filter(features, function(item) {
        if (item['type'] != "Feature") {
            console.warn('features item type must not be a ' + item['type']);
            return false;
        }
        if (item.geometry.type === type) return true;
    });
};

AnyBoxer.prototype.getOneTypeBoxes = function(features, boxer) {
    return _.map(features, function(feature) {
        var one = AnyBoxer.prototype.buildGeoJsonType(feature);
        var fat = feature.properties.fat;
        return boxer.getBoxes(one, fat);
    });

};

AnyBoxer.prototype.buildGeoJsonType = function(feature) {
    return {
        "type": feature.geometry.type,
        "coordinates": feature.geometry.coordinates
    };
};


module.exports = AnyBoxer;