const L = require('leaflet');
const leafletCss =
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.0.0-rc.2/leaflet.css';

const createMap = () => {
  let container = document.createElement('div');
  container.style.width = container.style.height = '500px';
  document.body.appendChild(container);

  if (document.querySelector('#leaflet-style') === null) {
    let style  = document.createElement('link');
    style.rel  = 'stylesheet';
    style.type = 'text/css';
    style.href = leafletCss;
    style.id   = 'leaflet-style';

    document.head.appendChild(style);
  }

  const map = L.map(container, {
    minZoom: 0,
    maxZoom: 20,
    center: [0, 0],
    zoom: 1,
    editable: true,
    crs: L.Util.extend({}, L.CRS.Simple, {
      infinite: false
    }),
    inertia: !L.Browser.ie
  });

  return map;
};

module.exports = createMap;
