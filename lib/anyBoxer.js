var _ = require('underscore');
var LineStringBoxer = require('./lineStringBoxer');
var MultiLineStringBoxer = require('./multiLineStringBoxer');

var lineStringBoxer = new LineStringBoxer;
var multiLineStringBoxer = new MultiLineStringBoxer;

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

    var featureLineStringsBoxes = _.map(featureLineStrings, function(featureLineString) {
        var lineString = AnyBoxer.prototype.buildGeoJsonType(featureLineString);
        var fat = featureLineString.properties.fat;
        return lineStringBoxer.getBoxes(lineString, fat);
    });

    var featureMultiLineStringsBoxes = _.map(featureMultiLineStrings, function(featureMultiLineString) {
        var multiLineString = AnyBoxer.prototype.buildGeoJsonType(featureMultiLineString);
        var fat = featureMultiLineString.properties.fat;
        return multiLineStringBoxer.getBoxes(multiLineString, fat);
    });

    if (split) {
        boxes.push(featureLineStringsBoxes);
        boxes.push(featureMultiLineStringsBoxes);
    } else {
        boxes.push(_.flatten(featureLineStringsBoxes, true));
        boxes.push(_.flatten(featureMultiLineStringsBoxes, true));
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

AnyBoxer.prototype.buildGeoJsonType = function(feature, type) {
    return {
        "type": type,
        "coordinates": feature.geometry.coordinates
    };
};


module.exports = AnyBoxer;