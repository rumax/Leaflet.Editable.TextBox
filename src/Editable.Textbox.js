/**
 * TextBox
 *
 * @author rumax
 * @license MIT
 */

L.Editable.TextBoxEditor = L.Editable.RectangleEditor.extend({

  options: {
    textareaPadding: 1,
    placeholder: 'Please, add text here ...',
    updateDelay: 100
  },


  /**
   * @param  {L.Map}     map
   * @param  {L.Textbox} feature
   * @param  {Object=}   options
   */
  initialize: function(map, feature, options) {
    /**
     * @type {HTMLTextAreaElement}
     */
    this._container = null;

    /**
     * @type {String}
     */
    this._text     = null;

    // Reduce amount of updateBounds
    this._updateTextAreaBounds = L.Util.throttle(
      this._updateTextAreaBounds, this.options.updateDelay, this);

    L.Editable.RectangleEditor.prototype.initialize
      .call(this, map, feature, options);
  },


  updateStyle: function() {
    if (null !== this._container) {
      var style   = this._container.style;
      var options = this.feature.options;

      style.fontSize   = options.fontSize + 'px';
      style.color      = options.fontColor;
      style.fontFamily = options.fontFamily;
    }
  },


  onVertexMarkerDragEnd: function (evt) {
    L.Editable.RectangleEditor.prototype.onVertexMarkerDragEnd.call(this, evt);
    this._focus();
  },


  _createContainer: function() {
    var textArea = this._container;

    if (!textArea) {
      textArea = this._container = L.DomUtil.create('textarea',
        'leaflet-zoom-animated leaflet-textbox');
      textArea.style.position = 'absolute';
      textArea.setAttribute('spellcheck', false);

      var style = textArea.style;

      style.resize          = 'none';
      style.border          = 'none';
      style.padding         = this.options.textareaPadding + 'px';
      style.backgroundColor = 'transparent';
      style.overflow        = 'hidden';

      if (this.options.placeholder) {
        textArea.setAttribute('placeholder', this.options.placeholder);
      }

      this.updateStyle();
      this._text = this.feature.getText();

      if (this._text) {
        textArea.value = this._text;
      }

      L.DomEvent.addListener(textArea, 'keypress', L.DomEvent.stopPropagation);
      L.DomEvent.disableClickPropagation(textArea);
      this._updateTextAreaBounds();

      this.map.getPane('markerPane').appendChild(textArea);
      this._focus();
    }
  },


  enable: function() {
    L.Editable.RectangleEditor.prototype.enable.call(this);
    this.map
        .on('dragend', this._focus, this)
        .on('zoomanim', this._animateZoom, this)
        .on('zoomend', this._updateTextAreaBounds, this);
    this._createContainer();
    this.feature._removeContainer();

    return this;
  },


  setText: function(text) {
    this._text = text;

    if (null !== this._container) {
      this._container.value = text;
    }
  },


  getText: function() {
    if (this._enabled) {
      this._text = this._container.value;
    }
    return this._text;
  },


  disable: function() {
    if (this._enabled) {
      this.map
        .off('dragend',  this._focus, this)
        .off('zoomanim', this._animateZoom, this)
        .off('zoomend',  this._updateTextAreaBounds, this);

      if (null !== this._container) {
        this.getText();
        L.DomEvent.removeListener(this._container, 'keypress',
          L.DomEvent.stopPropagation);
        this._container.parentNode.removeChild(this._container);
        this._container = null;
      }

      this.feature.setText(this._text);
    }

    L.Editable.RectangleEditor.prototype.disable.call(this);

    return this;
  },


  _updateBounds: L.Editable.RectangleEditor.prototype.updateBounds,


  updateBounds: function (bounds) {
    this._updateBounds(bounds);
    return this._updateTextAreaBounds();
  },


  _focus: function() {
    L.Util.requestAnimFrame(function() {
      if (null !== this._container) {
        this._container.focus();
      }
    }, this);
  },


  /**
   * Animated resize
   * @param  {Event} evt
   */
  _animateZoom: function(evt) {
    var bounds = this.feature._bounds;
    var scale  = this.feature._getScale(evt.zoom);
    var offset = this.map._latLngToNewLayerPoint(
      bounds.getNorthWest(), evt.zoom, evt.center);

    L.DomUtil.setTransform(this._container, offset, scale.toFixed(3));
  },


  /**
   * Resize, reposition on zoom end or resize
   */
  _updateTextAreaBounds: function() {
    var scale;
    var pos;
    var size;
    var center;
    var feature  = this.feature;
    var textArea = this._container;
    var map      = this.map;
    var bounds;

    if (null !== textArea) {
      bounds = feature.getBounds();
      if (bounds) {
        scale = feature._getScale(map.getZoom());
        center = map.latLngToLayerPoint(bounds.getCenter());
        pos = map.latLngToLayerPoint(bounds.getNorthWest());
        size = L.point(2 * Math.abs(center.x - pos.x),
                       2 * Math.abs(center.y - pos.y))
                 .divideBy(scale)
                 .round();

        L.DomUtil
           .setSize(textArea, size)
           .setTransform(textArea, pos, scale.toFixed(3));
        textArea.style.display = '';
      } else {
        textArea.style.display = 'none';
      }
    }

    return this;
  }

});


L.TextBox.include({

  enableEdit: function(map) {
    if (!this.editor) {
      this.createEditor(map);
    }
    return L.Rectangle.prototype.enableEdit.call(this, map);
  },


  disableEdit: function() {
    if (this.editor) {
      this._text = this.editor.getText();
    }

    L.Rectangle.prototype.disableEdit.call(this);

    return this;
  },


  getEditorClass: function() {
    return L.Editable.TextBoxEditor;
  }

});


/**
 * @param  {Array.<LatLng>=} latlng
 * @param  {Object=} options
 * @return {L.TextBox}
 */
L.Editable.prototype.startTextBox = function(latlng, options) {
  return this.startRectangle(null, L.extend({
    rectangleClass: L.TextBox
  }, options));
};
