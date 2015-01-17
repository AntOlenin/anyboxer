var _ = require('underscore');
var LineStringBoxer = require('./lineStringBoxer');
var lineStringBoxer = new LineStringBoxer;

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
    var featureLineStrings = this.extractLineStrings(features);

    var featureLineStringsBoxes = _.map(featureLineStrings, function(featureLineString) {
        return lineStringBoxer.getBoxes(featureLineString);
    });

    if (split) {
        boxes.push(featureLineStringsBoxes);
    } else {
        boxes.push(_.flatten(featureLineStringsBoxes, true));
        boxes = _.flatten(boxes, true);
    }

    return boxes;
};

AnyBoxer.prototype.extractLineStrings = function(features) {
    return _.filter(features, function(item) {
        if (item['type'] != "Feature") {
            console.warn('features item type must not be a ' + item['type']);
            return false;
        }
        if (item.geometry.type === "LineString") return true;
    });
};


module.exports = AnyBoxer;