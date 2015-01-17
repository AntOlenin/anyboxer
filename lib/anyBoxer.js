var _ = require('underscore');
var LineStringBoxer = require('./lineStringBoxer');
var lineStringBoxer = new LineStringBoxer;

function AnyBoxer() {

}

/**
 * Принимает data и options.
 *
 * Примеры data:
 *     lineString:  [ [lat, lon],[lat, lon],[lat, lon] ]
 *     multiLineString: [ [[lat, lon],[lat, lon]], [[lat, lon],[lat, lon]] ]
 *     polygon: [ [lat*, lon*],[lat, lon],[lat, lon],[lat*, lon*] ]
 *     multiPolygon: [ ... ]
 *     point: [ ... ]
 *     multiPoint: [ ... ]
 *
 * Значение с приставкой multi, перезаписывает соответствующее
 * значения без приставки.
 *
 * Примеры options:
 *     split: (false). Если true, то разделяет возвращаемый результат на
 *          подрезультаты, соответствующие заданым параметрам data. В случае
 *          false вернет один массив из уникальных объединенных значений.
 *     fat: (2). Жирность, учитываемая при составлении результата, для
 *          point жирностью является радиус. Для polygon не учитывается.
 *
 * */
AnyBoxer.prototype.getBoxes = function(data, split) {

    if (data['type'] != "FeatureCollection") {
        console.warn('data type must be a FeatureCollection http://geojson.org/geojson-spec.html#examples');
    }

    var features = data.features;
    var featureLineStrings = this.extractLineStrings(features);

    if (featureLineStrings.length) {
        var featureLineString = featureLineStrings[0]; // пока работает только с 1 featureLineString
        var lineStringBoxes = lineStringBoxer.getBoxes(featureLineString);
    }

    var pointBoxes = null;
    var polygonBoxes = null;

    return lineStringBoxes; // пока возвращает только lineStringBoxes
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