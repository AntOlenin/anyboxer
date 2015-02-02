var _ = require('underscore');

var R = 6378;
var EQUATOR_DEGREE_KM = (2 * Math.PI * R) / 360;


/**
 * Возвращает уникальные и объединенные боксы для lineString.
 * */
function getBoxes(lineString, fat) {
    var coordinates = lineString.coordinates;

    var mainBox = getMainBox(coordinates);
    extendByFat(mainBox, fat);
    var subBoxes = getSubBoxes(mainBox, fat);
    var intersectBoxes = filterIntersectBoxes(subBoxes, coordinates);
    var necessaryBoxes = getNecessaryBoxes(intersectBoxes, subBoxes);
    return mergeBoxes(necessaryBoxes);
}

function getMainBox(coordinates) {
    var lats = _.map(coordinates, function(item) {return item[0]});
    var lons = _.map(coordinates, function(item) {return item[1]});

    var sw = [_.min(lats), _.min(lons)];
    var ne = [_.max(lats), _.max(lons)];

    return [sw, ne];
}

function extendByFat(box, fat) {
    var sw = box[0];
    var ne = box[1];
    var cosCurrentLat = cosd(sw[0]);
    var currentLatDegreeKm = cosCurrentLat * EQUATOR_DEGREE_KM;

    var fatHeightDegree = fat / EQUATOR_DEGREE_KM;
    var fatWidthDegree  = fat / currentLatDegreeKm;

    sw = [sw[0]-fatHeightDegree, sw[1]-fatWidthDegree];
    ne = [ne[0]+fatHeightDegree, ne[1]+fatWidthDegree];

    box[0] = sw;
    box[1] = ne;
}

function getSubBoxes(box, fat) {
    var sw = box[0];
    var ne = box[1];
    var boxWidth = ne[1] - sw[1];
    var boxHeight = ne[0] - sw[0];

    var cosCurrentLat = cosd(sw[0]);
    var currentLatDegreeKm = cosCurrentLat * EQUATOR_DEGREE_KM;

    var boxWidthKm = boxWidth * currentLatDegreeKm;
    var boxHeightKm = boxHeight * EQUATOR_DEGREE_KM;

    var colAmount = Math.floor(boxWidthKm / fat) + 1;
    var rowAmount = Math.floor(boxHeightKm / fat) + 1;

    var subBoxHeight = fat / EQUATOR_DEGREE_KM;
    var subBoxWidth  = fat / currentLatDegreeKm;

    return _.map(_.range(colAmount), function(colIndex) {
        return _.map(_.range(rowAmount), function(rowIndex) {
            var swLat = sw[0];
            var swLon = sw[1];

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
    var intersectBoxes = [];

    boxes.forEach(function(oneLineSubBoxes) {
        var oneLineIntersectBoxes = [];
        oneLineSubBoxes.forEach(function(box) {
            if (isIntersectOneBox(box, coordinates)) {
                oneLineIntersectBoxes.push(box);
            }
        });
        intersectBoxes.push(oneLineIntersectBoxes)
    });

    return intersectBoxes;
};

function isIntersectOneBox(box, coordinates) {
    var boxSides = [];
    var lineStringSides = [];

    var sw = box[0];
    var ne = box[1];
    var nw = [sw[0], ne[1]];
    var se = [ne[0], sw[1]];

    var boxVertexesList = [sw, nw, ne, se];

    for (var i=0; i<boxVertexesList.length; i++) {
        var side = [boxVertexesList[i], boxVertexesList[i+1] || boxVertexesList[0]];
        boxSides.push(side);
    }

    for (var i=0; i<coordinates.length - 1; i++) {
        var side = [coordinates[i], coordinates[i+1]];
        lineStringSides.push(side);
    }

    for (var j=0; j<lineStringSides.length; j++) {
        for (var k=0; k<boxSides.length; k++) {
            if (isIntersectOneSide(boxSides[k], lineStringSides[j])) {
                return true;
            }
        }
    }
};

function isIntersectOneSide(boxSide, lineStringSide) {
    var ax1 = boxSide[0][0];
    var ay1 = boxSide[0][1];
    var ax2 = boxSide[1][0];
    var ay2 = boxSide[1][1];

    var bx1 = lineStringSide[0][0];
    var by1 = lineStringSide[0][1];
    var bx2 = lineStringSide[1][0];
    var by2 = lineStringSide[1][1];

    var v1 = (bx2-bx1)*(ay1-by1)-(by2-by1)*(ax1-bx1);
    var v2 = (bx2-bx1)*(ay2-by1)-(by2-by1)*(ax2-bx1);
    var v3 = (ax2-ax1)*(by1-ay1)-(ay2-ay1)*(bx1-ax1);
    var v4 = (ax2-ax1)*(by2-ay1)-(ay2-ay1)*(bx2-ax1);

    if ((v1*v2<0) && (v3*v4<0)) return true;
}

function getNecessaryBoxes(intersectBoxes, subBoxes) {
    var necessaryBoxes = [];

    for (var i=0; i<intersectBoxes.length; i++) {
        var oneLineIntersectBoxes = intersectBoxes[i];

        var line = subBoxes[i];

        for (var k=0; k<oneLineIntersectBoxes.length; k++) {
            var oneIntersectBox = oneLineIntersectBoxes[k];
            var index = [i, line.indexOf(oneIntersectBox)]; // [1,0] строка и колонка в матрице

            necessaryBoxes.push(oneIntersectBox);
            pushSiblingsByIndex(subBoxes, index, necessaryBoxes);
        }
    }

    return _.uniq(necessaryBoxes);
};

function pushSiblingsByIndex(subBoxes, index, necessaryBoxes) {
    var nbox = getOneByIndex(subBoxes, [index[0]+1, index[1]]);
    var nebox = getOneByIndex(subBoxes, [index[0]+1, index[1]+1]);
    var ebox = getOneByIndex(subBoxes, [index[0], index[1]+1]);
    var sebox = getOneByIndex(subBoxes, [index[0]-1, index[1]+1]);
    var sbox = getOneByIndex(subBoxes, [index[0]-1, index[1]]);
    var swbox = getOneByIndex(subBoxes, [index[0]-1, index[1]-1]);
    var wbox = getOneByIndex(subBoxes, [index[0], index[1]-1]);
    var nwbox = getOneByIndex(subBoxes, [index[0]+1, index[1]-1]);

    if (nbox) necessaryBoxes.push(nbox);
    if (nebox) necessaryBoxes.push(nebox);
    if (ebox) necessaryBoxes.push(ebox);
    if (sebox) necessaryBoxes.push(sebox);
    if (sbox) necessaryBoxes.push(sbox);
    if (swbox) necessaryBoxes.push(swbox);
    if (wbox) necessaryBoxes.push(wbox);
    if (nwbox) necessaryBoxes.push(nwbox);
};

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

    boxes.forEach(function(box) {
        var swLng = box[0][1];

        if (!groupBoxes[swLng]) groupBoxes[swLng] = [];
        groupBoxes[swLng].push(box);
    });

    var keys = Object.keys(groupBoxes);
    var mergedBoxes = [];

    keys.forEach(function(key) {
        var oneGroup = sortBySwLon(groupBoxes[key]);
        var mergedOneGroup = mergeOneVerticalLine(oneGroup);

        mergedOneGroup.forEach(function(box) {
            mergedBoxes.push(box);
        });
    });

    return mergedBoxes;
}

function mergeOneVerticalLine(oneGroup) {
    var subLineList = [];
    var subLine = [];

    // Создает подстрочки из соседних (непрерывных) боксов. После forEach
    // subLineList имеет вид: [ [box, box, box], [subLine], [subLine] ].
    oneGroup.forEach(function(box) {
        if (!subLine.length) {
            subLine.push(box);
        }

        else if ( isVerticalSibling(_.last(subLine), box) ) {
            subLine.push(box);

        } else {
            subLineList.push(subLine);
            subLine = [];
            subLine.push(box);
        }
    });
    subLineList.push(subLine);

    return _.map(subLineList, function(subLine) {
        return _merge(subLine);
    });
}

isVerticalSibling = function(box1, box2) {
    var box1NwLat = box1[1][0];
    var box2SwLat = box2[0][0];
    var diff = Math.abs(box1NwLat - box2SwLat);
    if (diff < 0.001) return true;
};

sortBySwLon = function(boxes) {
    return _.sortBy(boxes, function(box) {
        return box[0][0];
    });
};

function _merge(oneGroup) {
    var lats = [];
    var lons = [];

    oneGroup.forEach(function(box) {
        lats.push( box[0][0], box[1][0] );
        lons.push( box[0][1], box[1][1] );
    });

    var maxLat = Math.max.apply(Math, lats);
    var maxLon = Math.max.apply(Math, lons);

    var minLat = Math.min.apply(Math, lats);
    var minLon = Math.min.apply(Math, lons);

    return [
        [minLat, minLon],  // sw
        [maxLat, maxLon]   // ne
    ];
};

function cosd(degree) {
    return Math.cos( toRadian(degree) );
}

function toRadian(num) {
    return num * Math.PI / 180;
}


module.exports = getBoxes;