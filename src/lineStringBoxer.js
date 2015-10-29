import _ from 'underscore';
import utils from './utils';

const R = 6378;
const EQUATOR_DEGREE_KM = (2 * Math.PI * R) / 360;


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
  let {coordinates} = lineString;
  const {fat, reverse} = options;

  if (reverse) coordinates = utils.reverseList(coordinates);

  const mainBox = utils.getBoundsByLatLngs(coordinates);
  extendByFat(mainBox, fat);
  const subBoxes = getSubBoxes(mainBox, fat);
  const intersectIndexes = getIntersectIndexes(subBoxes, coordinates);
  const necessaryIndexes = getNecesseryIndexes(intersectIndexes); // with siblings
  const allBoxes =  getBoxesByMatrix(subBoxes, necessaryIndexes);
  return _.flatten(allBoxes, true);
}

function extendByFat(box, fat) {
  let [sw, ne] = box;
  const cosCurrentLat = utils.cosd(sw[0]);
  const currentLatDegreeKm = cosCurrentLat * EQUATOR_DEGREE_KM;
  const fatHeightDegree = fat / EQUATOR_DEGREE_KM;
  const fatWidthDegree  = fat / currentLatDegreeKm;

  sw = [sw[0]-fatHeightDegree, sw[1]-fatWidthDegree];
  ne = [ne[0]+fatHeightDegree, ne[1]+fatWidthDegree];

  box[0] = sw; box[1] = ne;
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

    _.each(subBoxes, (oneColSubBoxes, colIndex) => {
      _.each(oneColSubBoxes, (box, rowIndex) => {
        if (isIntersectOneBox(box, chunkLatLngs, chunkBounds)) matrix[colIndex][rowIndex] = 1;
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

function isIntersectOneBox(box, coordinates, bounds) {
  const [sw, ne] = box;
  const nw = [sw[0], ne[1]];
  const se = [ne[0], sw[1]];
  const boxVertexesList = [sw, nw, ne, se, sw];

  if (_isBoxInBounce(box, bounds)) return utils.isTwoPolylineIntersect(boxVertexesList, coordinates);
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

  const fn = utils.isPointInBounds
  const cond1 = (fn(bounds, sw) || fn(bounds, ne) || fn(bounds, nw) || fn(bounds, se))

  return cond1 || utils.isTwoPolylineIntersect(boxVertexesList, boundsVertexesList)
}

export default getBoxes;