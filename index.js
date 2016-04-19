var L = require('leaflet');
require('leaflet-editable');
require('leaflet-path-transform/src/Matrix');
require('./src/Textbox');
require('./src/Util');
require('./src/Editable.Textbox')

module.exports = L.Editable.TextBox;
