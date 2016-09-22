var L = require('leaflet');
var SVGOverlay = require('leaflet-schematic');
var xhr = require('xhr');
require('../../');


window.map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: 0,
  maxZoom: 20,
  center: [0, 0],
  zoom: 1,
  crs: L.Util.extend({}, L.CRS.Simple, {
    transformation: new L.Transformation(2, 0, -2, 0),
    infinite: false
  }),
  inertia: !L.Browser.ie,
  editable: true
});


var svgOverlay = window.svg = new SVGOverlay('data/sample.svg', {

  usePathContainer: true,


  load: function(url, callback) {
    xhr({
      uri: url,
      headers: {
        'Content-Type': 'image/svg+xml'
      }
    }, function (err, resp, svg) {
      callback(err, svg);
    });
  }

})
.once('load', function() {
  window.map.fitBounds(svgOverlay.getBounds(), { animate: false });
})
.addTo(window.map);

//******************************************************************************
L.EditControl = L.Control.extend({

  options: {
    position: 'topleft',
    callback: null,
    kind: '',
    html: ''
  },


  onAdd: function (map) {
    var container = L.DomUtil.create('div', 'leaflet-control leaflet-bar'),

    link = L.DomUtil.create('a', '', container);
    link.href = '#';
    link.title = 'Create a new ' + this.options.kind;
    link.innerHTML = this.options.html;
    L.DomEvent
    .on(link, 'click', L.DomEvent.stop)
    .on(link, 'click', function () {
      window.LAYER = this.options.callback.call(map.editTools,
        L.latLng([0, 0]), {
          ratio: svgOverlay._ratio,
          renderer: svgOverlay._renderer,
          fontSize: Math.max(L.SVG
            .calcFontSize(svgOverlay._renderer._container).size, 200),
          fontColor: '#55f'
        }
      );
    }, this);

    return container;
  }
});


L.NewTextControl = L.EditControl.extend({

  options: {
    position: 'topleft',
    callback: L.Editable.prototype.startTextBox,
    kind: 'text',
    html: 'T'
  }

});


window.map.addControl(new L.NewTextControl());
