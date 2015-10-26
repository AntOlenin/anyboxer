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

  if (reverse) coordinates = reverseList(coordinates);

  const mainBox = getMainBox(coordinates);
  extendByFat(mainBox, fat);
  const subBoxes = getSubBoxes(mainBox, fat);
  const intersectIndexes = getIntersectIndexes(subBoxes, coordinates);
  const necessaryIndexes = getNecesseryIndexes(intersectIndexes); // with siblings
  const allBoxes =  getBoxesByMatrix(subBoxes, necessaryIndexes);
  return _.flatten(allBoxes, true);
}

function getMainBox(coordinates) {
  const lats = _.map(coordinates, (item) => item[0]);
  const lons = _.map(coordinates, (item) => item[1]);

  const sw = [_.min(lats), _.min(lons)];
  const ne = [_.max(lats), _.max(lons)];

  return [sw, ne];
}

function extendByFat(box, fat) {
  let [sw, ne] = box;
  const cosCurrentLat = cosd(sw[0]);
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
  const cosCurrentLat = cosd(sw[0]);
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

  _.each(subBoxes, (oneColSubBoxes, colIndex) => {
    _.each(oneColSubBoxes, (box, rowIndex) => {
      if (isIntersectOneBox(box, latlngs)) matrix[colIndex][rowIndex] = 1;
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

function isIntersectOneBox(box, coordinates) {
  const [sw, ne] = box;
  const nw = [sw[0], ne[1]];
  const se = [ne[0], sw[1]];
  const boxVertexesList = [sw, nw, ne, se, sw];

  return utils.isTwoPolylineIntersect(boxVertexesList, coordinates);
}

function reverseList(coordinates) {
  return _.map(coordinates, (coords) => [coords[1], coords[0]]);
}

function cosd(degree) {
  return Math.cos( toRadian(degree) );
}

function toRadian(num) {
  return num * Math.PI / 180;
}


export default getBoxes;