import _ from 'underscore';
import anyBoxer from './../../lib/anyBoxer';

const gMaps = google.maps;
const gPolyline = gMaps.Polyline;
const gEvent = gMaps.event;
const addListenerOnce = gEvent.addListenerOnce;
const gLatLng = gMaps.LatLng;
const gBounds = gMaps.LatLngBounds;
const gRectangle = gMaps.Rectangle;
const $newBtn = $('#new');
const $helpBar = $('#helpbar');
const $calcBtn = $('#calculate');
const $calcBtnClient = $('#calculate-client');
const $checAsyncBtn = $('#check-async');

const mapOptions = {
  center: new gMaps.LatLng(55.74, 37.61),
  zoom: 12,
  mapTypeId: gMaps.MapTypeId.ROADMAP
};

const map = new gMaps.Map(document.getElementById("map_canvas"), mapOptions);
const polyline = new gPolyline({map: map});
const polylineOptions = {first: null, last: null, path: null};

$newBtn.on('click', drawOn);


function drawOn() {
  if (polyline) {
    polyline.setPath([]);
    $calcBtn.hide();
  }

  addListenerOnce(map, 'click', firstClickHandle);
  map.setOptions({draggableCursor: 'crosshair'});
  $helpBar.text('Кликни по карте, чтобы поставить первую точку');
}

function firstClickHandle(position) {
  polylineOptions.first = position.latLng;
  addListenerOnce(map, 'click', lastClickHandle);
  $helpBar.text('Поставь вторую точку, чтобы маршрут создался');
}

function lastClickHandle(position) {
  polylineOptions.last = position.latLng;
  buildDirections();
  map.setOptions({draggableCursor: 'default'});
  $helpBar.text('Нажми new, чтобы начать заново');
}

function buildDirections() {
  var directionsService = new gMaps.DirectionsService(),
    request = {
      origin: polylineOptions.first,
      destination: polylineOptions.last,
      travelMode: gMaps.TravelMode.DRIVING
    };

  directionsService.route(request, buildDirectionsCallback);
}

function buildDirectionsCallback(response, status) {
  if (status == gMaps.DirectionsStatus.OK) {
    polylineOptions.path = response.routes[0].overview_path;
    polyline.setPath(polylineOptions.path);
    $calcBtn.show();
    $calcBtn.on('click', buildBoxes);
    $calcBtnClient.show();
    $calcBtnClient.on('click', buildBoxesClient);
    $checAsyncBtn.show();
    $checAsyncBtn.on('click', checkAsync);
  }
}

function buildBoxes() {
  var serverPath = convertToServerPath(polylineOptions.path),
    data = {path: JSON.stringify(serverPath)}
  $.get('/anyboxer', data).done(function (resp) {
    if (!resp || !resp.length) {
      console.warn('Боксов с сервера не пришло ...');
      return false;
    }
    drawBoxes(resp);
  });
}

function buildBoxesClient() {
  const path = convertToServerPath(polylineOptions.path);

  const data = { "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "LineString",
          "coordinates": _.map(path, function(coords) {return [coords[1], coords[0]]})
        },
        "properties": {
          "fat": 1
        }
      }
    ]
  }

  const boxes = anyBoxer(data, {reverse: true});
  drawBoxes(boxes);
}

function drawBoxes(resp) {
  var boundses = convertToGoogleBoundses(resp);
  boundses.forEach(function (bounds) {
    new gRectangle({map: map, bounds: bounds});
  });
}

function convertToServerPath(path) {
  var newPath = [];
  path.forEach(function(latLng) {
    var one = [latLng.lat(), latLng.lng()];
    newPath.push(one);
  });
  return newPath;
}

function convertToGoogleBoundses(boxes) {
  var boundses = [];
  boxes.forEach(function (box) {
    var sw = new gLatLng(box[0][0], box[0][1]),
      ne = new gLatLng(box[1][0], box[1][1]),
      bounds = new gBounds(sw, ne);
    boundses.push(bounds);
  });
  return boundses;
}

function checkAsync() {
  $.get('/check').done(function (resp) {
    console.log(resp);
  });
}
