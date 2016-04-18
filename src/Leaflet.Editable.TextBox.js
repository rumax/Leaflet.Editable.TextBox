/**
 * TextBox
 *
 * @author rumax
 * @license MIT
 */

 L.DomUtil.setSize =  L.DomUtil.setSize || function(element, size) {
  element.style.width = size.x  + 'px';
  element.style.height = size.y + 'px';
  return this;
};


L.TextBox = L.Rectangle.extend({

  _text: 'Please, add text',
  _textNode: null,

  options: {
    padding: 2,
    fontSize: 12,
    fontColor: '',
    fontFamily: ''
    //TODO: wrapBy: 'letter', 'char', 'nowrap', etc.
  },


  setStyle: function(style) {
    L.setOptions(this, style);

    if (this.editor) {
      this.editor.updateStyle();
    } else {
      this._processText();
    }
  },


  updateStyle: function() {
    if (null !== this._textNode) {
      this._textNode.setAttribute('font-family', this.options.fontFamily);
      this._textNode.setAttribute('font-size', this.options.fontSize + 'px');
      this._textNode.setAttribute('fill', this.options.fontColor);
    }
  },


  enableEdit: function(map) {
    var ret;

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
  },


  getEditorClass: function() {
    return L.Editable.TextBoxEditor;
  },


  _textMakeNextLine: function(container, text, attrs) {
    var tspan = L.SVG.create('tspan');
    var key;

    for (key in attrs || {}) {
      if (attrs.hasOwnProperty(key)) {
        tspan.setAttribute(key, attrs[key]);
      }
    }

    if (void 0 !== text) {
      tspan.innerHTML = text;
    }

    container.appendChild(tspan);

    return tspan;
  },


  _text2svg: function(textElement, text, size) {
    var tspan;
    var line = '';
    var prevLine;
    var lineInd = 1;
    var lineHeight;
    var chars;
    var char;
    var lineHeight;
    var lineLength;
    var maxWidth;

    if (text) {
      maxWidth = size.width - this.options.padding;
      chars = text.split('');
      line = chars.shift();
      tspan = this._textMakeNextLine(textElement, line, {
        x: this.options.padding
      });
      lineHeight = textElement.getBBox().height;
      tspan.setAttribute('dy', lineHeight * lineInd);

      while (char = chars.shift()) {
        if (' ' === char) {
          line += char;
        } else if ('\n' === char) {
          line = '';
          tspan = this._textMakeNextLine(textElement, line, {
            x: this.options.padding,
            dy: 1.12 * lineHeight
          });
        } else if ('\t' !== char) { //skip tabs
          prevLine = line;
          line += char;
          tspan.innerHTML = line;
          lineLength = this.options.padding + tspan.getBBox().width;

          if (lineLength > maxWidth && 1 <= line.length) {
            ++lineInd;
            tspan.innerHTML = prevLine.replace(/\s*$/gm, '');
            prevLine = '';
            line = char;
            tspan = this._textMakeNextLine(textElement, line, {
              x: this.options.padding,
              dy: 1.12 * lineHeight
            });
          }
        }
      }
    } else if (null !== textElement) {
      textElement.parentNode.removeChild(textElement);
      textElement = null;
    }

    return textElement;
  },


  _processText: function() {
    var scale = this._getScale();
    var pos = this._rings[0][1];
    var size = this._rings[0][3].subtract(pos);

    if (null === this._textNode) {
      this._textNode = L.SVG.create('text');
      this._path.parentNode
        .insertBefore(this._textNode, this._path.nextSibling);
    } else {
      this._textNode.innerHTML = '';
    }

    this.updateStyle();
    this._textNode = this._text2svg(this._textNode, this._text, {
        width: size.x / scale,
        height: size.y / scale
      }, pos.x);
    this._updatePos();
  },


  _updatePos: function() {
    var pos;
    var textMatrix;

    if (null !== this._textNode && 0 !== this._rings.length) {
      pos = this._rings[0][1];
      textMatrix = new L.Matrix(1, 0, 0, 1, 0, 0)
        .translate(pos)
        .scale(this._getScale());
      this._textNode.setAttribute('transform',
        'matrix(' + textMatrix._matrix.join(' ') + ')');
    }
  },


  _getScale: function() {
    return this._map ?
      Math.pow(2, this._map.getZoom()) * this.options.ratio : 1;
  },


  _updatePath: function() {
    L.Rectangle.prototype._updatePath.call(this);
    this._updatePos();
  }

});


L.Editable.TextBoxEditor = L.Editable.RectangleEditor.extend({

  _textArea: null,
  _text: null,
  _eventsOn: false,
  _bounds: null,


  updateStyle: function() {
    if (null !== this._textArea) {
      this._textArea.style.fontSize = this.feature.options.fontSize + 'px';
      this._textArea.style.color = this.feature.options.fontColor;
      this._textArea.style.fontFamily = this.feature.options.fontFamily;
    }
  },


  enable: function() {
    L.Editable.RectangleEditor.prototype.enable.call(this);
    this._bindEvents();

    if (null === this._textArea) {
      this._textArea = L.DomUtil.create('textarea',
        'leaflet-zoom-animated leaflet-textbox');
      this._textArea.style.resize = 'none';
      this._textArea.style.border = 'none';
      this._textArea.style.padding = '1px';
      this._textArea.style.backgroundColor = 'transparent';
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
    this._unbindEvents();

    if (null !== this.textArea) {
      this.getText();
      this._textArea.parentNode.removeChild(this._textArea);
      this._textArea = null;
    }

    L.Editable.RectangleEditor.prototype.disable.call(this);

    return this;
  },


  updateBounds: function (bounds) {
    L.Editable.RectangleEditor.prototype.updateBounds.call(this, bounds);
    return this._updateTextAreaBounds();
  },


  _bindEvents: function() {
    if (true !== this._eventsBinded) {
      this.map
        .on('dragend', this._focus, this)
        .on('zoomend', this._updateTextAreaBounds, this);
      this._eventsBinded = true;
    }
  },


  _focus: function() {
    if (null !== this._textArea) {
      L.Util.requestAnimFrame(function() {
        this._textArea.focus();
      }, this);
    }
  },


  _unbindEvents: function() {
    if (true === this._eventsBinded) {
      this.map
        .off('dragend', this._focus, this)
        .off('zoomend', this._updateTextAreaBounds, this);
      delete this._eventsBinded;
    }
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
        this._textArea.style.transform += ' scale(' + scale +')';
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


L.Editable.startTextBox = function(latlng, options) {
  return this.startRectangle(null, L.extend({
    rectangleClass: L.TextBox
  }, options));
};
