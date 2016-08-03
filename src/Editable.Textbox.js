/**
 * TextBox
 *
 * @author rumax
 * @license MIT
 */

/* eslint-disable no-console */

L.Editable.TextBoxEditor = L.Editable.RectangleEditor.extend({

  options: {
    textareaPadding: 1
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
    this._textArea = null;

    /**
     * @type {String}
     */
    this._text     = null;

    L.Editable.RectangleEditor.prototype.initialize.call(this, map, feature, options);
  },


  updateStyle: function() {
    if (null !== this._textArea) {
      var style   = this._textArea.style;
      var options = this.feature.options;

      style.fontSize   = options.fontSize + 'px';
      style.color      = options.fontColor;
      style.fontFamily = options.fontFamily;
    }
  },


  enable: function() {
    L.Editable.RectangleEditor.prototype.enable.call(this);
    this.map
        .on('dragend', this._focus, this)
        .on('zoomanim', this._animateZoom, this)
        .on('zoomend', this._updateTextAreaBounds, this);

    if (null === this._textArea) {
      this._textArea = L.DomUtil.create('textarea',
        'leaflet-zoom-animated leaflet-textbox');
      var style = this._textArea.style; //TODO: Use css
      style.resize          = 'none';
      style.border          = 'none';
      style.padding         = this.options.textareaPadding + 'px';
      style.backgroundColor = 'transparent';
      style.overflow = 'hidden';

      this.updateStyle();
      this.map.getPane('markerPane').appendChild(this._textArea);

      this._text = this.feature._text;
      if (this._text) {
        this._textArea.innerHTML = this._text;
      }

      L.DomEvent.addListener(this._textArea, 'keypress',
        L.DomEvent.stopPropagation);
      L.DomEvent.disableClickPropagation(this._textArea);
      this._updateTextAreaBounds();
    }

    if (this.feature._textNode) {
      this.feature._textNode.parentNode.removeChild(this.feature._textNode);
      this.feature._textNode = null;
    }

    return this;
  },


  setText: function(text) {
    this._text = text;

    if (null !== this._textArea) {
      this._textArea.value = text;
    }
  },


  getText: function() {
    if (this._enabled) {
      this._text = this._textArea.value;
    }
    return this._text;
  },


  disable: function() {
    if (this._enabled) {
      this.map
        .off('dragend',  this._focus, this)
        .off('zoomanim', this._animateZoom, this)
        .off('zoomend',  this._updateTextAreaBounds, this);

      if (null !== this._textArea) {
        this.getText();
        L.DomEvent.removeListener(this._textArea, 'keypress',
          L.DomEvent.stopPropagation);
        this._textArea.parentNode.removeChild(this._textArea);
        this._textArea = null;
      }
      this.feature._text = this._text;

      if (this.map.hasLayer(this.feature)) {
        this.feature._renderText();
      }
    }

    L.Editable.RectangleEditor.prototype.disable.call(this);

    return this;
  },


  updateBounds: function (bounds) {
    L.Editable.RectangleEditor.prototype.updateBounds.call(this, bounds);
    return this._updateTextAreaBounds();
  },


  _focus: function() {
    L.Util.requestAnimFrame(function() {
      if (null !== this._textArea) {
        this._textArea.focus();
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

    L.DomUtil.setTransform(this._textArea, offset, scale.toFixed(3));
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
    var bounds   = feature._bounds;
    var textArea = this._textArea;
    var map      = this.map;
    var bounds;

    if (null !== textArea) {
      if (null !== bounds) {
        scale = feature._getScale(map.getZoom());
        bounds = feature.getBounds();
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
        textArea.style.position = 'absolute';
        textArea.setAttribute('spellcheck', false);

        this._focus();
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
