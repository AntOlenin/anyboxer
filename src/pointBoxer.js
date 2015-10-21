import _ from 'underscore';

const R = 6378;
const EQUATOR_DEGREE_KM = (2 * Math.PI * R) / 360;


/**
 * Возвращает уникальные и объединенные боксы для point.
 * */
function getBoxes(point, options) {
  let coordinates = point.coordinates;
  const fat = options.fat;

  if (options.reverse) {
    coordinates = reverse(coordinates);
  }

  const pointBox = getPointBox(coordinates, fat);
  return [pointBox];
}

function getPointBox(coordinates, fat) {
  const cosCurrentLat = cosd(coordinates[0]);
  const currentLatDegreeKm = cosCurrentLat * EQUATOR_DEGREE_KM;

  const fatHeightDegree = fat / EQUATOR_DEGREE_KM;
  const fatWidthDegree  = fat / currentLatDegreeKm;

  const sw = [coordinates[0]-fatHeightDegree, coordinates[1]-fatWidthDegree];
  const ne = [coordinates[0]+fatHeightDegree, coordinates[1]+fatWidthDegree];

  return [sw, ne];
}

function reverse(coordinates) {
  return [coordinates[1], coordinates[0]];
}

function cosd(degree) {
  return Math.cos( toRadian(degree) );
}

function toRadian(num) {
  return num * Math.PI / 180;
}

export default getBoxes;