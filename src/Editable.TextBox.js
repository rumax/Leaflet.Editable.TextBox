/**
 * TextBox
 *
 * @author rumax
 * @license MIT
 */

/* eslint-disable no-console */

L.Editable.TextBoxEditor = L.Editable.RectangleEditor.extend({

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
      var style = this._textArea.style;
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
      var style = this._textArea.style;
      style.resize = 'none';
      style.border = 'none';
      style.padding = '1px';
      style.backgroundColor = 'transparent';

      this.updateStyle();
      this.map._panes.markerPane.appendChild(this._textArea);

      if (this._text) {
        this._textArea.innerHTML = this._text;
      }

      this._updateTextAreaBounds();
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
    this._text = this._textArea.value;
    return this._text;
  },


  disable: function() {
    if (this._enabled) {
      this.map
          .off('dragend', this._focus, this)
          .off('zoomanim', this._animateZoom, this)
          .off('zoomend', this._updateTextAreaBounds, this);

      if (null !== this.textArea) {
        this.getText();
        this._textArea.parentNode.removeChild(this._textArea);
        this._textArea = null;
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
    if (null !== this._textArea) {
      L.Util.requestAnimFrame(function() {
        this._textArea.focus();
      }, this);
    }
  },


  _animateZoom: function(evt) {
    var bounds = this.feature._bounds;
    var map = this.map;
    var scale = map.getZoomScale(evt.zoom);
    var offset = map._latLngToNewLayerPoint(
      bounds.getNorthWest(), evt.zoom, evt.center);

    L.DomUtil.setTransform(this._textArea, offset, scale);
  },


  _updateTextAreaBounds: function() {
    var scale;
    var latlngs;
    var pos;
    var size;
    var bounds = this.feature._bounds;

    if (null !== this._textArea) {
      if (null !== bounds) {
        scale = this.feature._getScale();
        latlngs = this.feature._boundsToLatLngs(bounds);
        pos = this.map.latLngToLayerPoint(latlngs[1]);
        size = this.map.latLngToLayerPoint(latlngs[3]).subtract(pos);
        L.DomUtil
           .setSize(this._textArea, {
             x: size.x / scale,
             y: size.y / scale
           })
           .setPosition(this._textArea, pos);
        this._textArea.style.transform += ' scale(' + scale + ')';
        this._textArea.style.display = '';
        this._textArea.setAttribute('spellcheck', false);
        this._focus();
      } else {
        this._textArea.style.display = 'none';
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
    var ret = L.Rectangle.prototype.enableEdit.call(this, map);

    //remove text node
    this._textNode = this._text2svg(this._textNode, null);



    ret = L.Rectangle.prototype.enableEdit.call(this, map);
    this.editor.setText(this._text);

    return ret;
  },


  disableEdit: function() {
    if (this.editor) {
      this._text = this.editor.getText();
    }

    L.Rectangle.prototype.disableEdit.call(this);
    this._processText();

    return this;
  }

});


L.TextBox.prototype.getEditorClass = function() {
  return L.Editable.TextBoxEditor;
};


/**
 * @param  {Array.<LatLng>=} latlng
 * @param  {Object=} options
 * @return {L.TextBox}
 */
L.Editable.startTextBox = function(latlng, options) {
  return this.startRectangle(null, L.extend({
    rectangleClass: L.TextBox
  }, options));
};
