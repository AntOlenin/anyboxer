import _ from 'underscore';


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
  const cloned = cloneDeep(matrix);
  return _.map(cloned, (arr) => {
    return _.map(arr, (item) => {
      return 0;
    });
  });
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
  cosd, toRadian
};