var _ = require('underscore');
var async = require('async');
var lineStringBoxer = require('./lineStringBoxer');
var multiLineStringBoxer = require('./multiLineStringBoxer');
var pointBoxer = require('./pointBoxer');
var multiPointBoxer = require('./multiPointBoxer');


/**
 * @param data {Object} FeatureCollection http://geojson.org/geojson-spec.html#examples}
 * @param options {Object} содержит:
 *      split: {Boolean} если true то разделит результат, иначе объединит.
 *      reverse: {Boolean} если true, то каждую пару координат перевернет [lon, lat] -> [lat, lon].
 * @param callback {Function} {err, boxes}, где:
 *      boxes: массив боксов, если options.split is true, то результат будет разделен.
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
 * */
function anyBoxer(data, options, callback) {
    var boxes = [];

    if (data['type'] != "FeatureCollection") {
        console.warn('data type must be a FeatureCollection http://geojson.org/geojson-spec.html#examples');
    }

    var reverse = options.reverse;

    var features = data.features;
    var featureLineStrings = extractOneType(features, "LineString");
    var featureMultiLineStrings = extractOneType(features, "MultiLineString");
    var featurePoints = extractOneType(features, "Point");
    var featureMultiPoints = extractOneType(features, "MultiPoint");


    //var featureLineStringsBoxes = getOneTypeBoxes(lineStringBoxer, featureLineStrings, reverse);
    //var featureMultiLineStringsBoxes = getOneTypeBoxes(multiLineStringBoxer, featureMultiLineStrings, reverse);
    //var featurePointsBoxes = getOneTypeBoxes(pointBoxer, featurePoints, reverse);
    //var featureMultiPointsBoxes = getOneTypeBoxes(multiPointBoxer, featureMultiPoints, reverse);


    async.series({

        featureLineStringsBoxes: function(callback) {
            getOneTypeBoxes(lineStringBoxer, featureLineStrings, reverse, function(err, boxes) {
                callback(null, boxes)
            })
        },

        featureMultiLineStringsBoxes: function(callback) {
            getOneTypeBoxes(multiLineStringBoxer, featureMultiLineStrings, reverse, function(err, boxes) {
                callback(null, boxes)
            })
        },

        featurePointsBoxes: function(callback) {
            getOneTypeBoxes(pointBoxer, featurePoints, reverse, function(err, boxes) {
                callback(null, boxes)
            })
        },

        featureMultiPointsBoxes: function(callback) {
            getOneTypeBoxes(multiPointBoxer, featureMultiPoints, reverse, function(err, boxes) {
                callback(null, boxes)
            })
        }

    }, function(err, result) {
        if (options.split) {
            boxes.push(result.featureLineStringsBoxes);
            boxes.push(result.featureMultiLineStringsBoxes);
            boxes.push(result.featurePointsBoxes);
            boxes.push(result.featureMultiPointsBoxes);
        } else {
            boxes.push(result.featureLineStringsBoxes);
            boxes.push(result.featureMultiLineStringsBoxes);
            boxes.push(result.featurePointsBoxes);
            boxes.push(result.featureMultiPointsBoxes);
            boxes = _.flatten(boxes, true);
        }

        callback(null, boxes);
    });
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

function getOneTypeBoxes(boxer, features, reverse, callback) {
    return _.map(features, function(feature) {
        var one = buildGeoJsonType(feature);
        var fat = feature.properties.fat;
        var options = {fat: fat, reverse: reverse};
        boxer(one, options, function(err, boxes) {
            callback(null, boxes);
        });
    });
}

function buildGeoJsonType(feature) {
    return {
        "type": feature.geometry.type,
        "coordinates": feature.geometry.coordinates
    };
}


module.exports = anyBoxer;