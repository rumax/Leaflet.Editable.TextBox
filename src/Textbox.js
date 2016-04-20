
L.TextBox = L.Rectangle.extend({

  options: {
    padding: 2,
    fontSize: 12,
    fillOpacity: 0.5,
    fillColor: '#ffffff',
    weight: 1,
    fontColor: '',
    fontFamily: '',
    ratio: 1,
    text: 'Please, add text'

    //TODO: wrapBy: 'letter', 'char', 'nowrap', etc.
  },


  initialize: function(bounds, options) {
    L.Rectangle.prototype.initialize.call(this, bounds, options);

    this._text = this.options.text;
    this._textNode = null;
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
    var textNode = this._textNode;
    var options = this.options;
    if (null !== textNode) {
      textNode.setAttribute('font-family', options.fontFamily);
      textNode.setAttribute('font-size', options.fontSize + 'px');
      textNode.setAttribute('fill', options.fontColor);
    }
  },


  _renderText: function() {
    this._textNode = this._renderer.renderText(this);
    this._path.parentNode
        .insertBefore(this._textNode, this._path.nextSibling);
    this.updateStyle();
    this._updatePosition();
  },


  _updatePosition: function() {
    if (null !== this._textNode && 0 !== this._rings.length) {
      var pos = this._rings[0][1];
      var textMatrix = new L.Matrix(1, 0, 0, 1, 0, 0)
        .translate(pos)
        .scale(this._getScale(this._map.getZoom()));
      this._textNode.setAttribute('transform',
        'matrix(' + textMatrix._matrix.join(' ') + ')');
    }
  },


  _getScale: function(zoom) {
    return (this._map ?
      Math.pow(2, zoom) * this.options.ratio : 1);
  },


  _updatePath: function() {
    L.Rectangle.prototype._updatePath.call(this);
    this._updatePosition();
  }

});
