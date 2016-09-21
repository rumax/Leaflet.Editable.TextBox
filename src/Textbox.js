L.TextBox = L.Rectangle.extend({

  options: {
    fontSize: 12,
    fontColor: '',
    fontFamily: '',
    text: '',
    lineHeight: 0,
    ratio: 1,
    breakBy: 'letter', // word or letter break new line

    // Override rectangle options
    fillOpacity: 0.5,
    fillColor: '#ffffff'
  },


  initialize: function(bounds, options) {
    L.Rectangle.prototype.initialize.call(this, bounds, options);

    this._text = true === L.Util.isArray(this.options.text) ?
      this.options.text : [this.options.text];
    this._container = null;
    this._lineHeight = this.options.lineHeight;
  },


  /**
   * @param {Object} style
   */
  setStyle: function(style) {
    L.setOptions(this, style);

    if (this.editor && this.editor._enabled) {
      this.editor.updateStyle();
    } else {
      this._renderText();
    }
  },


  updateStyle: function() {
    var textNode = this._container;
    var options = this.options;

    if (null !== textNode) {
      textNode.setAttribute('font-family', options.fontFamily);
      textNode.setAttribute('font-size', options.fontSize + 'px');
      textNode.setAttribute('fill', options.fontColor);
    }
  },


  /**
   * @param  {L.Map} map
   */
  onRemove: function(map) {
    this._removeContainer();
    L.Rectangle.prototype.onRemove.call(this, map);
  },


  _removeContainer: function() {
    if (null !== this._container) {
      if (null !== this._container.parentNode) {
        this._container.parentNode.removeChild(this._container);
      }

      this._container = null;
    }
  },


  getText: function() {
    return this._text.join('');
  },


  setText: function(text) {
    this._text = true === L.Util.isArray(text) ? text : [text];
    this._renderText();
  },


  _renderText: function() {
    if (this._renderer) {
      if (0 < this._text.length) {
        var options = this.options;
        var rendered = new L.SVG.TextToSvg(this.getText(), {
          size: this.getSize(),
          breakBy: options.breakBy,
          fontSize: options.fontSize,
          fontFamily: options.fontFamily,
          fontColor: options.fontColor
        }).render(this._renderer._rootGroup);
        this._container = rendered.node;
        this._text = rendered.lines;
        this._lineHeight = rendered.lineHeight;
        this._path.parentNode
            .insertBefore(this._container, this._path.nextSibling);
        this.updateStyle();
        this._updatePosition();
      } else {
        this._removeContainer();
      }
    }
  },


  getSize: function() {
    var scale = this._getScale(this._map.getZoom());
    var bounds = this.getBounds();
    var center = this._map.latLngToLayerPoint(bounds.getCenter());
    var pos = this._map.latLngToLayerPoint(bounds.getNorthWest());
    var size = L.point(2 * Math.abs(center.x - pos.x),
                       2 * Math.abs(center.y - pos.y)).divideBy(scale);

    return size;
  },


  _updatePosition: function() {
    if (null !== this._container) {
      var bounds = this.getBounds();
      var pos = this._map.latLngToLayerPoint(bounds.getNorthWest());
      var textMatrix = new L.Matrix(1, 0, 0, 1, 0, 0)
        .translate(pos)
        .scale(this._getScale(this._map.getZoom()));

      this._container.setAttribute('transform',
        'matrix(' + textMatrix._matrix.join(' ') + ')');
    }
  },


  _getScale: function(zoom) {
    return this._map ? Math.pow(2, zoom) * this.options.ratio : 1;
  },


  _updatePath: function() {
    L.Rectangle.prototype._updatePath.call(this);
    this._updatePosition();
  },


  /**
   * toGeoJSON
   * @return {toGeoJSON} [description]
   */
  toGeoJSON: function () {
    var gj = L.Rectangle.prototype.toGeoJSON.call(this);

    gj.properties.fontSize = this.options.fontSize;
    gj.properties.fontFamily = this.options.fontFamily;
    gj.properties.fontColor = this.options.fontColor;

    // Rendered information
    gj.properties.text = this._text;
    gj.properties.lineHeight = this._lineHeight;

    return gj;
  }

});
