import _ from 'underscore';
import lineStringBoxer from './lineStringBoxer';
import multiLineStringBoxer from './multiLineStringBoxer';
import pointBoxer from './pointBoxer';
import multiPointBoxer from './multiPointBoxer';


function anyBoxer(data, options) {
  const {features} = data;
  const {reverse} = options;

  const parsedByType = _.groupBy(data.features, (num) => num.geometry.type);

  const lineStringsBoxes = getOneTypeBoxes(lineStringBoxer, parsedByType.LineString);
  const multiLineStringsBoxes = getOneTypeBoxes(multiLineStringBoxer, parsedByType.MultiLineString);
  const pointsBoxes = getOneTypeBoxes(pointBoxer, parsedByType.Point);
  const multiPointsBoxes = getOneTypeBoxes(multiPointBoxer, parsedByType.MultiPoint);

  const boxes = _.flatten([lineStringsBoxes, multiLineStringsBoxes, pointsBoxes, multiPointsBoxes], true);
  return _.flatten(boxes, true);
}

function getOneTypeBoxes(boxer, features) {
  return _.map(features, (feature) => {
    const one = buildGeoJsonType(feature);
    const options = {fat: feature.properties.fat, reverse: true};
    return boxer(one, options);
  });
}

function buildGeoJsonType(feature) {
  return {
    "type": feature.geometry.type,
    "coordinates": feature.geometry.coordinates
  };
}

function validateData(data) {
  const note = 'data type must be a FeatureCollection http://geojson.org/geojson-spec.html#examples';

  if (!_.isObject(data)) {
    throw(note);
  }

  if (data['type'] != "FeatureCollection") {
    console.warn(note);
  }
}


export default anyBoxer;