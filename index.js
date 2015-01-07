function AnyBoxer() {
    this.R = 6378;
    this.EQUATOR_DEGREE_KM = (2 * Math.PI * this.R) / 360;  // ~111км
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
AnyBoxer.prototype.getBoxes = function(options) {
    var lineString = options.data.lineString;
    var fat = options.fat;

    var lineStringBoxes = this.getlineStringBoxes(lineString, fat);
    var pointBoxes = null;
    var polygonBoxes = null;

    return lineStringBoxes; // пока возвращает только lineStringBoxes
};

/**
 * Возвращает уникальные и объединенные боксы для lineString.
 * */
AnyBoxer.prototype.getlineStringBoxes = function(lineString, fat) {
    var mainBox = this.getMainBox(lineString);
    var subBoxes = this.getSubBoxes(mainBox, fat);
    var intersectBoxes = this.filterIntersectBoxes(subBoxes, lineString);
    var necessaryBoxes = this.createSiblingLineStringBoxes(intersectBoxes, this.cos(mainBox[0][0]), fat);
    var mergedBoxes = this.mergeLineStringBoxes(necessaryBoxes);
    return mergedBoxes;
};

/**
 * Возвращает mainBox - box, построенный по lineString
 * */
AnyBoxer.prototype.getMainBox = function(lineString) {
    var lats = [];
    var lons = [];

    lineString.forEach(function(item) {
        lats.push( item[1] );
        lons.push( item[0] );
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

/**
 * Возвращает массив мелких боксов, выстроившихся внутри mainBox.
 * */
AnyBoxer.prototype.getSubBoxes = function(mainBox, fat) {
    var mainSw = mainBox[0];
    var mainNe = mainBox[1];
    var mainNw = [mainNe[0], mainSw[1]];
    var mainBoxWidth = mainNe[1] - mainNw[1];
    var mainBoxHeight = mainNw[0] - mainSw[0];
    var currentLat = mainNe[0];

    var mainBoxWidthKm = mainBoxWidth * (this.cos(currentLat) * this.EQUATOR_DEGREE_KM);
    var mainBoxHeightKm = mainBoxHeight * this.EQUATOR_DEGREE_KM;

    var columnAmount = Math.floor(mainBoxWidthKm / fat) + 1;
    var rowAmount = Math.floor(mainBoxHeightKm / fat) + 1;

    var subBoxHeight = (fat / this.EQUATOR_DEGREE_KM);
    var subBoxWidth  = ( fat / (this.EQUATOR_DEGREE_KM * this.cos(mainSw[0])) );
    var subBoxes = [];

    for (var j=0; j<columnAmount; j++) {
        for (var k=0; k<rowAmount; k++) {

            var mainSwLat = mainSw[0];
            var mainSwLon = mainSw[1];

            var horisontalOffset = subBoxHeight * k;
            var verticalOffset = subBoxWidth * j;

            var subSwLat = mainSwLat + horisontalOffset;
            var subSwLon = mainSwLon + verticalOffset;
            var subNeLat = mainSwLat + horisontalOffset + subBoxHeight;
            var subNeLon = mainSwLon + verticalOffset + subBoxWidth;

            var subSw = [subSwLat, subSwLon];
            var subNe = [subNeLat, subNeLon];
            var subBox = [subSw, subNe];

            subBoxes.push(subBox);
        }
    }

    return subBoxes;
};

/**
 * Отфильтровывает только те боксы, которые пересекают lineString.
 * Возвращает уже отфильтрованый массив боксов.
 * */
AnyBoxer.prototype.filterIntersectBoxes = function(boxes, lineString) {
    var intersectBoxes = [];

    boxes.forEach(function(box) {
        if (AnyBoxer.prototype.isIntersectOneBox(box, lineString)) {
            intersectBoxes.push(box);
        }
    });

    return intersectBoxes;
};

AnyBoxer.prototype.isIntersectOneBox = function(box, lineString) {

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

AnyBoxer.prototype.isIntersectOneSide = function(boxSide, lineStringSide) {
    var ax1 = boxSide[0][0];
    var ay1 = boxSide[0][1];
    var ax2 = boxSide[1][0];
    var ay2 = boxSide[1][1];

    var bx1 = lineStringSide[0][1];
    var by1 = lineStringSide[0][0];
    var bx2 = lineStringSide[1][1];
    var by2 = lineStringSide[1][0];

    var v1 = (bx2-bx1)*(ay1-by1)-(by2-by1)*(ax1-bx1);
    var v2 = (bx2-bx1)*(ay2-by1)-(by2-by1)*(ax2-bx1);
    var v3 = (ax2-ax1)*(by1-ay1)-(ay2-ay1)*(bx1-ax1);
    var v4 = (ax2-ax1)*(by2-ay1)-(ay2-ay1)*(bx2-ax1);

    if ((v1*v2<0) && (v3*v4<0)) return true;
};


/**
 * Когда мы из всех боксов извлекли только необходимые - нужно вокруг
 * каждого бокса добавить по одному дополнительному боксу, чтобы реальная
 * толщина захватываемой области удовлетворяла значению fat.
 *
 * Возвращает массив уникальных боксов.
 * */
AnyBoxer.prototype.createSiblingLineStringBoxes = function(boxes, cosMainSw, fat) {
    var oneHeight = (fat / this.EQUATOR_DEGREE_KM);
    var oneWidth = ( fat / (this.EQUATOR_DEGREE_KM * cosMainSw));

    boxes.forEach(function(box) {
        var swLat = box[0][0];
        var swLon = box[0][1];
        var neLat = box[1][0];
        var neLon = box[1][1];

        var nbox = [
            [swLat + oneHeight, swLon],
            [neLat + oneHeight, neLon]
        ];

        var nebox = [
            [swLat + oneHeight, swLon + oneWidth],
            [neLat + oneHeight, neLon + oneWidth]
        ];

        var ebox = [
            [swLat, swLon + oneWidth],
            [neLat, neLon + oneWidth]
        ];

        var sebox = [
            [swLat - oneHeight, swLon + oneWidth],
            [neLat - oneHeight, neLon + oneWidth]
        ];

        var sbox = [
            [swLat - oneHeight, swLon],
            [neLat - oneHeight, neLon]
        ];

        var swbox = [
            [swLat - oneHeight, swLon - oneWidth],
            [neLat - oneHeight, neLon - oneWidth]
        ];

        var wbox = [
            [swLat, swLon - oneWidth],
            [neLat, neLon - oneWidth]
        ];

        var nwbox = [
            [swLat + oneHeight, swLon - oneWidth],
            [neLat + oneHeight, neLon - oneWidth]
        ];

        boxes.push(nbox, nebox, ebox, sebox, sbox, swbox, wbox, nwbox);
    });

    return boxes;
};

AnyBoxer.prototype.mergeLineStringBoxes = function(boxes) {
    var groupBoxes = {};

    boxes.forEach(function(box) {
        var swLng = box[0][1];

        if (!groupBoxes[swLng]) groupBoxes[swLng] = [];
        groupBoxes[swLng].push(box);
    });

    var keys = Object.keys(groupBoxes);
    var mergedBoxes = [];

//    debugger

    keys.forEach(function(key) {
        var oneGroup = groupBoxes[key];
        var box = AnyBoxer.prototype.mergeOneGroup(oneGroup);
        mergedBoxes.push(box);
    });

    return mergedBoxes;
};

AnyBoxer.prototype.mergeOneGroup = function(oneGroup) {
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




AnyBoxer.prototype.cos = function(degree) {
    return Math.cos( degree.toRadian() );
};

Number.prototype.toRadian = function () {
    return this * Math.PI / 180;
};

Number.prototype.toDegree = function () {
    return this * 180 / Math.PI;
};

module.exports = AnyBoxer;