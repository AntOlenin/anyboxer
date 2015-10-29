import _ from 'underscore';


function getBoundsByLatLngs(latlngs) {
  const lats = _.map(latlngs, (item) => item[0]); //use zip
  const lons = _.map(latlngs, (item) => item[1]);

  const sw = [_.min(lats), _.min(lons)];
  const ne = [_.max(lats), _.max(lons)];

  return [sw, ne];
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

function isTwoPolylineIntersect(firstPolyline, secondPolyline) {

  const fn = (polyline) => {
    let lines = [];
    _.each(polyline, (item, i) => {
      let line = [polyline[i], polyline[i+1]];
      if (_.compact(line).length === 2) lines.push(line);
    });
    return lines;
  }

  const firstLines = fn(firstPolyline);
  const secondLines = fn(secondPolyline);

  for (var j=0; j<secondLines.length; j++) {
    for (var k=0; k<firstLines.length; k++) {
      if (isTwoLineIntersect(firstLines[k], secondLines[j])) {
        return true;
      }
    }
  }
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
  cloneDeep, isTwoPolylineIntersect, clearMatrix, reverse, reverseList,
  cosd, toRadian, splitLatLngs, getBoundsByLatLngs, isPointInBounds
};