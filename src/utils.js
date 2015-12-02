import _ from 'underscore';

const R = 6378;
const EQUATOR_DEGREE_KM = (2 * Math.PI * R) / 360;


function getBoundsByLatLngs(latlngs, fat) {
  const lats = _.map(latlngs, (item) => item[0]); //use zip
  const lons = _.map(latlngs, (item) => item[1]);

  const sw = [_.min(lats), _.min(lons)];
  const ne = [_.max(lats), _.max(lons)];

  if (!fat) return [sw, ne];

  const cosCurrentLat = cosd(sw[0]);
  const currentLatDegreeKm = cosCurrentLat * EQUATOR_DEGREE_KM;
  const fatHeightDegree = fat / EQUATOR_DEGREE_KM;
  const fatWidthDegree  = fat / currentLatDegreeKm;

  const fatSw = [sw[0]-fatHeightDegree, sw[1]-fatWidthDegree];
  const fatNe = [ne[0]+fatHeightDegree, ne[1]+fatWidthDegree];

  return [fatSw, fatNe];
}

function isPointInBounds(bounds, latlng) {
  const [sw, ne] = bounds;
  const [lat, lng] = latlng;

  const a = lat >= sw[0] && lng >= sw[1];
  const b = lat <= ne[0] && lng <= ne[1];

  return a && b;
}

function isTwoLineIntersect(firstSegment, secondSegment) {
  const ax1 = firstSegment[0][0];
  const ay1 = firstSegment[0][1];
  const ax2 = firstSegment[1][0];
  const ay2 = firstSegment[1][1];

  const bx1 = secondSegment[0][0];
  const by1 = secondSegment[0][1];
  const bx2 = secondSegment[1][0];
  const by2 = secondSegment[1][1];

  const v1 = (bx2-bx1)*(ay1-by1)-(by2-by1)*(ax1-bx1);
  const v2 = (bx2-bx1)*(ay2-by1)-(by2-by1)*(ax2-bx1);
  const v3 = (ax2-ax1)*(by1-ay1)-(ay2-ay1)*(bx1-ax1);
  const v4 = (ax2-ax1)*(by2-ay1)-(ay2-ay1)*(bx2-ax1);

  if ((v1*v2<0) && (v3*v4<0)) return true;
}

function isTwoPolylineIntersect(poly1, poly2) {
  const segments1 = getPolylineSegments(poly1);
  const segments2 = getPolylineSegments(poly2);
  return isIntersectSegments(segments1, segments2);
}

function isIntersectSegments(boxSegments, polylineSegments) {
  for (var j=0; j<polylineSegments.length; j++) {
    for (var k=0; k<boxSegments.length; k++) {
      if (isTwoLineIntersect(boxSegments[k], polylineSegments[j])) {
        return true;
      }
    }
  }
}

function getPolylineSegments(polyline) {
  let lines = [];
  _.each(polyline, (item, i) => {
    let line = [polyline[i], polyline[i+1]];
    if (_.compact(line).length === 2) lines.push(line);
  });
  return lines;
}

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function clearMatrix(matrix) {
  const newMatrix = [];

  _.each(matrix, (col) => {
    const colMatrix = [];
    _.each(col, (row) => {
      colMatrix.push(0);
    });
    newMatrix.push(colMatrix);
  });

  return newMatrix;
}

function splitLatLngs(latlngs, maxLength=50) {
  const latlngsList = [];
  let chunk = []

  for (let i=0; i<latlngs.length; i++) {
    if (chunk.length >= maxLength) {
      let lastItem = _.last(chunk);
      latlngsList.push(chunk);
      chunk = [];
      chunk.push(lastItem);
    }
    chunk.push(latlngs[i]);
  }

  if (chunk.length >= 2) latlngsList.push(chunk);

  return latlngsList;
}

function reverseList(coordsList) {
  return _.map(coordsList, (coords) => reverse(coords));
}

function reverse(coords) {
  return [coords[1], coords[0]];
}

function cosd(degree) {
  return Math.cos( toRadian(degree) );
}

function toRadian(num) {
  return num * Math.PI / 180;
}

export default {
  cloneDeep, isIntersectSegments, clearMatrix, reverse, reverseList, isTwoPolylineIntersect,
  cosd, toRadian, splitLatLngs, getBoundsByLatLngs, isPointInBounds, getPolylineSegments
};