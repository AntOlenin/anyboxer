var gMaps = google.maps;
var gPolyline = gMaps.Polyline;
var gEvent = gMaps.event;
var addListenerOnce = gEvent.addListenerOnce;
var gLatLng = gMaps.LatLng;
var gBounds = gMaps.LatLngBounds;
var gRectangle = gMaps.Rectangle;


function Map() {
    var mapOptions = {
        center: new gMaps.LatLng(50, 12),
        zoom: 6,
        mapTypeId: gMaps.MapTypeId.ROADMAP
    };
    this.map = new gMaps.Map(document.getElementById("map_canvas"), mapOptions);
    this.polyline = new gPolyline({map: this.map});

    this.cacheElements();

    this.$newBtn.on('click', $.proxy(this.addEvents, this));

}

Map.prototype.cacheElements = function() {
    this.$newBtn = $('#new');
    this.$helpBar = $('#helpbar');
    this.$calcBtn = $('#calculate');
};

Map.prototype.clearIfNeed = function() {
    if (this.polyline) {
        this.polyline.setPath([]);
        this.$calcBtn.hide();
    }
};

Map.prototype.addEvents = function() {
    this.clearIfNeed();
    addListenerOnce(this.map, 'click', $.proxy(this.firstClickHandler, this));
    this.map.setOptions({draggableCursor: 'crosshair'});
    this.$helpBar.text('Кликни по карте, чтобы поставить первую точку');
};

Map.prototype.firstClickHandler = function(position) {
    this.firstPoint = position.latLng;
    addListenerOnce(this.map, 'click', $.proxy(this.lastClickHandler, this));
    this.$helpBar.text('Поставь вторую точку, чтобы маршрут создался');
};

Map.prototype.lastClickHandler = function(position) {
    this.lastPoint = position.latLng;
    this.buildDirections();
    this.map.setOptions({draggableCursor: 'default'});
    this.$helpBar.text('Нажми new, чтобы начать заново');
};

Map.prototype.buildDirections = function() {
    var directionsService = new gMaps.DirectionsService();
    var request = {
        origin: this.firstPoint,
        destination: this.lastPoint,
        travelMode: gMaps.TravelMode.DRIVING
    };

    directionsService.route(request, $.proxy(this.buildDirectionsCallback, this));
};

Map.prototype.buildDirectionsCallback = function(response, status) {
    if (status == gMaps.DirectionsStatus.OK) {
        this.path = response.routes[0].overview_path;
        this.polyline.setPath(this.path);
        this.$calcBtn.show();
        this.$calcBtn.on('click', $.proxy(this.buildBoxes, this));
    }
};

Map.prototype.buildBoxes = function() {
    var serverPath = this.convertToServerPath(this.path);
    var data = {path: JSON.stringify(serverPath)}
    $.get('/anyboxer', data).done($.proxy(this.drawBoxes, this));
};

Map.prototype.drawBoxes = function(resp) {
    var boundses = this.convertToGoogleBoundses(resp);
    boundses.forEach($.proxy(this.drawOneBox, this));
};

Map.prototype.drawOneBox = function(bounds) {
    new gRectangle({map: this.map, bounds: bounds});
};

Map.prototype.convertToServerPath = function(path) {
    var newPath = [];
    path.forEach(function(latLng) {
        var one = [latLng.lat(), latLng.lng()];
        newPath.push(one);
    });
    return newPath;
};

Map.prototype.convertToGoogleBoundses = function(boxes) {
    var boundses = [];
    boxes.forEach(function(box) {
        var sw = new gLatLng(box[0][1], box[0][0]);
        var ne = new gLatLng(box[1][1], box[1][0]);
        var bounds = new gBounds(sw, ne);
        boundses.push(bounds);
    });
    return boundses;
};


new Map;