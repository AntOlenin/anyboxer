var _ = require('underscore');
var LineStringBoxer = require('./lineStringBoxer');
var MultiLineStringBoxer = require('./multiLineStringBoxer');
var PointBoxer = require('./pointBoxer');
var MultiPointBoxer = require('./multiPointBoxer');

var lineStringBoxer = new LineStringBoxer;
var multiLineStringBoxer = new MultiLineStringBoxer;
var pointBoxer = new PointBoxer;
var multiPointBoxer = new MultiPointBoxer;


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
 * @callback {err}, {Array} массив боксов объединенный или разделенный, в зависимости от split.
 *
 * */
function anyBoxer(data, options, callback) {
    var boxes = [];

    if (data['type'] != "FeatureCollection") {
        console.warn('data type must be a FeatureCollection http://geojson.org/geojson-spec.html#examples');
    }

    var features = data.features;
    var featureLineStrings = extractOneType(features, "LineString");
    var featureMultiLineStrings = extractOneType(features, "MultiLineString");
    var featurePoints = extractOneType(features, "Point");
    var featureMultiPoints = extractOneType(features, "MultiPoint");

    if (options.reverse) {
        reverseLineStrings(featureLineStrings);
        reverseMultiLineStrings(featureMultiLineStrings);
        reversePoints(featurePoints);
        reverseMultiPoints(featureMultiPoints);
    }

    var featureLineStringsBoxes = getOneTypeBoxes(featureLineStrings, lineStringBoxer);
    var featureMultiLineStringsBoxes = getOneTypeBoxes(featureMultiLineStrings, multiLineStringBoxer);
    var featurePointsBoxes = getOneTypeBoxes(featurePoints, pointBoxer);
    var featureMultiPointsBoxes = getOneTypeBoxes(featureMultiPoints, multiPointBoxer);

    if (options.split) {
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

    callback(null, boxes);
}

function reverseMultiLineStrings(multiLineStrings) {
    _.each(multiLineStrings, function(multiLineString) {

        var newCoordinates = _.map(multiLineString.geometry.coordinates, function(coordsList) {
            return reverseEach(coordsList);
        });

        multiLineString.geometry.coordinates = newCoordinates;
    });
}

function reverseLineStrings(lineStrings) {
    _.each(lineStrings, function(lineString) {
        lineString.geometry.coordinates = reverseEach(lineString.geometry.coordinates);
    });
}

function reverseMultiPoints(multiPoints) {
    return _.each(multiPoints, function(multiPoint) {
        multiPoint.geometry.coordinates = reverseEach(multiPoint.geometry.coordinates);
    });
}

function reversePoints(points) {
    _.each(points, function(point) {
        var coords = point.geometry.coordinates;
        point.geometry.coordinates = [coords[1], coords[0]];
    });
}

function reverseEach(coordsList) {
    return _.map(coordsList, function(coords) {
        return [coords[1], coords[0]];
    })
}

function extractOneType(features, type) {
    return _.filter(features, function(item) {
        if (item['type'] != "Feature") {
            console.warn('features item type must not be a ' + item['type']);
            return false;
        }
        if (item.geometry.type === type) return true;
    });
}

function getOneTypeBoxes(features, instance) {
    return _.map(features, function(feature) {
        var one = buildGeoJsonType(feature);
        var fat = feature.properties.fat;
        return instance.getBoxes(one, fat);
    });
}

function buildGeoJsonType(feature) {
    return {
        "type": feature.geometry.type,
        "coordinates": feature.geometry.coordinates
    };
}


module.exports = anyBoxer;