import _ from 'underscore';
import lineStringBoxer from './lineStringBoxer';


/**
 * Возвращает уникальные и объединенные боксы для multiLineString.
 * */
function getBoxes(multiLineString, options) {
  const coordinatesList = multiLineString.coordinates;

  const lineStrinsBoxes = _.map(coordinatesList, (coordinates) => {
    const lineString = buildLineString(coordinates);
    return lineStringBoxer(lineString, options);
  });

  return _.flatten(lineStrinsBoxes, true);
}

function buildLineString(coordinates) {
  return {
    "type": "LineString",
    "coordinates": coordinates
  };
}

export default getBoxes;