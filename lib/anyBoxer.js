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
AnyBoxer.prototype.getBoxes = function(options) {
    var lineString = options.data.lineString;
    var fat = options.fat;

    var lineStringBoxes = lineStringBoxer.getBoxes(lineString, fat);
    var pointBoxes = null;
    var polygonBoxes = null;

    return lineStringBoxes; // пока возвращает только lineStringBoxes
};

module.exports = AnyBoxer;