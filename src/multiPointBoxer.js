import _ from 'underscore';
import pointBoxer from './pointBoxer';


/**
 * Возвращает уникальные и объединенные боксы для multiPoint.
 * */
function getBoxes(multiPoint, options) {
  const coordinatesList = multiPoint.coordinates;

  const pointsBoxes = _.map(coordinatesList, (coordinates) => {
    const point = buildPoint(coordinates);
    return pointBoxer(point, options);
  });

  return _.flatten(pointsBoxes, true);
}

function buildPoint(coordinates) {
  return {
    "type": "Point",
    "coordinates": coordinates
  };
}

export default getBoxes;