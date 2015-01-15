var _ = require('underscore');

function LineStringBoxer() {
    this.R = 6378;
    this.EQUATOR_DEGREE_KM = (2 * Math.PI * this.R) / 360;  // ~111км
}

/**
 * Возвращает уникальные и объединенные боксы для lineString.
 * */
LineStringBoxer.prototype.getBoxes = function(lineString, fat) {
    var mainBox = this.getMainBox(lineString);
    this.extendByFat(mainBox, fat);
    var subBoxes = this.getSubBoxes(mainBox, fat);
    var intersectBoxes = this.filterIntersectBoxes(subBoxes, lineString);
    var necessaryBoxes = this.getNecessaryBoxes(intersectBoxes, subBoxes);
    var mergedBoxes = this.mergeBoxes(necessaryBoxes);
    return mergedBoxes;
};

/**
 * Возвращает mainBox - box, построенный по lineString
 * */
LineStringBoxer.prototype.getMainBox = function(lineString) {
    var lats = _.map(lineString, function(item) {return item[0]});
    var lons = _.map(lineString, function(item) {return item[1]});

    var sw = [_.min(lats), _.min(lons)];
    var ne = [_.max(lats), _.max(lons)];

    return [sw, ne];
};

/**
 * Расширяет существующий бокс на значение fat.
 * */
LineStringBoxer.prototype.extendByFat = function(box, fat) {
    var sw = box[0];
    var ne = box[1];
    var cosCurrentLat = this.cos(sw[0]);
    var currentLatDegreeKm = cosCurrentLat * this.EQUATOR_DEGREE_KM;

    var fatHeightDegree = fat / this.EQUATOR_DEGREE_KM;
    var fatWidthDegree  = fat / currentLatDegreeKm;

    sw = [sw[0]-fatHeightDegree, sw[1]-fatWidthDegree];
    ne = [ne[0]+fatHeightDegree, ne[1]+fatWidthDegree];

    box[0] = sw;
    box[1] = ne;
};

/**
 * Возвращает массив мелких боксов, выстроившихся внутри mainBox.
 * */
LineStringBoxer.prototype.getSubBoxes = function(box, fat) {
    var sw = box[0];
    var ne = box[1];
    var boxWidth = ne[1] - sw[1];
    var boxHeight = ne[0] - sw[0];

    var cosCurrentLat = this.cos(sw[0]);
    var currentLatDegreeKm = cosCurrentLat * this.EQUATOR_DEGREE_KM;

    var boxWidthKm = boxWidth * currentLatDegreeKm;
    var boxHeightKm = boxHeight * this.EQUATOR_DEGREE_KM;

    var colAmount = Math.floor(boxWidthKm / fat) + 1;
    var rowAmount = Math.floor(boxHeightKm / fat) + 1;

    var subBoxHeight = fat / this.EQUATOR_DEGREE_KM;
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
};

/**
 * Отфильтровывает только те боксы, которые пересекают lineString.
 * Возвращает уже отфильтрованый массив боксов.
 * */
LineStringBoxer.prototype.filterIntersectBoxes = function(boxes, lineString) {
    var intersectBoxes = [];

    boxes.forEach(function(oneLineSubBoxes) {
        var oneLineIntersectBoxes = [];
        oneLineSubBoxes.forEach(function(box) {
            if (LineStringBoxer.prototype.isIntersectOneBox(box, lineString)) {
                oneLineIntersectBoxes.push(box);
            }
        });
        intersectBoxes.push(oneLineIntersectBoxes)
    });

    return intersectBoxes;
};

LineStringBoxer.prototype.isIntersectOneBox = function(box, lineString) {
    var boxSides = [];
    var lineStringSides = [];

    var boxVertexesList = [
        box[0], [ box[0][0], box[1][1] ], box[1], [ box[1][0], box[0][1] ]
    ];

    for (var i=0; i<boxVertexesList.length; i++) {
        var side = [boxVertexesList[i], boxVertexesList[i+1] || boxVertexesList[0]];
        boxSides.push(side);
    }

    for (var i=0; i<lineString.length - 1; i++) {
        var side = [lineString[i], lineString[i+1]];
        lineStringSides.push(side);
    }

    for (var j=0; j<lineStringSides.length; j++) {
        for (var k=0; k<boxSides.length; k++) {
            if (this.isIntersectOneSide(boxSides[k], lineStringSides[j])) {
                return true;
            }
        }
    }
};

LineStringBoxer.prototype.isIntersectOneSide = function(boxSide, lineStringSide) {
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
};

LineStringBoxer.prototype.getNecessaryBoxes = function(intersectBoxes, subBoxes) {
    var necessaryBoxes = [];

    for (var i=0; i<intersectBoxes.length; i++) {
        var oneLineIntersectBoxes = intersectBoxes[i];

        var line = subBoxes[i];

        for (var k=0; k<oneLineIntersectBoxes.length; k++) {
            var oneIntersectBox = oneLineIntersectBoxes[k];
            var index = [i, line.indexOf(oneIntersectBox)]; // [1,0] строка и колонка в матрице

            necessaryBoxes.push(oneIntersectBox);
            this.pushSiblingsByIndex(subBoxes, index, necessaryBoxes);
        }
    }

    return _.uniq(necessaryBoxes);
};

LineStringBoxer.prototype.pushSiblingsByIndex = function(subBoxes, index, necessaryBoxes) {
    var nbox = this.getOneByIndex(subBoxes, [index[0]+1, index[1]]);
    var nebox = this.getOneByIndex(subBoxes, [index[0]+1, index[1]+1]);
    var ebox = this.getOneByIndex(subBoxes, [index[0], index[1]+1]);
    var sebox = this.getOneByIndex(subBoxes, [index[0]-1, index[1]+1]);
    var sbox = this.getOneByIndex(subBoxes, [index[0]-1, index[1]]);
    var swbox = this.getOneByIndex(subBoxes, [index[0]-1, index[1]-1]);
    var wbox = this.getOneByIndex(subBoxes, [index[0], index[1]-1]);
    var nwbox = this.getOneByIndex(subBoxes, [index[0]+1, index[1]-1]);

    if (nbox) necessaryBoxes.push(nbox);
    if (nebox) necessaryBoxes.push(nebox);
    if (ebox) necessaryBoxes.push(ebox);
    if (sebox) necessaryBoxes.push(sebox);
    if (sbox) necessaryBoxes.push(sbox);
    if (swbox) necessaryBoxes.push(swbox);
    if (wbox) necessaryBoxes.push(wbox);
    if (nwbox) necessaryBoxes.push(nwbox);
};

LineStringBoxer.prototype.getOneByIndex = function(subBoxes, index) {
    var line = subBoxes[index[0]];
    if (!line) return false;
    var box = line[index[1]];
    if (!box) return false;
    return box;
};

LineStringBoxer.prototype.mergeBoxes = function(necessaryBoxes) {
    var verticalMergedBoxes = this.verticalMergeBoxes(necessaryBoxes);
    return verticalMergedBoxes;
};

LineStringBoxer.prototype.verticalMergeBoxes = function(boxes) {
    var groupBoxes = {};

    boxes.forEach(function(box) {
        var swLng = box[0][1];

        if (!groupBoxes[swLng]) groupBoxes[swLng] = [];
        groupBoxes[swLng].push(box);
    });

    var keys = Object.keys(groupBoxes);
    var mergedBoxes = [];

    keys.forEach(function(key) {
        var oneGroup = LineStringBoxer.prototype.sortBySwLon(groupBoxes[key]);
        var mergedOneGroup = LineStringBoxer.prototype.mergeOneVerticalLine(oneGroup);

        mergedOneGroup.forEach(function(box) {
            mergedBoxes.push(box);
        });
    });

    return mergedBoxes;
};

/**
 * Объединяет непрерывные боксы лежащие по оси Y (lon).
 * Принимает массив боксов, возвращает массив объединенных боксов.
 * */
LineStringBoxer.prototype.mergeOneVerticalLine = function(oneGroup) {
    var subLineList = [];
    var subLine = [];

    // Создает подстрочки из соседних (непрерывных) боксов. После forEach
    // subLineList имеет вид: [ [box, box, box], [subLine], [subLine] ].
    oneGroup.forEach(function(box) {
        var isSibling = LineStringBoxer.prototype.isVerticalSibling;

        if (!subLine.length) {
            subLine.push(box);
        }

        else if ( isSibling(_.last(subLine), box) ) {
            subLine.push(box);

        } else {
            subLineList.push(subLine);
            subLine = [];
            subLine.push(box);
        }
    });
    subLineList.push(subLine);

    return _.map(subLineList, function(subLine) {
        return LineStringBoxer.prototype._merge(subLine);
    });
};

LineStringBoxer.prototype.isVerticalSibling = function(box1, box2) {
    var box1NwLat = box1[1][0];
    var box2SwLat = box2[0][0];
    var diff = Math.abs(box1NwLat - box2SwLat);
    if (diff < 0.001) return true;
};

LineStringBoxer.prototype.sortBySwLon = function(boxes) {
    var sorted = _.sortBy(boxes, function(box) {
        return box[0][0];
    });
    return sorted;
};

LineStringBoxer.prototype._merge = function(oneGroup) {
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

LineStringBoxer.prototype.cos = function(degree) {
    return Math.cos( degree.toRadian() );
};

Number.prototype.toRadian = function () {
    return this * Math.PI / 180;
};


module.exports = LineStringBoxer;