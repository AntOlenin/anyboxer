'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _lineStringBoxer = require('./lineStringBoxer');

var _lineStringBoxer2 = _interopRequireDefault(_lineStringBoxer);

var _multiLineStringBoxer = require('./multiLineStringBoxer');

var _multiLineStringBoxer2 = _interopRequireDefault(_multiLineStringBoxer);

var _pointBoxer = require('./pointBoxer');

var _pointBoxer2 = _interopRequireDefault(_pointBoxer);

var _multiPointBoxer = require('./multiPointBoxer');

var _multiPointBoxer2 = _interopRequireDefault(_multiPointBoxer);

function anyBoxer(data, options) {
  var features = data.features;
  var reverse = options.reverse;

  var parsedByType = _underscore2['default'].groupBy(data.features, function (num) {
    return num.geometry.type;
  });

  var lineStringsBoxes = getOneTypeBoxes(_lineStringBoxer2['default'], parsedByType.LineString);
  var multiLineStringsBoxes = getOneTypeBoxes(_multiLineStringBoxer2['default'], parsedByType.MultiLineString);
  var pointsBoxes = getOneTypeBoxes(_pointBoxer2['default'], parsedByType.Point);
  var multiPointsBoxes = getOneTypeBoxes(_multiPointBoxer2['default'], parsedByType.MultiPoint);

  var boxes = _underscore2['default'].flatten([lineStringsBoxes, multiLineStringsBoxes, pointsBoxes, multiPointsBoxes], true);
  return _underscore2['default'].flatten(boxes, true);
}

function getOneTypeBoxes(boxer, features) {
  return _underscore2['default'].map(features, function (feature) {
    var one = buildGeoJsonType(feature);
    var options = { fat: feature.properties.fat, reverse: true };
    return boxer(one, options);
  });
}

function buildGeoJsonType(feature) {
  return {
    "type": feature.geometry.type,
    "coordinates": feature.geometry.coordinates
  };
}

function validateData(data) {
  var note = 'data type must be a FeatureCollection http://geojson.org/geojson-spec.html#examples';

  if (!_underscore2['default'].isObject(data)) {
    throw note;
  }

  if (data['type'] != "FeatureCollection") {
    console.warn(note);
  }
}

exports['default'] = anyBoxer;
module.exports = exports['default'];