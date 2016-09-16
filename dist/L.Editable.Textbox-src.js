(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g=(g.L||(g.L = {}));g=(g.Editable||(g.Editable = {}));g.Textbox = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*eslint no-undef: "error"*/
/*eslint-env node*/

var L = require('leaflet');

require('leaflet-editable');
require('leaflet-path-transform/src/Matrix');
require('./src/Textbox');
require('./src/Util');
require('./src/Editable.Textbox');
require('./src/SVG');

module.exports = L.Editable.TextBoxEditor;

},{"./src/Editable.Textbox":3,"./src/SVG":4,"./src/Textbox":5,"./src/Util":6,"leaflet":undefined,"leaflet-editable":undefined,"leaflet-path-transform/src/Matrix":2}],2:[function(require,module,exports){
/**
 * @class  L.Matrix
 *
 * @param {Number} a
 * @param {Number} b
 * @param {Number} c
 * @param {Number} d
 * @param {Number} e
 * @param {Number} f
 */
L.Matrix = function(a, b, c, d, e, f) {

  /**
   * @type {Array.<Number>}
   */
  this._matrix = [a, b, c, d, e, f];
};


L.Matrix.prototype = {


  /**
   * @param  {L.Point} point
   * @return {L.Point}
   */
  transform: function(point) {
    return this._transform(point.clone());
  },


  /**
   * Destructive
   *
   * [ x ] = [ a  b  tx ] [ x ] = [ a * x + b * y + tx ]
   * [ y ] = [ c  d  ty ] [ y ] = [ c * x + d * y + ty ]
   *
   * @param  {L.Point} point
   * @return {L.Point}
   */
  _transform: function(point) {
    var matrix = this._matrix;
    var x = point.x, y = point.y;
    point.x = matrix[0] * x + matrix[1] * y + matrix[4];
    point.y = matrix[2] * x + matrix[3] * y + matrix[5];
    return point;
  },


  /**
   * @param  {L.Point} point
   * @return {L.Point}
   */
  untransform: function (point) {
    var matrix = this._matrix;
    return new L.Point(
      (point.x / matrix[0] - matrix[4]) / matrix[0],
      (point.y / matrix[2] - matrix[5]) / matrix[2]
    );
  },


  /**
   * @return {L.Matrix}
   */
  clone: function() {
    var matrix = this._matrix;
    return new L.Matrix(
      matrix[0], matrix[1], matrix[2],
      matrix[3], matrix[4], matrix[5]
    );
  },


  /**
   * @param {L.Point=|Number=} translate
   * @return {L.Matrix|L.Point}
   */
  translate: function(translate) {
    if (translate === undefined) {
      return new L.Point(this._matrix[4], this._matrix[5]);
    }

    var translateX, translateY;
    if (typeof translate === 'number') {
      translateX = translateY = translate;
    } else {
      translateX = translate.x;
      translateY = translate.y;
    }

    return this._add(1, 0, 0, 1, translateX, translateY);
  },


  /**
   * @param {L.Point=|Number=} scale
   * @return {L.Matrix|L.Point}
   */
  scale: function(scale, origin) {
    if (scale === undefined) {
      return new L.Point(this._matrix[0], this._matrix[3]);
    }

    var scaleX, scaleY;
    origin = origin || L.point(0, 0);
    if (typeof scale === 'number') {
      scaleX = scaleY = scale;
    } else {
      scaleX = scale.x;
      scaleY = scale.y;
    }

    return this
      ._add(scaleX, 0, 0, scaleY, origin.x, origin.y)
      ._add(1, 0, 0, 1, -origin.x, -origin.y);
  },


  /**
   * m00  m01  x - m00 * x - m01 * y
   * m10  m11  y - m10 * x - m11 * y
   * @param {Number}   angle
   * @param {L.Point=} origin
   * @return {L.Matrix}
   */
  rotate: function(angle, origin) {
    var cos = Math.cos(angle);
    var sin = Math.sin(angle);

    origin = origin || new L.Point(0, 0);

    return this
      ._add(cos, sin, -sin, cos, origin.x, origin.y)
      ._add(1, 0, 0, 1, -origin.x, -origin.y);
  },


  /**
   * Invert rotation
   * @return {L.Matrix}
   */
  flip: function() {
    this._matrix[1] *= -1;
    this._matrix[2] *= -1;
    return this;
  },


  /**
   * @param {Number|L.Matrix} a
   * @param {Number} b
   * @param {Number} c
   * @param {Number} d
   * @param {Number} e
   * @param {Number} f
   */
  _add: function(a, b, c, d, e, f) {
    var result = [[], [], []];
    var src = this._matrix;
    var m = [
      [src[0], src[2], src[4]],
      [src[1], src[3], src[5]],
      [     0,      0,     1]
    ];
    var other = [
      [a, c, e],
      [b, d, f],
      [0, 0, 1]
    ], val;


    if (a && a instanceof L.Matrix) {
      src = a._matrix;
      other = [
        [src[0], src[2], src[4]],
        [src[1], src[3], src[5]],
        [     0,      0,     1]];
    }

    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        val = 0;
        for (var k = 0; k < 3; k++) {
          val += m[i][k] * other[k][j];
        }
        result[i][j] = val;
      }
    }

    this._matrix = [
      result[0][0], result[1][0], result[0][1],
      result[1][1], result[0][2], result[1][2]
    ];
    return this;
  }


};


L.matrix = function(a, b, c, d, e, f) {
  return new L.Matrix(a, b, c, d, e, f);
};

},{}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
/**
 * SVG tools
 *
 * @author rumax
 * @license MIT
 * @preserve
 */

var DEFAULT_SIZE = 12;
var LINE_FACTOR  = 1.12;

/**
 * @param  {SVGElement} svg
 * @return {Object}
 */
L.SVG.calcFontSize = L.SVG.calcFontSize || function(svg) {
  var size    = DEFAULT_SIZE;
  var sizeMin = Number.MAX_VALUE;
  var sizeMax = Number.MIN_VALUE;
  var texts   = svg.querySelectorAll('text');
  var textSize;
  var fontSizeAttr;

  if (0 < texts.length) {
    size = 0;
    for (var ind = texts.length - 1; 0 <= ind; --ind) {
      fontSizeAttr = texts[ind].getAttribute('font-size');
      if (null !== fontSizeAttr) {
      	textSize = parseFloat(texts[ind].getAttribute('font-size'));
      	size += textSize;
      	if (sizeMin > textSize) {
          sizeMin = textSize;
      	}
      	if (sizeMax < textSize) {
          sizeMax = textSize;
      	}
      }
    }

    return {
      size: Math.round(size / texts.length + 0.5),
      min: Math.round(sizeMin + 0.5),
      max: Number.MIN_VALUE === sizeMax ? size : Math.round(sizeMax + 0.5)
    };
  }

  return {
    size: size,
    min: size,
    max: size
  };
};


L.SVG.include({

  renderText: function(layer) {
    var textElement = layer._textNode;
    var text  = layer._text;

    if (textElement) {
      textElement.parentNode.removeChild(textElement);
    }
    textElement = layer._textNode = L.SVG.create('text');
    layer.updateStyle();
    this._rootGroup.appendChild(textElement);

    if (text) {
      var scale = layer._getScale(this._map.getZoom());
      var bounds = layer.getBounds();
      var center = layer._map.latLngToLayerPoint(bounds.getCenter());
      var pos = layer._map.latLngToLayerPoint(bounds.getNorthWest());
      var size = L.point(2 * Math.abs(center.x - pos.x),
                         2 * Math.abs(center.y - pos.y)).divideBy(scale);
      var chars = text.split('');
      var line = chars.shift();
      var char = chars.shift();
      var lineInd = 1;
      var maxWidth = size.x - layer.options.padding;
      var tspan = this._textMakeNextLine(textElement, line, {
        x: layer.options.padding
      });
      var lineHeight = textElement.getBBox().height;
      console.log(lineHeight);
      tspan.setAttribute('dy', lineHeight);

      while (char) {
        if (' ' === char) {
          line += char;
        } else if ('\n' === char) {
          line = '';
          tspan = this._textMakeNextLine(textElement, line, {
            x: layer.options.padding,
            dy: LINE_FACTOR * lineHeight
          });
        } else if ('\t' !== char) { //skip tabs
          var prevLine = line;
          line += char;
          tspan.firstChild.nodeValue = line;
          var lineLength = layer.options.padding +
            tspan.getComputedTextLength();

          if (lineLength > maxWidth && 1 <= line.length) {
            ++lineInd;
            tspan.firstChild.nodeValue = prevLine.replace(/\s*$/gm, '');
            prevLine = '';
            line = char;
            tspan = this._textMakeNextLine(textElement, line, {
              x: layer.options.padding,
              dy: LINE_FACTOR * lineHeight
            });
          }
        }
        char = chars.shift();
      }
    } else if (null !== textElement) {
      textElement.parentNode.removeChild(textElement);
      textElement = null;
    }

    return textElement;
  },


  _textMakeNextLine: function(container, text, attrs) {
    var tspan = L.SVG.create('tspan');
    var key;

    for (key in attrs || {}) {
      if (attrs.hasOwnProperty(key)) {
        tspan.setAttribute(key, attrs[key]);
      }
    }
    tspan.appendChild(document.createTextNode(text || ''));
    container.appendChild(tspan);

    return tspan;
  }
});

},{}],5:[function(require,module,exports){

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


  getText: function () {
    if (this._textNode) {
      return Array.prototype.slice.call(this._textNode.childNodes)
        .filter(function (node) {
          return node.tagName.toLowerCase() === 'tspan';
        })
        .map(function (node) {
          this.options.lineHeight = node.getAttribute('dy');
          return node.textContent;
        }, this);
    } else {
      return this._text;
    }
  },



  /**
   * @param  {L.Map} map
   */
  onRemove: function(map) {
    if (null !== this._textNode) {
      if (null !== this._textNode.parentNode) {
        this._textNode.parentNode.removeChild(this._textNode);
      }
      this._textNode = null;
    }
    L.Rectangle.prototype.onRemove.call(this, map);
  },


  _renderText: function() {
    if (this._renderer) {
      this._textNode = this._renderer.renderText(this);
      this._path.parentNode
          .insertBefore(this._textNode, this._path.nextSibling);
      this.updateStyle();
      this._updatePosition();
    }
  },


  _updatePosition: function() {
    if (null !== this._textNode) {
      var bounds = this.getBounds();
      var pos = this._map.latLngToLayerPoint(bounds.getNorthWest());
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
  },


  toGeoJSON: function () {
    var gj = L.Rectangle.prototype.toGeoJSON.call(this);
    gj.properties.text = this._text;
  }

});

},{}],6:[function(require,module,exports){
/**
 * @param  {Element} element
 * @param  {L.Point} size
 * @return {Object} self
 */
L.DomUtil.setSize =  L.DomUtil.setSize || function(element, size) {
  element.style.width = size.x  + 'px';
  element.style.height = size.y + 'px';
  return this;
};

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9sZWFmbGV0LXBhdGgtdHJhbnNmb3JtL3NyYy9NYXRyaXguanMiLCJzcmMvRWRpdGFibGUuVGV4dGJveC5qcyIsInNyYy9TVkcuanMiLCJzcmMvVGV4dGJveC5qcyIsInNyYy9VdGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDblBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyplc2xpbnQgbm8tdW5kZWY6IFwiZXJyb3JcIiovXG4vKmVzbGludC1lbnYgbm9kZSovXG5cbnZhciBMID0gcmVxdWlyZSgnbGVhZmxldCcpO1xuXG5yZXF1aXJlKCdsZWFmbGV0LWVkaXRhYmxlJyk7XG5yZXF1aXJlKCdsZWFmbGV0LXBhdGgtdHJhbnNmb3JtL3NyYy9NYXRyaXgnKTtcbnJlcXVpcmUoJy4vc3JjL1RleHRib3gnKTtcbnJlcXVpcmUoJy4vc3JjL1V0aWwnKTtcbnJlcXVpcmUoJy4vc3JjL0VkaXRhYmxlLlRleHRib3gnKTtcbnJlcXVpcmUoJy4vc3JjL1NWRycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEwuRWRpdGFibGUuVGV4dEJveEVkaXRvcjtcbiIsIi8qKlxuICogQGNsYXNzICBMLk1hdHJpeFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBhXG4gKiBAcGFyYW0ge051bWJlcn0gYlxuICogQHBhcmFtIHtOdW1iZXJ9IGNcbiAqIEBwYXJhbSB7TnVtYmVyfSBkXG4gKiBAcGFyYW0ge051bWJlcn0gZVxuICogQHBhcmFtIHtOdW1iZXJ9IGZcbiAqL1xuTC5NYXRyaXggPSBmdW5jdGlvbihhLCBiLCBjLCBkLCBlLCBmKSB7XG5cbiAgLyoqXG4gICAqIEB0eXBlIHtBcnJheS48TnVtYmVyPn1cbiAgICovXG4gIHRoaXMuX21hdHJpeCA9IFthLCBiLCBjLCBkLCBlLCBmXTtcbn07XG5cblxuTC5NYXRyaXgucHJvdG90eXBlID0ge1xuXG5cbiAgLyoqXG4gICAqIEBwYXJhbSAge0wuUG9pbnR9IHBvaW50XG4gICAqIEByZXR1cm4ge0wuUG9pbnR9XG4gICAqL1xuICB0cmFuc2Zvcm06IGZ1bmN0aW9uKHBvaW50KSB7XG4gICAgcmV0dXJuIHRoaXMuX3RyYW5zZm9ybShwb2ludC5jbG9uZSgpKTtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBEZXN0cnVjdGl2ZVxuICAgKlxuICAgKiBbIHggXSA9IFsgYSAgYiAgdHggXSBbIHggXSA9IFsgYSAqIHggKyBiICogeSArIHR4IF1cbiAgICogWyB5IF0gPSBbIGMgIGQgIHR5IF0gWyB5IF0gPSBbIGMgKiB4ICsgZCAqIHkgKyB0eSBdXG4gICAqXG4gICAqIEBwYXJhbSAge0wuUG9pbnR9IHBvaW50XG4gICAqIEByZXR1cm4ge0wuUG9pbnR9XG4gICAqL1xuICBfdHJhbnNmb3JtOiBmdW5jdGlvbihwb2ludCkge1xuICAgIHZhciBtYXRyaXggPSB0aGlzLl9tYXRyaXg7XG4gICAgdmFyIHggPSBwb2ludC54LCB5ID0gcG9pbnQueTtcbiAgICBwb2ludC54ID0gbWF0cml4WzBdICogeCArIG1hdHJpeFsxXSAqIHkgKyBtYXRyaXhbNF07XG4gICAgcG9pbnQueSA9IG1hdHJpeFsyXSAqIHggKyBtYXRyaXhbM10gKiB5ICsgbWF0cml4WzVdO1xuICAgIHJldHVybiBwb2ludDtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtMLlBvaW50fSBwb2ludFxuICAgKiBAcmV0dXJuIHtMLlBvaW50fVxuICAgKi9cbiAgdW50cmFuc2Zvcm06IGZ1bmN0aW9uIChwb2ludCkge1xuICAgIHZhciBtYXRyaXggPSB0aGlzLl9tYXRyaXg7XG4gICAgcmV0dXJuIG5ldyBMLlBvaW50KFxuICAgICAgKHBvaW50LnggLyBtYXRyaXhbMF0gLSBtYXRyaXhbNF0pIC8gbWF0cml4WzBdLFxuICAgICAgKHBvaW50LnkgLyBtYXRyaXhbMl0gLSBtYXRyaXhbNV0pIC8gbWF0cml4WzJdXG4gICAgKTtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtMLk1hdHJpeH1cbiAgICovXG4gIGNsb25lOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgbWF0cml4ID0gdGhpcy5fbWF0cml4O1xuICAgIHJldHVybiBuZXcgTC5NYXRyaXgoXG4gICAgICBtYXRyaXhbMF0sIG1hdHJpeFsxXSwgbWF0cml4WzJdLFxuICAgICAgbWF0cml4WzNdLCBtYXRyaXhbNF0sIG1hdHJpeFs1XVxuICAgICk7XG4gIH0sXG5cblxuICAvKipcbiAgICogQHBhcmFtIHtMLlBvaW50PXxOdW1iZXI9fSB0cmFuc2xhdGVcbiAgICogQHJldHVybiB7TC5NYXRyaXh8TC5Qb2ludH1cbiAgICovXG4gIHRyYW5zbGF0ZTogZnVuY3Rpb24odHJhbnNsYXRlKSB7XG4gICAgaWYgKHRyYW5zbGF0ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gbmV3IEwuUG9pbnQodGhpcy5fbWF0cml4WzRdLCB0aGlzLl9tYXRyaXhbNV0pO1xuICAgIH1cblxuICAgIHZhciB0cmFuc2xhdGVYLCB0cmFuc2xhdGVZO1xuICAgIGlmICh0eXBlb2YgdHJhbnNsYXRlID09PSAnbnVtYmVyJykge1xuICAgICAgdHJhbnNsYXRlWCA9IHRyYW5zbGF0ZVkgPSB0cmFuc2xhdGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRyYW5zbGF0ZVggPSB0cmFuc2xhdGUueDtcbiAgICAgIHRyYW5zbGF0ZVkgPSB0cmFuc2xhdGUueTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fYWRkKDEsIDAsIDAsIDEsIHRyYW5zbGF0ZVgsIHRyYW5zbGF0ZVkpO1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7TC5Qb2ludD18TnVtYmVyPX0gc2NhbGVcbiAgICogQHJldHVybiB7TC5NYXRyaXh8TC5Qb2ludH1cbiAgICovXG4gIHNjYWxlOiBmdW5jdGlvbihzY2FsZSwgb3JpZ2luKSB7XG4gICAgaWYgKHNjYWxlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBuZXcgTC5Qb2ludCh0aGlzLl9tYXRyaXhbMF0sIHRoaXMuX21hdHJpeFszXSk7XG4gICAgfVxuXG4gICAgdmFyIHNjYWxlWCwgc2NhbGVZO1xuICAgIG9yaWdpbiA9IG9yaWdpbiB8fCBMLnBvaW50KDAsIDApO1xuICAgIGlmICh0eXBlb2Ygc2NhbGUgPT09ICdudW1iZXInKSB7XG4gICAgICBzY2FsZVggPSBzY2FsZVkgPSBzY2FsZTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2NhbGVYID0gc2NhbGUueDtcbiAgICAgIHNjYWxlWSA9IHNjYWxlLnk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgICAgIC5fYWRkKHNjYWxlWCwgMCwgMCwgc2NhbGVZLCBvcmlnaW4ueCwgb3JpZ2luLnkpXG4gICAgICAuX2FkZCgxLCAwLCAwLCAxLCAtb3JpZ2luLngsIC1vcmlnaW4ueSk7XG4gIH0sXG5cblxuICAvKipcbiAgICogbTAwICBtMDEgIHggLSBtMDAgKiB4IC0gbTAxICogeVxuICAgKiBtMTAgIG0xMSAgeSAtIG0xMCAqIHggLSBtMTEgKiB5XG4gICAqIEBwYXJhbSB7TnVtYmVyfSAgIGFuZ2xlXG4gICAqIEBwYXJhbSB7TC5Qb2ludD19IG9yaWdpblxuICAgKiBAcmV0dXJuIHtMLk1hdHJpeH1cbiAgICovXG4gIHJvdGF0ZTogZnVuY3Rpb24oYW5nbGUsIG9yaWdpbikge1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyhhbmdsZSk7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKGFuZ2xlKTtcblxuICAgIG9yaWdpbiA9IG9yaWdpbiB8fCBuZXcgTC5Qb2ludCgwLCAwKTtcblxuICAgIHJldHVybiB0aGlzXG4gICAgICAuX2FkZChjb3MsIHNpbiwgLXNpbiwgY29zLCBvcmlnaW4ueCwgb3JpZ2luLnkpXG4gICAgICAuX2FkZCgxLCAwLCAwLCAxLCAtb3JpZ2luLngsIC1vcmlnaW4ueSk7XG4gIH0sXG5cblxuICAvKipcbiAgICogSW52ZXJ0IHJvdGF0aW9uXG4gICAqIEByZXR1cm4ge0wuTWF0cml4fVxuICAgKi9cbiAgZmxpcDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fbWF0cml4WzFdICo9IC0xO1xuICAgIHRoaXMuX21hdHJpeFsyXSAqPSAtMTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge051bWJlcnxMLk1hdHJpeH0gYVxuICAgKiBAcGFyYW0ge051bWJlcn0gYlxuICAgKiBAcGFyYW0ge051bWJlcn0gY1xuICAgKiBAcGFyYW0ge051bWJlcn0gZFxuICAgKiBAcGFyYW0ge051bWJlcn0gZVxuICAgKiBAcGFyYW0ge051bWJlcn0gZlxuICAgKi9cbiAgX2FkZDogZnVuY3Rpb24oYSwgYiwgYywgZCwgZSwgZikge1xuICAgIHZhciByZXN1bHQgPSBbW10sIFtdLCBbXV07XG4gICAgdmFyIHNyYyA9IHRoaXMuX21hdHJpeDtcbiAgICB2YXIgbSA9IFtcbiAgICAgIFtzcmNbMF0sIHNyY1syXSwgc3JjWzRdXSxcbiAgICAgIFtzcmNbMV0sIHNyY1szXSwgc3JjWzVdXSxcbiAgICAgIFsgICAgIDAsICAgICAgMCwgICAgIDFdXG4gICAgXTtcbiAgICB2YXIgb3RoZXIgPSBbXG4gICAgICBbYSwgYywgZV0sXG4gICAgICBbYiwgZCwgZl0sXG4gICAgICBbMCwgMCwgMV1cbiAgICBdLCB2YWw7XG5cblxuICAgIGlmIChhICYmIGEgaW5zdGFuY2VvZiBMLk1hdHJpeCkge1xuICAgICAgc3JjID0gYS5fbWF0cml4O1xuICAgICAgb3RoZXIgPSBbXG4gICAgICAgIFtzcmNbMF0sIHNyY1syXSwgc3JjWzRdXSxcbiAgICAgICAgW3NyY1sxXSwgc3JjWzNdLCBzcmNbNV1dLFxuICAgICAgICBbICAgICAwLCAgICAgIDAsICAgICAxXV07XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgMzsgaisrKSB7XG4gICAgICAgIHZhbCA9IDA7XG4gICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgMzsgaysrKSB7XG4gICAgICAgICAgdmFsICs9IG1baV1ba10gKiBvdGhlcltrXVtqXTtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHRbaV1bal0gPSB2YWw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fbWF0cml4ID0gW1xuICAgICAgcmVzdWx0WzBdWzBdLCByZXN1bHRbMV1bMF0sIHJlc3VsdFswXVsxXSxcbiAgICAgIHJlc3VsdFsxXVsxXSwgcmVzdWx0WzBdWzJdLCByZXN1bHRbMV1bMl1cbiAgICBdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cblxufTtcblxuXG5MLm1hdHJpeCA9IGZ1bmN0aW9uKGEsIGIsIGMsIGQsIGUsIGYpIHtcbiAgcmV0dXJuIG5ldyBMLk1hdHJpeChhLCBiLCBjLCBkLCBlLCBmKTtcbn07XG4iLCIvKipcbiAqIFRleHRCb3hcbiAqXG4gKiBAYXV0aG9yIHJ1bWF4XG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1jb25zb2xlICovXG5cbkwuRWRpdGFibGUuVGV4dEJveEVkaXRvciA9IEwuRWRpdGFibGUuUmVjdGFuZ2xlRWRpdG9yLmV4dGVuZCh7XG5cbiAgb3B0aW9uczoge1xuICAgIHRleHRhcmVhUGFkZGluZzogMVxuICB9LFxuXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtMLk1hcH0gICAgIG1hcFxuICAgKiBAcGFyYW0gIHtMLlRleHRib3h9IGZlYXR1cmVcbiAgICogQHBhcmFtICB7T2JqZWN0PX0gICBvcHRpb25zXG4gICAqL1xuICBpbml0aWFsaXplOiBmdW5jdGlvbihtYXAsIGZlYXR1cmUsIG9wdGlvbnMpIHtcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtIVE1MVGV4dEFyZWFFbGVtZW50fVxuICAgICAqL1xuICAgIHRoaXMuX3RleHRBcmVhID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICovXG4gICAgdGhpcy5fdGV4dCAgICAgPSBudWxsO1xuXG4gICAgTC5FZGl0YWJsZS5SZWN0YW5nbGVFZGl0b3IucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCh0aGlzLCBtYXAsIGZlYXR1cmUsIG9wdGlvbnMpO1xuICB9LFxuXG5cbiAgdXBkYXRlU3R5bGU6IGZ1bmN0aW9uKCkge1xuICAgIGlmIChudWxsICE9PSB0aGlzLl90ZXh0QXJlYSkge1xuICAgICAgdmFyIHN0eWxlICAgPSB0aGlzLl90ZXh0QXJlYS5zdHlsZTtcbiAgICAgIHZhciBvcHRpb25zID0gdGhpcy5mZWF0dXJlLm9wdGlvbnM7XG5cbiAgICAgIHN0eWxlLmZvbnRTaXplICAgPSBvcHRpb25zLmZvbnRTaXplICsgJ3B4JztcbiAgICAgIHN0eWxlLmNvbG9yICAgICAgPSBvcHRpb25zLmZvbnRDb2xvcjtcbiAgICAgIHN0eWxlLmZvbnRGYW1pbHkgPSBvcHRpb25zLmZvbnRGYW1pbHk7XG4gICAgfVxuICB9LFxuXG5cbiAgZW5hYmxlOiBmdW5jdGlvbigpIHtcbiAgICBMLkVkaXRhYmxlLlJlY3RhbmdsZUVkaXRvci5wcm90b3R5cGUuZW5hYmxlLmNhbGwodGhpcyk7XG4gICAgdGhpcy5tYXBcbiAgICAgICAgLm9uKCdkcmFnZW5kJywgdGhpcy5fZm9jdXMsIHRoaXMpXG4gICAgICAgIC5vbignem9vbWFuaW0nLCB0aGlzLl9hbmltYXRlWm9vbSwgdGhpcylcbiAgICAgICAgLm9uKCd6b29tZW5kJywgdGhpcy5fdXBkYXRlVGV4dEFyZWFCb3VuZHMsIHRoaXMpO1xuXG4gICAgaWYgKG51bGwgPT09IHRoaXMuX3RleHRBcmVhKSB7XG4gICAgICB0aGlzLl90ZXh0QXJlYSA9IEwuRG9tVXRpbC5jcmVhdGUoJ3RleHRhcmVhJyxcbiAgICAgICAgJ2xlYWZsZXQtem9vbS1hbmltYXRlZCBsZWFmbGV0LXRleHRib3gnKTtcbiAgICAgIHZhciBzdHlsZSA9IHRoaXMuX3RleHRBcmVhLnN0eWxlOyAvL1RPRE86IFVzZSBjc3NcbiAgICAgIHN0eWxlLnJlc2l6ZSAgICAgICAgICA9ICdub25lJztcbiAgICAgIHN0eWxlLmJvcmRlciAgICAgICAgICA9ICdub25lJztcbiAgICAgIHN0eWxlLnBhZGRpbmcgICAgICAgICA9IHRoaXMub3B0aW9ucy50ZXh0YXJlYVBhZGRpbmcgKyAncHgnO1xuICAgICAgc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJ3RyYW5zcGFyZW50JztcbiAgICAgIHN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG5cbiAgICAgIHRoaXMudXBkYXRlU3R5bGUoKTtcbiAgICAgIHRoaXMubWFwLmdldFBhbmUoJ21hcmtlclBhbmUnKS5hcHBlbmRDaGlsZCh0aGlzLl90ZXh0QXJlYSk7XG5cbiAgICAgIHRoaXMuX3RleHQgPSB0aGlzLmZlYXR1cmUuX3RleHQ7XG4gICAgICBpZiAodGhpcy5fdGV4dCkge1xuICAgICAgICB0aGlzLl90ZXh0QXJlYS5pbm5lckhUTUwgPSB0aGlzLl90ZXh0O1xuICAgICAgfVxuXG4gICAgICBMLkRvbUV2ZW50LmFkZExpc3RlbmVyKHRoaXMuX3RleHRBcmVhLCAna2V5cHJlc3MnLFxuICAgICAgICBMLkRvbUV2ZW50LnN0b3BQcm9wYWdhdGlvbik7XG4gICAgICBMLkRvbUV2ZW50LmRpc2FibGVDbGlja1Byb3BhZ2F0aW9uKHRoaXMuX3RleHRBcmVhKTtcbiAgICAgIHRoaXMuX3VwZGF0ZVRleHRBcmVhQm91bmRzKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZmVhdHVyZS5fdGV4dE5vZGUpIHtcbiAgICAgIHRoaXMuZmVhdHVyZS5fdGV4dE5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmZlYXR1cmUuX3RleHROb2RlKTtcbiAgICAgIHRoaXMuZmVhdHVyZS5fdGV4dE5vZGUgPSBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG5cbiAgc2V0VGV4dDogZnVuY3Rpb24odGV4dCkge1xuICAgIHRoaXMuX3RleHQgPSB0ZXh0O1xuXG4gICAgaWYgKG51bGwgIT09IHRoaXMuX3RleHRBcmVhKSB7XG4gICAgICB0aGlzLl90ZXh0QXJlYS52YWx1ZSA9IHRleHQ7XG4gICAgfVxuICB9LFxuXG5cbiAgZ2V0VGV4dDogZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuX2VuYWJsZWQpIHtcbiAgICAgIHRoaXMuX3RleHQgPSB0aGlzLl90ZXh0QXJlYS52YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3RleHQ7XG4gIH0sXG5cblxuICBkaXNhYmxlOiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5fZW5hYmxlZCkge1xuICAgICAgdGhpcy5tYXBcbiAgICAgICAgLm9mZignZHJhZ2VuZCcsICB0aGlzLl9mb2N1cywgdGhpcylcbiAgICAgICAgLm9mZignem9vbWFuaW0nLCB0aGlzLl9hbmltYXRlWm9vbSwgdGhpcylcbiAgICAgICAgLm9mZignem9vbWVuZCcsICB0aGlzLl91cGRhdGVUZXh0QXJlYUJvdW5kcywgdGhpcyk7XG5cbiAgICAgIGlmIChudWxsICE9PSB0aGlzLl90ZXh0QXJlYSkge1xuICAgICAgICB0aGlzLmdldFRleHQoKTtcbiAgICAgICAgTC5Eb21FdmVudC5yZW1vdmVMaXN0ZW5lcih0aGlzLl90ZXh0QXJlYSwgJ2tleXByZXNzJyxcbiAgICAgICAgICBMLkRvbUV2ZW50LnN0b3BQcm9wYWdhdGlvbik7XG4gICAgICAgIHRoaXMuX3RleHRBcmVhLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5fdGV4dEFyZWEpO1xuICAgICAgICB0aGlzLl90ZXh0QXJlYSA9IG51bGw7XG4gICAgICB9XG4gICAgICB0aGlzLmZlYXR1cmUuX3RleHQgPSB0aGlzLl90ZXh0O1xuXG4gICAgICBpZiAodGhpcy5tYXAuaGFzTGF5ZXIodGhpcy5mZWF0dXJlKSkge1xuICAgICAgICB0aGlzLmZlYXR1cmUuX3JlbmRlclRleHQoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBMLkVkaXRhYmxlLlJlY3RhbmdsZUVkaXRvci5wcm90b3R5cGUuZGlzYWJsZS5jYWxsKHRoaXMpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cblxuICB1cGRhdGVCb3VuZHM6IGZ1bmN0aW9uIChib3VuZHMpIHtcbiAgICBMLkVkaXRhYmxlLlJlY3RhbmdsZUVkaXRvci5wcm90b3R5cGUudXBkYXRlQm91bmRzLmNhbGwodGhpcywgYm91bmRzKTtcbiAgICByZXR1cm4gdGhpcy5fdXBkYXRlVGV4dEFyZWFCb3VuZHMoKTtcbiAgfSxcblxuXG4gIF9mb2N1czogZnVuY3Rpb24oKSB7XG4gICAgTC5VdGlsLnJlcXVlc3RBbmltRnJhbWUoZnVuY3Rpb24oKSB7XG4gICAgICBpZiAobnVsbCAhPT0gdGhpcy5fdGV4dEFyZWEpIHtcbiAgICAgICAgdGhpcy5fdGV4dEFyZWEuZm9jdXMoKTtcbiAgICAgIH1cbiAgICB9LCB0aGlzKTtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBBbmltYXRlZCByZXNpemVcbiAgICogQHBhcmFtICB7RXZlbnR9IGV2dFxuICAgKi9cbiAgX2FuaW1hdGVab29tOiBmdW5jdGlvbihldnQpIHtcbiAgICB2YXIgYm91bmRzID0gdGhpcy5mZWF0dXJlLl9ib3VuZHM7XG4gICAgdmFyIHNjYWxlICA9IHRoaXMuZmVhdHVyZS5fZ2V0U2NhbGUoZXZ0Lnpvb20pO1xuICAgIHZhciBvZmZzZXQgPSB0aGlzLm1hcC5fbGF0TG5nVG9OZXdMYXllclBvaW50KFxuICAgICAgYm91bmRzLmdldE5vcnRoV2VzdCgpLCBldnQuem9vbSwgZXZ0LmNlbnRlcik7XG5cbiAgICBMLkRvbVV0aWwuc2V0VHJhbnNmb3JtKHRoaXMuX3RleHRBcmVhLCBvZmZzZXQsIHNjYWxlLnRvRml4ZWQoMykpO1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIFJlc2l6ZSwgcmVwb3NpdGlvbiBvbiB6b29tIGVuZCBvciByZXNpemVcbiAgICovXG4gIF91cGRhdGVUZXh0QXJlYUJvdW5kczogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNjYWxlO1xuICAgIHZhciBwb3M7XG4gICAgdmFyIHNpemU7XG4gICAgdmFyIGNlbnRlcjtcbiAgICB2YXIgZmVhdHVyZSAgPSB0aGlzLmZlYXR1cmU7XG4gICAgdmFyIGJvdW5kcyAgID0gZmVhdHVyZS5fYm91bmRzO1xuICAgIHZhciB0ZXh0QXJlYSA9IHRoaXMuX3RleHRBcmVhO1xuICAgIHZhciBtYXAgICAgICA9IHRoaXMubWFwO1xuICAgIHZhciBib3VuZHM7XG5cbiAgICBpZiAobnVsbCAhPT0gdGV4dEFyZWEpIHtcbiAgICAgIGlmIChudWxsICE9PSBib3VuZHMpIHtcbiAgICAgICAgc2NhbGUgPSBmZWF0dXJlLl9nZXRTY2FsZShtYXAuZ2V0Wm9vbSgpKTtcbiAgICAgICAgYm91bmRzID0gZmVhdHVyZS5nZXRCb3VuZHMoKTtcbiAgICAgICAgY2VudGVyID0gbWFwLmxhdExuZ1RvTGF5ZXJQb2ludChib3VuZHMuZ2V0Q2VudGVyKCkpO1xuICAgICAgICBwb3MgPSBtYXAubGF0TG5nVG9MYXllclBvaW50KGJvdW5kcy5nZXROb3J0aFdlc3QoKSk7XG4gICAgICAgIHNpemUgPSBMLnBvaW50KDIgKiBNYXRoLmFicyhjZW50ZXIueCAtIHBvcy54KSxcbiAgICAgICAgICAgICAgICAgICAgICAgMiAqIE1hdGguYWJzKGNlbnRlci55IC0gcG9zLnkpKVxuICAgICAgICAgICAgICAgICAuZGl2aWRlQnkoc2NhbGUpXG4gICAgICAgICAgICAgICAgIC5yb3VuZCgpO1xuXG4gICAgICAgIEwuRG9tVXRpbFxuICAgICAgICAgICAuc2V0U2l6ZSh0ZXh0QXJlYSwgc2l6ZSlcbiAgICAgICAgICAgLnNldFRyYW5zZm9ybSh0ZXh0QXJlYSwgcG9zLCBzY2FsZS50b0ZpeGVkKDMpKTtcbiAgICAgICAgdGV4dEFyZWEuc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICB0ZXh0QXJlYS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIHRleHRBcmVhLnNldEF0dHJpYnV0ZSgnc3BlbGxjaGVjaycsIGZhbHNlKTtcblxuICAgICAgICB0aGlzLl9mb2N1cygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGV4dEFyZWEuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG59KTtcblxuXG5MLlRleHRCb3guaW5jbHVkZSh7XG5cbiAgZW5hYmxlRWRpdDogZnVuY3Rpb24obWFwKSB7XG4gICAgaWYgKCF0aGlzLmVkaXRvcikge1xuICAgICAgdGhpcy5jcmVhdGVFZGl0b3IobWFwKTtcbiAgICB9XG4gICAgcmV0dXJuIEwuUmVjdGFuZ2xlLnByb3RvdHlwZS5lbmFibGVFZGl0LmNhbGwodGhpcywgbWFwKTtcbiAgfSxcblxuXG4gIGRpc2FibGVFZGl0OiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5lZGl0b3IpIHtcbiAgICAgIHRoaXMuX3RleHQgPSB0aGlzLmVkaXRvci5nZXRUZXh0KCk7XG4gICAgfVxuXG4gICAgTC5SZWN0YW5nbGUucHJvdG90eXBlLmRpc2FibGVFZGl0LmNhbGwodGhpcyk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuXG4gIGdldEVkaXRvckNsYXNzOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gTC5FZGl0YWJsZS5UZXh0Qm94RWRpdG9yO1xuICB9XG5cbn0pO1xuXG5cbi8qKlxuICogQHBhcmFtICB7QXJyYXkuPExhdExuZz49fSBsYXRsbmdcbiAqIEBwYXJhbSAge09iamVjdD19IG9wdGlvbnNcbiAqIEByZXR1cm4ge0wuVGV4dEJveH1cbiAqL1xuTC5FZGl0YWJsZS5wcm90b3R5cGUuc3RhcnRUZXh0Qm94ID0gZnVuY3Rpb24obGF0bG5nLCBvcHRpb25zKSB7XG4gIHJldHVybiB0aGlzLnN0YXJ0UmVjdGFuZ2xlKG51bGwsIEwuZXh0ZW5kKHtcbiAgICByZWN0YW5nbGVDbGFzczogTC5UZXh0Qm94XG4gIH0sIG9wdGlvbnMpKTtcbn07XG4iLCIvKipcbiAqIFNWRyB0b29sc1xuICpcbiAqIEBhdXRob3IgcnVtYXhcbiAqIEBsaWNlbnNlIE1JVFxuICogQHByZXNlcnZlXG4gKi9cblxudmFyIERFRkFVTFRfU0laRSA9IDEyO1xudmFyIExJTkVfRkFDVE9SICA9IDEuMTI7XG5cbi8qKlxuICogQHBhcmFtICB7U1ZHRWxlbWVudH0gc3ZnXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cbkwuU1ZHLmNhbGNGb250U2l6ZSA9IEwuU1ZHLmNhbGNGb250U2l6ZSB8fCBmdW5jdGlvbihzdmcpIHtcbiAgdmFyIHNpemUgICAgPSBERUZBVUxUX1NJWkU7XG4gIHZhciBzaXplTWluID0gTnVtYmVyLk1BWF9WQUxVRTtcbiAgdmFyIHNpemVNYXggPSBOdW1iZXIuTUlOX1ZBTFVFO1xuICB2YXIgdGV4dHMgICA9IHN2Zy5xdWVyeVNlbGVjdG9yQWxsKCd0ZXh0Jyk7XG4gIHZhciB0ZXh0U2l6ZTtcbiAgdmFyIGZvbnRTaXplQXR0cjtcblxuICBpZiAoMCA8IHRleHRzLmxlbmd0aCkge1xuICAgIHNpemUgPSAwO1xuICAgIGZvciAodmFyIGluZCA9IHRleHRzLmxlbmd0aCAtIDE7IDAgPD0gaW5kOyAtLWluZCkge1xuICAgICAgZm9udFNpemVBdHRyID0gdGV4dHNbaW5kXS5nZXRBdHRyaWJ1dGUoJ2ZvbnQtc2l6ZScpO1xuICAgICAgaWYgKG51bGwgIT09IGZvbnRTaXplQXR0cikge1xuICAgICAgXHR0ZXh0U2l6ZSA9IHBhcnNlRmxvYXQodGV4dHNbaW5kXS5nZXRBdHRyaWJ1dGUoJ2ZvbnQtc2l6ZScpKTtcbiAgICAgIFx0c2l6ZSArPSB0ZXh0U2l6ZTtcbiAgICAgIFx0aWYgKHNpemVNaW4gPiB0ZXh0U2l6ZSkge1xuICAgICAgICAgIHNpemVNaW4gPSB0ZXh0U2l6ZTtcbiAgICAgIFx0fVxuICAgICAgXHRpZiAoc2l6ZU1heCA8IHRleHRTaXplKSB7XG4gICAgICAgICAgc2l6ZU1heCA9IHRleHRTaXplO1xuICAgICAgXHR9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHNpemU6IE1hdGgucm91bmQoc2l6ZSAvIHRleHRzLmxlbmd0aCArIDAuNSksXG4gICAgICBtaW46IE1hdGgucm91bmQoc2l6ZU1pbiArIDAuNSksXG4gICAgICBtYXg6IE51bWJlci5NSU5fVkFMVUUgPT09IHNpemVNYXggPyBzaXplIDogTWF0aC5yb3VuZChzaXplTWF4ICsgMC41KVxuICAgIH07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHNpemU6IHNpemUsXG4gICAgbWluOiBzaXplLFxuICAgIG1heDogc2l6ZVxuICB9O1xufTtcblxuXG5MLlNWRy5pbmNsdWRlKHtcblxuICByZW5kZXJUZXh0OiBmdW5jdGlvbihsYXllcikge1xuICAgIHZhciB0ZXh0RWxlbWVudCA9IGxheWVyLl90ZXh0Tm9kZTtcbiAgICB2YXIgdGV4dCAgPSBsYXllci5fdGV4dDtcblxuICAgIGlmICh0ZXh0RWxlbWVudCkge1xuICAgICAgdGV4dEVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0ZXh0RWxlbWVudCk7XG4gICAgfVxuICAgIHRleHRFbGVtZW50ID0gbGF5ZXIuX3RleHROb2RlID0gTC5TVkcuY3JlYXRlKCd0ZXh0Jyk7XG4gICAgbGF5ZXIudXBkYXRlU3R5bGUoKTtcbiAgICB0aGlzLl9yb290R3JvdXAuYXBwZW5kQ2hpbGQodGV4dEVsZW1lbnQpO1xuXG4gICAgaWYgKHRleHQpIHtcbiAgICAgIHZhciBzY2FsZSA9IGxheWVyLl9nZXRTY2FsZSh0aGlzLl9tYXAuZ2V0Wm9vbSgpKTtcbiAgICAgIHZhciBib3VuZHMgPSBsYXllci5nZXRCb3VuZHMoKTtcbiAgICAgIHZhciBjZW50ZXIgPSBsYXllci5fbWFwLmxhdExuZ1RvTGF5ZXJQb2ludChib3VuZHMuZ2V0Q2VudGVyKCkpO1xuICAgICAgdmFyIHBvcyA9IGxheWVyLl9tYXAubGF0TG5nVG9MYXllclBvaW50KGJvdW5kcy5nZXROb3J0aFdlc3QoKSk7XG4gICAgICB2YXIgc2l6ZSA9IEwucG9pbnQoMiAqIE1hdGguYWJzKGNlbnRlci54IC0gcG9zLngpLFxuICAgICAgICAgICAgICAgICAgICAgICAgIDIgKiBNYXRoLmFicyhjZW50ZXIueSAtIHBvcy55KSkuZGl2aWRlQnkoc2NhbGUpO1xuICAgICAgdmFyIGNoYXJzID0gdGV4dC5zcGxpdCgnJyk7XG4gICAgICB2YXIgbGluZSA9IGNoYXJzLnNoaWZ0KCk7XG4gICAgICB2YXIgY2hhciA9IGNoYXJzLnNoaWZ0KCk7XG4gICAgICB2YXIgbGluZUluZCA9IDE7XG4gICAgICB2YXIgbWF4V2lkdGggPSBzaXplLnggLSBsYXllci5vcHRpb25zLnBhZGRpbmc7XG4gICAgICB2YXIgdHNwYW4gPSB0aGlzLl90ZXh0TWFrZU5leHRMaW5lKHRleHRFbGVtZW50LCBsaW5lLCB7XG4gICAgICAgIHg6IGxheWVyLm9wdGlvbnMucGFkZGluZ1xuICAgICAgfSk7XG4gICAgICB2YXIgbGluZUhlaWdodCA9IHRleHRFbGVtZW50LmdldEJCb3goKS5oZWlnaHQ7XG4gICAgICBjb25zb2xlLmxvZyhsaW5lSGVpZ2h0KTtcbiAgICAgIHRzcGFuLnNldEF0dHJpYnV0ZSgnZHknLCBsaW5lSGVpZ2h0KTtcblxuICAgICAgd2hpbGUgKGNoYXIpIHtcbiAgICAgICAgaWYgKCcgJyA9PT0gY2hhcikge1xuICAgICAgICAgIGxpbmUgKz0gY2hhcjtcbiAgICAgICAgfSBlbHNlIGlmICgnXFxuJyA9PT0gY2hhcikge1xuICAgICAgICAgIGxpbmUgPSAnJztcbiAgICAgICAgICB0c3BhbiA9IHRoaXMuX3RleHRNYWtlTmV4dExpbmUodGV4dEVsZW1lbnQsIGxpbmUsIHtcbiAgICAgICAgICAgIHg6IGxheWVyLm9wdGlvbnMucGFkZGluZyxcbiAgICAgICAgICAgIGR5OiBMSU5FX0ZBQ1RPUiAqIGxpbmVIZWlnaHRcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmICgnXFx0JyAhPT0gY2hhcikgeyAvL3NraXAgdGFic1xuICAgICAgICAgIHZhciBwcmV2TGluZSA9IGxpbmU7XG4gICAgICAgICAgbGluZSArPSBjaGFyO1xuICAgICAgICAgIHRzcGFuLmZpcnN0Q2hpbGQubm9kZVZhbHVlID0gbGluZTtcbiAgICAgICAgICB2YXIgbGluZUxlbmd0aCA9IGxheWVyLm9wdGlvbnMucGFkZGluZyArXG4gICAgICAgICAgICB0c3Bhbi5nZXRDb21wdXRlZFRleHRMZW5ndGgoKTtcblxuICAgICAgICAgIGlmIChsaW5lTGVuZ3RoID4gbWF4V2lkdGggJiYgMSA8PSBsaW5lLmxlbmd0aCkge1xuICAgICAgICAgICAgKytsaW5lSW5kO1xuICAgICAgICAgICAgdHNwYW4uZmlyc3RDaGlsZC5ub2RlVmFsdWUgPSBwcmV2TGluZS5yZXBsYWNlKC9cXHMqJC9nbSwgJycpO1xuICAgICAgICAgICAgcHJldkxpbmUgPSAnJztcbiAgICAgICAgICAgIGxpbmUgPSBjaGFyO1xuICAgICAgICAgICAgdHNwYW4gPSB0aGlzLl90ZXh0TWFrZU5leHRMaW5lKHRleHRFbGVtZW50LCBsaW5lLCB7XG4gICAgICAgICAgICAgIHg6IGxheWVyLm9wdGlvbnMucGFkZGluZyxcbiAgICAgICAgICAgICAgZHk6IExJTkVfRkFDVE9SICogbGluZUhlaWdodFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNoYXIgPSBjaGFycy5zaGlmdCgpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAobnVsbCAhPT0gdGV4dEVsZW1lbnQpIHtcbiAgICAgIHRleHRFbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGV4dEVsZW1lbnQpO1xuICAgICAgdGV4dEVsZW1lbnQgPSBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiB0ZXh0RWxlbWVudDtcbiAgfSxcblxuXG4gIF90ZXh0TWFrZU5leHRMaW5lOiBmdW5jdGlvbihjb250YWluZXIsIHRleHQsIGF0dHJzKSB7XG4gICAgdmFyIHRzcGFuID0gTC5TVkcuY3JlYXRlKCd0c3BhbicpO1xuICAgIHZhciBrZXk7XG5cbiAgICBmb3IgKGtleSBpbiBhdHRycyB8fCB7fSkge1xuICAgICAgaWYgKGF0dHJzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgdHNwYW4uc2V0QXR0cmlidXRlKGtleSwgYXR0cnNba2V5XSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRzcGFuLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQgfHwgJycpKTtcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodHNwYW4pO1xuXG4gICAgcmV0dXJuIHRzcGFuO1xuICB9XG59KTtcbiIsIlxuTC5UZXh0Qm94ID0gTC5SZWN0YW5nbGUuZXh0ZW5kKHtcblxuICBvcHRpb25zOiB7XG4gICAgcGFkZGluZzogMixcbiAgICBmb250U2l6ZTogMTIsXG4gICAgZmlsbE9wYWNpdHk6IDAuNSxcbiAgICBmaWxsQ29sb3I6ICcjZmZmZmZmJyxcbiAgICB3ZWlnaHQ6IDEsXG4gICAgZm9udENvbG9yOiAnJyxcbiAgICBmb250RmFtaWx5OiAnJyxcbiAgICByYXRpbzogMSxcbiAgICB0ZXh0OiAnUGxlYXNlLCBhZGQgdGV4dCdcblxuICAgIC8vVE9ETzogd3JhcEJ5OiAnbGV0dGVyJywgJ2NoYXInLCAnbm93cmFwJywgZXRjLlxuICB9LFxuXG5cbiAgaW5pdGlhbGl6ZTogZnVuY3Rpb24oYm91bmRzLCBvcHRpb25zKSB7XG4gICAgTC5SZWN0YW5nbGUucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCh0aGlzLCBib3VuZHMsIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5fdGV4dCA9IHRoaXMub3B0aW9ucy50ZXh0O1xuICAgIHRoaXMuX3RleHROb2RlID0gbnVsbDtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge09iamVjdH0gc3R5bGVcbiAgICovXG4gIHNldFN0eWxlOiBmdW5jdGlvbihzdHlsZSkge1xuICAgIEwuc2V0T3B0aW9ucyh0aGlzLCBzdHlsZSk7XG5cbiAgICBpZiAodGhpcy5lZGl0b3IgJiYgdGhpcy5lZGl0b3IuX2VuYWJsZWQpIHtcbiAgICAgIHRoaXMuZWRpdG9yLnVwZGF0ZVN0eWxlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3JlbmRlclRleHQoKTtcbiAgICB9XG4gIH0sXG5cblxuICB1cGRhdGVTdHlsZTogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRleHROb2RlID0gdGhpcy5fdGV4dE5vZGU7XG4gICAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgaWYgKG51bGwgIT09IHRleHROb2RlKSB7XG4gICAgICB0ZXh0Tm9kZS5zZXRBdHRyaWJ1dGUoJ2ZvbnQtZmFtaWx5Jywgb3B0aW9ucy5mb250RmFtaWx5KTtcbiAgICAgIHRleHROb2RlLnNldEF0dHJpYnV0ZSgnZm9udC1zaXplJywgb3B0aW9ucy5mb250U2l6ZSArICdweCcpO1xuICAgICAgdGV4dE5vZGUuc2V0QXR0cmlidXRlKCdmaWxsJywgb3B0aW9ucy5mb250Q29sb3IpO1xuICAgIH1cbiAgfSxcblxuXG4gIGdldFRleHQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5fdGV4dE5vZGUpIHtcbiAgICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLl90ZXh0Tm9kZS5jaGlsZE5vZGVzKVxuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgcmV0dXJuIG5vZGUudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSAndHNwYW4nO1xuICAgICAgICB9KVxuICAgICAgICAubWFwKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgdGhpcy5vcHRpb25zLmxpbmVIZWlnaHQgPSBub2RlLmdldEF0dHJpYnV0ZSgnZHknKTtcbiAgICAgICAgICByZXR1cm4gbm9kZS50ZXh0Q29udGVudDtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLl90ZXh0O1xuICAgIH1cbiAgfSxcblxuXG5cbiAgLyoqXG4gICAqIEBwYXJhbSAge0wuTWFwfSBtYXBcbiAgICovXG4gIG9uUmVtb3ZlOiBmdW5jdGlvbihtYXApIHtcbiAgICBpZiAobnVsbCAhPT0gdGhpcy5fdGV4dE5vZGUpIHtcbiAgICAgIGlmIChudWxsICE9PSB0aGlzLl90ZXh0Tm9kZS5wYXJlbnROb2RlKSB7XG4gICAgICAgIHRoaXMuX3RleHROb2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5fdGV4dE5vZGUpO1xuICAgICAgfVxuICAgICAgdGhpcy5fdGV4dE5vZGUgPSBudWxsO1xuICAgIH1cbiAgICBMLlJlY3RhbmdsZS5wcm90b3R5cGUub25SZW1vdmUuY2FsbCh0aGlzLCBtYXApO1xuICB9LFxuXG5cbiAgX3JlbmRlclRleHQ6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9yZW5kZXJlcikge1xuICAgICAgdGhpcy5fdGV4dE5vZGUgPSB0aGlzLl9yZW5kZXJlci5yZW5kZXJUZXh0KHRoaXMpO1xuICAgICAgdGhpcy5fcGF0aC5wYXJlbnROb2RlXG4gICAgICAgICAgLmluc2VydEJlZm9yZSh0aGlzLl90ZXh0Tm9kZSwgdGhpcy5fcGF0aC5uZXh0U2libGluZyk7XG4gICAgICB0aGlzLnVwZGF0ZVN0eWxlKCk7XG4gICAgICB0aGlzLl91cGRhdGVQb3NpdGlvbigpO1xuICAgIH1cbiAgfSxcblxuXG4gIF91cGRhdGVQb3NpdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgaWYgKG51bGwgIT09IHRoaXMuX3RleHROb2RlKSB7XG4gICAgICB2YXIgYm91bmRzID0gdGhpcy5nZXRCb3VuZHMoKTtcbiAgICAgIHZhciBwb3MgPSB0aGlzLl9tYXAubGF0TG5nVG9MYXllclBvaW50KGJvdW5kcy5nZXROb3J0aFdlc3QoKSk7XG4gICAgICB2YXIgdGV4dE1hdHJpeCA9IG5ldyBMLk1hdHJpeCgxLCAwLCAwLCAxLCAwLCAwKVxuICAgICAgICAudHJhbnNsYXRlKHBvcylcbiAgICAgICAgLnNjYWxlKHRoaXMuX2dldFNjYWxlKHRoaXMuX21hcC5nZXRab29tKCkpKTtcbiAgICAgIHRoaXMuX3RleHROb2RlLnNldEF0dHJpYnV0ZSgndHJhbnNmb3JtJyxcbiAgICAgICAgJ21hdHJpeCgnICsgdGV4dE1hdHJpeC5fbWF0cml4LmpvaW4oJyAnKSArICcpJyk7XG4gICAgfVxuICB9LFxuXG5cbiAgX2dldFNjYWxlOiBmdW5jdGlvbih6b29tKSB7XG4gICAgcmV0dXJuICh0aGlzLl9tYXAgP1xuICAgICAgTWF0aC5wb3coMiwgem9vbSkgKiB0aGlzLm9wdGlvbnMucmF0aW8gOiAxKTtcbiAgfSxcblxuXG4gIF91cGRhdGVQYXRoOiBmdW5jdGlvbigpIHtcbiAgICBMLlJlY3RhbmdsZS5wcm90b3R5cGUuX3VwZGF0ZVBhdGguY2FsbCh0aGlzKTtcbiAgICB0aGlzLl91cGRhdGVQb3NpdGlvbigpO1xuICB9LFxuXG5cbiAgdG9HZW9KU09OOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGdqID0gTC5SZWN0YW5nbGUucHJvdG90eXBlLnRvR2VvSlNPTi5jYWxsKHRoaXMpO1xuICAgIGdqLnByb3BlcnRpZXMudGV4dCA9IHRoaXMuX3RleHQ7XG4gIH1cblxufSk7XG4iLCIvKipcbiAqIEBwYXJhbSAge0VsZW1lbnR9IGVsZW1lbnRcbiAqIEBwYXJhbSAge0wuUG9pbnR9IHNpemVcbiAqIEByZXR1cm4ge09iamVjdH0gc2VsZlxuICovXG5MLkRvbVV0aWwuc2V0U2l6ZSA9ICBMLkRvbVV0aWwuc2V0U2l6ZSB8fCBmdW5jdGlvbihlbGVtZW50LCBzaXplKSB7XG4gIGVsZW1lbnQuc3R5bGUud2lkdGggPSBzaXplLnggICsgJ3B4JztcbiAgZWxlbWVudC5zdHlsZS5oZWlnaHQgPSBzaXplLnkgKyAncHgnO1xuICByZXR1cm4gdGhpcztcbn07XG4iXX0=
