
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
