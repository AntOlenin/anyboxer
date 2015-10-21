'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var R = 6378;
var EQUATOR_DEGREE_KM = 2 * Math.PI * R / 360;

/**
 * Возвращает уникальные и объединенные боксы для lineString.
 *
 * 1. Расчитывает mainBox из Юго-Западной и Северо-Восточной точек трека.
 * 2. Расширяет mainBox на расстояние fat, чтобы гарантированно соблюдался fat во всех местах трека.
 * 3. Ищем subBoxes - разбиваем mainBox на множество subBoxes с шириной fat.
 * 4. Фильтруем subBoxes, оставляем только те, что пересекают трек. intersectBoxes.
 * 5. Добавляем соседние subBoxes, к каждому из intersectBoxes. necessaryBoxes.
 * 6. Объединяем боксы, чтобы вернуть их как можно меньше.
 *
 * */
function getBoxes(lineString, options) {
  var coordinates = lineString.coordinates;
  var fat = options.fat;
  var reverse = options.reverse;

  if (reverse) coordinates = reverseList(coordinates);

  var mainBox = getMainBox(coordinates);
  extendByFat(mainBox, fat);
  var subBoxes = getSubBoxes(mainBox, fat);
  var intersectBoxes = filterIntersectBoxes(subBoxes, coordinates);
  var necessaryBoxes = getNecessaryBoxes(intersectBoxes, subBoxes);

  return mergeBoxes(necessaryBoxes);
}

function getMainBox(coordinates) {
  var lats = _underscore2['default'].map(coordinates, function (item) {
    return item[0];
  });
  var lons = _underscore2['default'].map(coordinates, function (item) {
    return item[1];
  });

  var sw = [_underscore2['default'].min(lats), _underscore2['default'].min(lons)];
  var ne = [_underscore2['default'].max(lats), _underscore2['default'].max(lons)];

  return [sw, ne];
}

function extendByFat(box, fat) {
  var _box = _slicedToArray(box, 2);

  var sw = _box[0];
  var ne = _box[1];

  var cosCurrentLat = cosd(sw[0]);
  var currentLatDegreeKm = cosCurrentLat * EQUATOR_DEGREE_KM;
  var fatHeightDegree = fat / EQUATOR_DEGREE_KM;
  var fatWidthDegree = fat / currentLatDegreeKm;

  sw = [sw[0] - fatHeightDegree, sw[1] - fatWidthDegree];
  ne = [ne[0] + fatHeightDegree, ne[1] + fatWidthDegree];

  box[0] = sw;box[1] = ne;
}

function getSubBoxes(box, fat) {
  var _box2 = _slicedToArray(box, 2);

  var sw = _box2[0];
  var ne = _box2[1];

  var boxWidth = ne[1] - sw[1];
  var boxHeight = ne[0] - sw[0];
  var cosCurrentLat = cosd(sw[0]);
  var currentLatDegreeKm = cosCurrentLat * EQUATOR_DEGREE_KM;
  var boxWidthKm = boxWidth * currentLatDegreeKm;
  var boxHeightKm = boxHeight * EQUATOR_DEGREE_KM;
  var colAmount = Math.floor(boxWidthKm / fat) + 1;
  var rowAmount = Math.floor(boxHeightKm / fat) + 1;

  var subBoxHeight = fat / EQUATOR_DEGREE_KM;
  var subBoxWidth = fat / currentLatDegreeKm;

  return _underscore2['default'].map(_underscore2['default'].range(colAmount), function (colIndex) {
    return _underscore2['default'].map(_underscore2['default'].range(rowAmount), function (rowIndex) {
      var _sw = _slicedToArray(sw, 2);

      var swLat = _sw[0];
      var swLon = _sw[1];

      var verticalOffset = subBoxHeight * rowIndex;
      var horisontalOffset = subBoxWidth * colIndex;

      var subSwLat = swLat + verticalOffset;
      var subSwLon = swLon + horisontalOffset;
      var subNeLat = swLat + verticalOffset + subBoxHeight;
      var subNeLon = swLon + horisontalOffset + subBoxWidth;

      var subSw = [subSwLat, subSwLon];
      var subNe = [subNeLat, subNeLon];

      return [subSw, subNe];
    });
  });
}

function filterIntersectBoxes(boxes, coordinates) {
  return _underscore2['default'].map(boxes, function (oneLineSubBoxes) {
    return _underscore2['default'].filter(oneLineSubBoxes, function (box) {
      return isIntersectOneBox(box, coordinates);
    });
  });
}

function isIntersectOneBox(box, coordinates) {
  var _box3 = _slicedToArray(box, 2);

  var sw = _box3[0];
  var ne = _box3[1];

  var nw = [sw[0], ne[1]];
  var se = [ne[0], sw[1]];
  var boxVertexesList = [sw, nw, ne, se];
  var boxSides = [];
  var lineStringSides = [];

  _underscore2['default'].each(boxVertexesList, function (item, i) {
    var side = [boxVertexesList[i], boxVertexesList[i + 1] || boxVertexesList[0]];
    boxSides.push(side);
  });

  _underscore2['default'].each(coordinates, function (item, i) {
    var side = [coordinates[i], coordinates[i + 1]];
    if (_underscore2['default'].compact(side).length === 2) lineStringSides.push(side);
  });

  for (var j = 0; j < lineStringSides.length; j++) {
    for (var k = 0; k < boxSides.length; k++) {
      if (isIntersectOneSide(boxSides[k], lineStringSides[j])) {
        return true;
      }
    }
  }
}

function isIntersectOneSide(boxSide, lineStringSide) {
  var ax1 = boxSide[0][0];
  var ay1 = boxSide[0][1];
  var ax2 = boxSide[1][0];
  var ay2 = boxSide[1][1];

  var bx1 = lineStringSide[0][0];
  var by1 = lineStringSide[0][1];
  var bx2 = lineStringSide[1][0];
  var by2 = lineStringSide[1][1];

  var v1 = (bx2 - bx1) * (ay1 - by1) - (by2 - by1) * (ax1 - bx1);
  var v2 = (bx2 - bx1) * (ay2 - by1) - (by2 - by1) * (ax2 - bx1);
  var v3 = (ax2 - ax1) * (by1 - ay1) - (ay2 - ay1) * (bx1 - ax1);
  var v4 = (ax2 - ax1) * (by2 - ay1) - (ay2 - ay1) * (bx2 - ax1);

  if (v1 * v2 < 0 && v3 * v4 < 0) return true;
}

function getNecessaryBoxes(intersectBoxes, subBoxes) {
  var necessaryBoxes = [];

  _underscore2['default'].each(intersectBoxes, function (oneLineIntersectBoxes, i) {
    var subLine = subBoxes[i];

    _underscore2['default'].each(oneLineIntersectBoxes, function (oneIntersectBox) {
      necessaryBoxes.push(oneIntersectBox);
      var index = [i, subLine.indexOf(oneIntersectBox)]; // [1,0] строка и колонка в матрице
      pushSiblingsByIndex(subBoxes, index, necessaryBoxes);
    });
  });

  return _underscore2['default'].uniq(necessaryBoxes);
}

function pushSiblingsByIndex(subBoxes, index, necessaryBoxes) {
  var siblings = [];

  siblings.nbox = getOneByIndex(subBoxes, [index[0] + 1, index[1]]);
  siblings.nebox = getOneByIndex(subBoxes, [index[0] + 1, index[1] + 1]);
  siblings.ebox = getOneByIndex(subBoxes, [index[0], index[1] + 1]);
  siblings.sebox = getOneByIndex(subBoxes, [index[0] - 1, index[1] + 1]);
  siblings.sbox = getOneByIndex(subBoxes, [index[0] - 1, index[1]]);
  siblings.swbox = getOneByIndex(subBoxes, [index[0] - 1, index[1] - 1]);
  siblings.wbox = getOneByIndex(subBoxes, [index[0], index[1] - 1]);
  siblings.nwbox = getOneByIndex(subBoxes, [index[0] + 1, index[1] - 1]);

  _underscore2['default'].each(Object.keys(siblings), function (key) {
    if (siblings[key]) necessaryBoxes.push(siblings[key]);
  });
}

function getOneByIndex(subBoxes, index) {
  var line = subBoxes[index[0]];
  if (!line) return false;
  var box = line[index[1]];
  if (!box) return false;
  return box;
}

function mergeBoxes(necessaryBoxes) {
  return verticalMergeBoxes(necessaryBoxes);
}

function verticalMergeBoxes(boxes) {
  var groupBoxes = {};

  _underscore2['default'].each(boxes, function (box) {
    var swLng = box[0][1];
    if (!groupBoxes[swLng]) groupBoxes[swLng] = [];
    groupBoxes[swLng].push(box);
  });

  var mergedBoxes = [];

  _underscore2['default'].each(groupBoxes, function (oneGroup, key) {
    var sortedOneGroup = sortBySwLon(oneGroup);
    var mergedOneGroup = mergeOneVerticalLine(sortedOneGroup);

    _underscore2['default'].each(mergedOneGroup, function (box) {
      return mergedBoxes.push(box);
    });
  });

  return mergedBoxes;
}

function mergeOneVerticalLine(oneGroup) {
  var subLineList = [],
      subLine = [];

  _underscore2['default'].each(oneGroup, function (box) {
    if (!subLine.length) {
      subLine.push(box);
    } else if (isVerticalSibling(_underscore2['default'].last(subLine), box)) {
      subLine.push(box);
    } else {
      subLineList.push(subLine);
      subLine = [];
      subLine.push(box);
    }
  });

  subLineList.push(subLine);

  return _underscore2['default'].map(subLineList, function (subLine) {
    return _merge(subLine);
  });
}

function isVerticalSibling(box1, box2) {
  var box1NwLat = box1[1][0];
  var box2SwLat = box2[0][0];
  var diff = Math.abs(box1NwLat - box2SwLat);
  if (diff < 0.001) return true;
}

function sortBySwLon(boxes) {
  return _underscore2['default'].sortBy(boxes, function (box) {
    return box[0][0];
  });
}

function _merge(oneGroup) {
  var lats = [],
      lons = [];

  _underscore2['default'].each(oneGroup, function (box) {
    lats.push(box[0][0], box[1][0]);
    lons.push(box[0][1], box[1][1]);
  });

  var maxLat = Math.max.apply(Math, lats);
  var maxLon = Math.max.apply(Math, lons);

  var minLat = Math.min.apply(Math, lats);
  var minLon = Math.min.apply(Math, lons);

  return [[minLat, minLon], // sw
  [maxLat, maxLon] // ne
  ];
}

function reverseList(coordinates) {
  return _underscore2['default'].map(coordinates, function (coords) {
    return [coords[1], coords[0]];
  });
}

function cosd(degree) {
  return Math.cos(toRadian(degree));
}

function toRadian(num) {
  return num * Math.PI / 180;
}

exports['default'] = getBoxes;
module.exports = exports['default'];