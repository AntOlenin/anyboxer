import _ from 'underscore';

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
  const intersectBoxes = filterIntersectBoxes(subBoxes, coordinates);
  const necessaryBoxes = getNecessaryBoxes(intersectBoxes, subBoxes);

  return mergeBoxes(necessaryBoxes);
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

function filterIntersectBoxes(boxes, coordinates) {
  return _.map(boxes, (oneLineSubBoxes) => {
    return _.filter(oneLineSubBoxes, (box) => isIntersectOneBox(box, coordinates));
  });
}

function isIntersectOneBox(box, coordinates) {
  const [sw, ne] = box;
  const nw = [sw[0], ne[1]];
  const se = [ne[0], sw[1]];
  const boxVertexesList = [sw, nw, ne, se];
  const boxSides = [];
  const lineStringSides = [];

  _.each(boxVertexesList, (item, i) => {
    const side = [boxVertexesList[i], boxVertexesList[i+1] || boxVertexesList[0]];
    boxSides.push(side);
  });

  _.each(coordinates, (item, i) => {
    const side = [coordinates[i], coordinates[i+1]];
    if (_.compact(side).length === 2) lineStringSides.push(side);
  });

  for (var j=0; j<lineStringSides.length; j++) {
    for (var k=0; k<boxSides.length; k++) {
      if (isIntersectOneSide(boxSides[k], lineStringSides[j])) {
        return true;
      }
    }
  }
}

function isIntersectOneSide(boxSide, lineStringSide) {
  const ax1 = boxSide[0][0];
  const ay1 = boxSide[0][1];
  const ax2 = boxSide[1][0];
  const ay2 = boxSide[1][1];

  const bx1 = lineStringSide[0][0];
  const by1 = lineStringSide[0][1];
  const bx2 = lineStringSide[1][0];
  const by2 = lineStringSide[1][1];

  const v1 = (bx2-bx1)*(ay1-by1)-(by2-by1)*(ax1-bx1);
  const v2 = (bx2-bx1)*(ay2-by1)-(by2-by1)*(ax2-bx1);
  const v3 = (ax2-ax1)*(by1-ay1)-(ay2-ay1)*(bx1-ax1);
  const v4 = (ax2-ax1)*(by2-ay1)-(ay2-ay1)*(bx2-ax1);

  if ((v1*v2<0) && (v3*v4<0)) return true;
}

function getNecessaryBoxes(intersectBoxes, subBoxes) {
  const necessaryBoxes = [];

  _.each(intersectBoxes, (oneLineIntersectBoxes, i) => {
    const subLine = subBoxes[i];

    _.each(oneLineIntersectBoxes, (oneIntersectBox) => {
      necessaryBoxes.push(oneIntersectBox);
      const index = [i, subLine.indexOf(oneIntersectBox)]; // [1,0] строка и колонка в матрице
      pushSiblingsByIndex(subBoxes, index, necessaryBoxes);
    });

  });

  return _.uniq(necessaryBoxes);
}

function pushSiblingsByIndex(subBoxes, index, necessaryBoxes) {
  const siblings = [];

  siblings.nbox = getOneByIndex(subBoxes, [index[0]+1, index[1]]);
  siblings.nebox = getOneByIndex(subBoxes, [index[0]+1, index[1]+1]);
  siblings.ebox = getOneByIndex(subBoxes, [index[0], index[1]+1]);
  siblings.sebox = getOneByIndex(subBoxes, [index[0]-1, index[1]+1]);
  siblings.sbox = getOneByIndex(subBoxes, [index[0]-1, index[1]]);
  siblings.swbox = getOneByIndex(subBoxes, [index[0]-1, index[1]-1]);
  siblings.wbox = getOneByIndex(subBoxes, [index[0], index[1]-1]);
  siblings.nwbox = getOneByIndex(subBoxes, [index[0]+1, index[1]-1]);

  _.each(Object.keys(siblings), (key) => {
    if (siblings[key]) necessaryBoxes.push(siblings[key]);
  });
}

function getOneByIndex(subBoxes, index) {
  const line = subBoxes[index[0]];
  if (!line) return false;
  const box = line[index[1]];
  if (!box) return false;
  return box;
}

function mergeBoxes(necessaryBoxes) {
  return verticalMergeBoxes(necessaryBoxes);
}

function verticalMergeBoxes(boxes) {
  const groupBoxes = {};

  _.each(boxes, (box) => {
    const swLng = box[0][1];
    if (!groupBoxes[swLng]) groupBoxes[swLng] = [];
    groupBoxes[swLng].push(box);
  });

  const mergedBoxes = [];

  _.each(groupBoxes, (oneGroup, key) => {
    const sortedOneGroup = sortBySwLon(oneGroup);
    const mergedOneGroup = mergeOneVerticalLine(sortedOneGroup);

    _.each(mergedOneGroup, (box) => mergedBoxes.push(box));
  });

  return mergedBoxes;
}

function mergeOneVerticalLine(oneGroup) {
  let subLineList = [], subLine = [];

  _.each(oneGroup, (box) => {
    if (!subLine.length) {
      subLine.push(box);
    } else if ( isVerticalSibling(_.last(subLine), box) ) {
      subLine.push(box);
    } else {
      subLineList.push(subLine);
      subLine = [];
      subLine.push(box);
    }
  });

  subLineList.push(subLine);

  return _.map(subLineList, (subLine) => {
    return _merge(subLine);
  });
}

function isVerticalSibling(box1, box2) {
  const box1NwLat = box1[1][0];
  const box2SwLat = box2[0][0];
  const diff = Math.abs(box1NwLat - box2SwLat);
  if (diff < 0.001) return true;
}

function sortBySwLon(boxes) {
  return _.sortBy(boxes, (box) => box[0][0]);
}

function _merge(oneGroup) {
  const lats = [], lons = [];

  _.each(oneGroup, (box) => {
    lats.push( box[0][0], box[1][0] );
    lons.push( box[0][1], box[1][1] );
  });

  const maxLat = Math.max.apply(Math, lats);
  const maxLon = Math.max.apply(Math, lons);

  const minLat = Math.min.apply(Math, lats);
  const minLon = Math.min.apply(Math, lons);

  return [
    [minLat, minLon],  // sw
    [maxLat, maxLon]   // ne
  ];
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