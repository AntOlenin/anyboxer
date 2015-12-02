import _ from 'underscore';
import utils from './utils';

const R = 6378;
const EQUATOR_DEGREE_KM = (2 * Math.PI * R) / 360;


/**
 * Возвращает уникальные и объединенные боксы для lineString.
 *
 * 1. Расчитывает mainBox из Юго-Западной и Северо-Восточной точек трека с учетом fat.
 * 2. Расчитывает subBoxes - разбивает mainBox на множество subBoxes с шириной fat.
 * 3. Записывает в специальную матрицу индексы пересекающихся с треком subBoxes.
 * 5. Добавляет соседние индексы соседних с пересекающимися subBoxes.
 * 4. Фильтрует subBoxes, оставляет только те, чьи индексы есть в матрице.
 * 6. Объединяет боксы, чтобы вернуть их как можно меньше.
 *
 * */
function getBoxes(lineString, options) {
  let {coordinates} = lineString;
  const {fat, reverse} = options;

  if (reverse) coordinates = utils.reverseList(coordinates);

  const mainBox = utils.getBoundsByLatLngs(coordinates, fat);
  const subBoxes = getSubBoxes(mainBox, fat);
  const intersectIndexes = getIntersectIndexes(subBoxes, coordinates);
  const necessaryIndexes = getNecesseryIndexes(intersectIndexes); // with siblings
  const allBoxes =  getBoxesByMatrix(subBoxes, necessaryIndexes);
  const mergedBoxes = getMergedBoxes(allBoxes, necessaryIndexes);
  return _.flatten(mergedBoxes, true);
}

function getSubBoxes(box, fat) {
  const [sw, ne] = box;
  const boxWidth = ne[1] - sw[1];
  const boxHeight = ne[0] - sw[0];
  const cosCurrentLat = utils.cosd(sw[0]);
  const currentLatDegreeKm = cosCurrentLat * EQUATOR_DEGREE_KM;
  const boxWidthKm = boxWidth * currentLatDegreeKm;
  const boxHeightKm = boxHeight * EQUATOR_DEGREE_KM;
  const colAmount = Math.floor(boxWidthKm / fat) + 1;
  const rowAmount = Math.floor(boxHeightKm / fat) + 1;

  const subBoxHeight = fat / EQUATOR_DEGREE_KM;
  const subBoxWidth  = fat / currentLatDegreeKm;

  return _.map(_.range(colAmount), (colIndex) => {
    return _.map(_.range(rowAmount), (rowIndex) => {
      const [swLat, swLon] = sw;
      const verticalOffset = subBoxHeight * rowIndex;
      const horisontalOffset = subBoxWidth * colIndex;

      const subSwLat = swLat + verticalOffset;
      const subSwLon = swLon + horisontalOffset;
      const subNeLat = swLat + verticalOffset + subBoxHeight;
      const subNeLon = swLon + horisontalOffset + subBoxWidth;

      const subSw = [subSwLat, subSwLon];
      const subNe = [subNeLat, subNeLon];

      return [subSw, subNe];
    });
  });
}

function getIntersectIndexes(subBoxes, latlngs) {
  const matrix = utils.clearMatrix(subBoxes);
  const splittedLatLngs = utils.splitLatLngs(latlngs, 50);

  _.each(splittedLatLngs, (chunkLatLngs) => {
    const chunkBounds = utils.getBoundsByLatLngs(chunkLatLngs);
    const chunkSegments = utils.getPolylineSegments(chunkLatLngs);

    _.each(subBoxes, (oneColSubBoxes, colIndex) => {
      _.each(oneColSubBoxes, (box, rowIndex) => {
        if (isIntersectOneBox(box, chunkSegments, chunkBounds)) matrix[colIndex][rowIndex] = 1;
      });
    });

  });

  return matrix;
}

function getNecesseryIndexes(matrix) {
  const clonedMatrix = utils.cloneDeep(matrix);

  _.each(matrix, (arr, colIndex) => {
    _.each(arr, (item, rowIndex) => {
      if (item) {
        addOneSiblingGroup(clonedMatrix, [colIndex, rowIndex]);
      }
    });
  });

  return clonedMatrix;
}

function getMergedBoxes(boxes, matrix) {
  const merged = [];
  const allMergedLengths = getAllMergedLengths(matrix)

  for (let i=0; i<boxes.length; i++) {
    const oneColMerged = [];
    const oneColBoxes = _.clone(boxes[i]);
    const oneColLengths = allMergedLengths[i];

    _.each(oneColLengths, (length) => {
      const group = oneColBoxes.splice(0, length);
      const mergedGroup = [ _.first(group)[0], _.last(group)[1] ];
      oneColMerged.push(mergedGroup);
    });

    merged.push(oneColMerged);
  }

  return merged;
}

function getAllMergedLengths(matrix) {
  const allMergedLengths = [];

  _.each(matrix, (col) => {
    const сolMergedLengths = [];
    let tempLength = 0;

    _.each(col, (one) => {
      if (one) {
        tempLength ++
      } else {
        if (tempLength) {
          сolMergedLengths.push(tempLength);
          tempLength = 0;
        }
      }
    });

    if (tempLength) сolMergedLengths.push(tempLength);
    allMergedLengths.push(сolMergedLengths);

  });

  return allMergedLengths;
}

function addOneSiblingGroup(matrix, [colIndex, rowIndex]) {
  addSibling(matrix, [colIndex+1, rowIndex+1]);
  addSibling(matrix, [colIndex-1, rowIndex-1]);
  addSibling(matrix, [colIndex-1, rowIndex+1]);
  addSibling(matrix, [colIndex+1, rowIndex-1]);
  addSibling(matrix, [colIndex, rowIndex+1]);
  addSibling(matrix, [colIndex, rowIndex-1]);
  addSibling(matrix, [colIndex+1, rowIndex]);
  addSibling(matrix, [colIndex-1, rowIndex]);
}

function addSibling(matrix, [colIndex, rowIndex]) {
  const col = matrix[colIndex];
  if (_.isUndefined(col)) return;
  if (!_.isUndefined(col[rowIndex])) {
    col[rowIndex] = 1;
  }
}

function getBoxesByMatrix(subBoxes, matrix) {
  return _.map(subBoxes, (col, colIndex) => {
    return _.filter(col, (item, rowIndex) => matrix[colIndex][rowIndex]);
  });
}

function isIntersectOneBox(box, chunckSegments, bounds) {
  const [sw, ne] = box;
  const nw = [sw[0], ne[1]];
  const se = [ne[0], sw[1]];
  const boxVertexesList = [sw, nw, ne, se, sw];

  if (!_isBoxInBounce(box, bounds)) return false;

  const boxSegments = utils.getPolylineSegments(boxVertexesList);
  return utils.isIntersectSegments(boxSegments, chunckSegments);
}

function _isBoxInBounce(box, bounds) {
  const [sw, ne] = box;
  const nw = [sw[0], ne[1]];
  const se = [ne[0], sw[1]];

  const [sw2, ne2] = bounds;
  const nw2 = [sw2[0], ne2[1]];
  const se2 = [ne2[0], sw2[1]];

  const boxVertexesList = [sw, nw, ne, se, sw];
  const boundsVertexesList = [sw2, nw2, ne2, se2, sw2];

  const fn = utils.isPointInBounds;
  const cond1 = (
    fn(bounds, sw) || fn(bounds, ne) || fn(bounds, nw) || fn(bounds, se) ||
    fn(box, sw2) || fn(box, ne2) || fn(box, nw2) || fn(box, se2)
  );

  return cond1 || utils.isTwoPolylineIntersect(boxVertexesList, boundsVertexesList);
}

export default getBoxes;