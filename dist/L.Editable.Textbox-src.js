(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g=(g.L||(g.L = {}));g=(g.Editable||(g.Editable = {}));g.Textbox = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var L = require('leaflet');
require('leaflet-editable');
require('leaflet-path-transform/src/Matrix');
require('./src/Textbox');
require('./src/Util');
require('./src/Editable.Textbox')

module.exports = L.Editable.TextBox;

},{"./src/Editable.Textbox":3,"./src/Textbox":4,"./src/Util":5,"leaflet":undefined,"leaflet-editable":undefined,"leaflet-path-transform/src/Matrix":2}],2:[function(require,module,exports){
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
      var style = this._textArea.style;
      style.resize          = 'none';
      style.border          = 'none';
      style.padding         = this.options.textareaPadding + 'px';
      style.backgroundColor = 'transparent';

      this.updateStyle();
      this.map.getPane('markerPane').appendChild(this._textArea);

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
        .off('dragend',  this._focus, this)
        .off('zoomanim', this._animateZoom, this)
        .off('zoomend',  this._updateTextAreaBounds, this);

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
    var scale, latlngs, pos, size;
    var feature  = this.feature;
    var bounds   = feature._bounds;
    var textArea = this._textArea;
    var map      = this.map;

    if (null !== textArea) {
      if (null !== bounds) {
        scale = feature._getScale(map.getZoom());
        latlngs = feature._boundsToLatLngs(bounds);
        pos = map.latLngToLayerPoint(latlngs[1]);
        size = map.latLngToLayerPoint(latlngs[3]).subtract(pos);
        L.DomUtil
           .setSize(textArea, size.divideBy(scale).round())
           .setTransform(textArea, pos, scale.toFixed(3));
        textArea.style.display = '';
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
    var ret = L.Rectangle.prototype.enableEdit.call(this, map);

    if (this._textNode) {
      this._textNode.parentNode.removeChild(this._textNode);
      this._textNode = null;
    }

    ret = L.Rectangle.prototype.enableEdit.call(this, map);
    this.editor.setText(this._text);

    return ret;
  },


  disableEdit: function() {
    if (this.editor) {
      this._text = this.editor.getText();
    }

    L.Rectangle.prototype.disableEdit.call(this);
    this._renderText();

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

L.TextBox = L.Rectangle.extend({

  _text: 'Please, add text',
  _textNode: null,

  options: {
    padding: 2,
    fontSize: 12,
    fillOpacity: 0.5,
    fillColor: '#ffffff',
    weight: 1,
    fontColor: '',
    fontFamily: '',
    ratio: 1
    //TODO: wrapBy: 'letter', 'char', 'nowrap', etc.
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

},{}],5:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9sZWFmbGV0LXBhdGgtdHJhbnNmb3JtL3NyYy9NYXRyaXguanMiLCJzcmMvRWRpdGFibGUuVGV4dGJveC5qcyIsInNyYy9UZXh0Ym94LmpzIiwic3JjL1V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBMID0gcmVxdWlyZSgnbGVhZmxldCcpO1xucmVxdWlyZSgnbGVhZmxldC1lZGl0YWJsZScpO1xucmVxdWlyZSgnbGVhZmxldC1wYXRoLXRyYW5zZm9ybS9zcmMvTWF0cml4Jyk7XG5yZXF1aXJlKCcuL3NyYy9UZXh0Ym94Jyk7XG5yZXF1aXJlKCcuL3NyYy9VdGlsJyk7XG5yZXF1aXJlKCcuL3NyYy9FZGl0YWJsZS5UZXh0Ym94JylcblxubW9kdWxlLmV4cG9ydHMgPSBMLkVkaXRhYmxlLlRleHRCb3g7XG4iLCIvKipcbiAqIEBjbGFzcyAgTC5NYXRyaXhcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gYVxuICogQHBhcmFtIHtOdW1iZXJ9IGJcbiAqIEBwYXJhbSB7TnVtYmVyfSBjXG4gKiBAcGFyYW0ge051bWJlcn0gZFxuICogQHBhcmFtIHtOdW1iZXJ9IGVcbiAqIEBwYXJhbSB7TnVtYmVyfSBmXG4gKi9cbkwuTWF0cml4ID0gZnVuY3Rpb24oYSwgYiwgYywgZCwgZSwgZikge1xuXG4gIC8qKlxuICAgKiBAdHlwZSB7QXJyYXkuPE51bWJlcj59XG4gICAqL1xuICB0aGlzLl9tYXRyaXggPSBbYSwgYiwgYywgZCwgZSwgZl07XG59O1xuXG5cbkwuTWF0cml4LnByb3RvdHlwZSA9IHtcblxuXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtMLlBvaW50fSBwb2ludFxuICAgKiBAcmV0dXJuIHtMLlBvaW50fVxuICAgKi9cbiAgdHJhbnNmb3JtOiBmdW5jdGlvbihwb2ludCkge1xuICAgIHJldHVybiB0aGlzLl90cmFuc2Zvcm0ocG9pbnQuY2xvbmUoKSk7XG4gIH0sXG5cblxuICAvKipcbiAgICogRGVzdHJ1Y3RpdmVcbiAgICpcbiAgICogWyB4IF0gPSBbIGEgIGIgIHR4IF0gWyB4IF0gPSBbIGEgKiB4ICsgYiAqIHkgKyB0eCBdXG4gICAqIFsgeSBdID0gWyBjICBkICB0eSBdIFsgeSBdID0gWyBjICogeCArIGQgKiB5ICsgdHkgXVxuICAgKlxuICAgKiBAcGFyYW0gIHtMLlBvaW50fSBwb2ludFxuICAgKiBAcmV0dXJuIHtMLlBvaW50fVxuICAgKi9cbiAgX3RyYW5zZm9ybTogZnVuY3Rpb24ocG9pbnQpIHtcbiAgICB2YXIgbWF0cml4ID0gdGhpcy5fbWF0cml4O1xuICAgIHZhciB4ID0gcG9pbnQueCwgeSA9IHBvaW50Lnk7XG4gICAgcG9pbnQueCA9IG1hdHJpeFswXSAqIHggKyBtYXRyaXhbMV0gKiB5ICsgbWF0cml4WzRdO1xuICAgIHBvaW50LnkgPSBtYXRyaXhbMl0gKiB4ICsgbWF0cml4WzNdICogeSArIG1hdHJpeFs1XTtcbiAgICByZXR1cm4gcG9pbnQ7XG4gIH0sXG5cblxuICAvKipcbiAgICogQHBhcmFtICB7TC5Qb2ludH0gcG9pbnRcbiAgICogQHJldHVybiB7TC5Qb2ludH1cbiAgICovXG4gIHVudHJhbnNmb3JtOiBmdW5jdGlvbiAocG9pbnQpIHtcbiAgICB2YXIgbWF0cml4ID0gdGhpcy5fbWF0cml4O1xuICAgIHJldHVybiBuZXcgTC5Qb2ludChcbiAgICAgIChwb2ludC54IC8gbWF0cml4WzBdIC0gbWF0cml4WzRdKSAvIG1hdHJpeFswXSxcbiAgICAgIChwb2ludC55IC8gbWF0cml4WzJdIC0gbWF0cml4WzVdKSAvIG1hdHJpeFsyXVxuICAgICk7XG4gIH0sXG5cblxuICAvKipcbiAgICogQHJldHVybiB7TC5NYXRyaXh9XG4gICAqL1xuICBjbG9uZTogZnVuY3Rpb24oKSB7XG4gICAgdmFyIG1hdHJpeCA9IHRoaXMuX21hdHJpeDtcbiAgICByZXR1cm4gbmV3IEwuTWF0cml4KFxuICAgICAgbWF0cml4WzBdLCBtYXRyaXhbMV0sIG1hdHJpeFsyXSxcbiAgICAgIG1hdHJpeFszXSwgbWF0cml4WzRdLCBtYXRyaXhbNV1cbiAgICApO1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7TC5Qb2ludD18TnVtYmVyPX0gdHJhbnNsYXRlXG4gICAqIEByZXR1cm4ge0wuTWF0cml4fEwuUG9pbnR9XG4gICAqL1xuICB0cmFuc2xhdGU6IGZ1bmN0aW9uKHRyYW5zbGF0ZSkge1xuICAgIGlmICh0cmFuc2xhdGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIG5ldyBMLlBvaW50KHRoaXMuX21hdHJpeFs0XSwgdGhpcy5fbWF0cml4WzVdKTtcbiAgICB9XG5cbiAgICB2YXIgdHJhbnNsYXRlWCwgdHJhbnNsYXRlWTtcbiAgICBpZiAodHlwZW9mIHRyYW5zbGF0ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIHRyYW5zbGF0ZVggPSB0cmFuc2xhdGVZID0gdHJhbnNsYXRlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0cmFuc2xhdGVYID0gdHJhbnNsYXRlLng7XG4gICAgICB0cmFuc2xhdGVZID0gdHJhbnNsYXRlLnk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX2FkZCgxLCAwLCAwLCAxLCB0cmFuc2xhdGVYLCB0cmFuc2xhdGVZKTtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0wuUG9pbnQ9fE51bWJlcj19IHNjYWxlXG4gICAqIEByZXR1cm4ge0wuTWF0cml4fEwuUG9pbnR9XG4gICAqL1xuICBzY2FsZTogZnVuY3Rpb24oc2NhbGUsIG9yaWdpbikge1xuICAgIGlmIChzY2FsZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gbmV3IEwuUG9pbnQodGhpcy5fbWF0cml4WzBdLCB0aGlzLl9tYXRyaXhbM10pO1xuICAgIH1cblxuICAgIHZhciBzY2FsZVgsIHNjYWxlWTtcbiAgICBvcmlnaW4gPSBvcmlnaW4gfHwgTC5wb2ludCgwLCAwKTtcbiAgICBpZiAodHlwZW9mIHNjYWxlID09PSAnbnVtYmVyJykge1xuICAgICAgc2NhbGVYID0gc2NhbGVZID0gc2NhbGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNjYWxlWCA9IHNjYWxlLng7XG4gICAgICBzY2FsZVkgPSBzY2FsZS55O1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzXG4gICAgICAuX2FkZChzY2FsZVgsIDAsIDAsIHNjYWxlWSwgb3JpZ2luLngsIG9yaWdpbi55KVxuICAgICAgLl9hZGQoMSwgMCwgMCwgMSwgLW9yaWdpbi54LCAtb3JpZ2luLnkpO1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIG0wMCAgbTAxICB4IC0gbTAwICogeCAtIG0wMSAqIHlcbiAgICogbTEwICBtMTEgIHkgLSBtMTAgKiB4IC0gbTExICogeVxuICAgKiBAcGFyYW0ge051bWJlcn0gICBhbmdsZVxuICAgKiBAcGFyYW0ge0wuUG9pbnQ9fSBvcmlnaW5cbiAgICogQHJldHVybiB7TC5NYXRyaXh9XG4gICAqL1xuICByb3RhdGU6IGZ1bmN0aW9uKGFuZ2xlLCBvcmlnaW4pIHtcbiAgICB2YXIgY29zID0gTWF0aC5jb3MoYW5nbGUpO1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbihhbmdsZSk7XG5cbiAgICBvcmlnaW4gPSBvcmlnaW4gfHwgbmV3IEwuUG9pbnQoMCwgMCk7XG5cbiAgICByZXR1cm4gdGhpc1xuICAgICAgLl9hZGQoY29zLCBzaW4sIC1zaW4sIGNvcywgb3JpZ2luLngsIG9yaWdpbi55KVxuICAgICAgLl9hZGQoMSwgMCwgMCwgMSwgLW9yaWdpbi54LCAtb3JpZ2luLnkpO1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIEludmVydCByb3RhdGlvblxuICAgKiBAcmV0dXJuIHtMLk1hdHJpeH1cbiAgICovXG4gIGZsaXA6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX21hdHJpeFsxXSAqPSAtMTtcbiAgICB0aGlzLl9tYXRyaXhbMl0gKj0gLTE7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cblxuICAvKipcbiAgICogQHBhcmFtIHtOdW1iZXJ8TC5NYXRyaXh9IGFcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGJcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGNcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGRcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGVcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGZcbiAgICovXG4gIF9hZGQ6IGZ1bmN0aW9uKGEsIGIsIGMsIGQsIGUsIGYpIHtcbiAgICB2YXIgcmVzdWx0ID0gW1tdLCBbXSwgW11dO1xuICAgIHZhciBzcmMgPSB0aGlzLl9tYXRyaXg7XG4gICAgdmFyIG0gPSBbXG4gICAgICBbc3JjWzBdLCBzcmNbMl0sIHNyY1s0XV0sXG4gICAgICBbc3JjWzFdLCBzcmNbM10sIHNyY1s1XV0sXG4gICAgICBbICAgICAwLCAgICAgIDAsICAgICAxXVxuICAgIF07XG4gICAgdmFyIG90aGVyID0gW1xuICAgICAgW2EsIGMsIGVdLFxuICAgICAgW2IsIGQsIGZdLFxuICAgICAgWzAsIDAsIDFdXG4gICAgXSwgdmFsO1xuXG5cbiAgICBpZiAoYSAmJiBhIGluc3RhbmNlb2YgTC5NYXRyaXgpIHtcbiAgICAgIHNyYyA9IGEuX21hdHJpeDtcbiAgICAgIG90aGVyID0gW1xuICAgICAgICBbc3JjWzBdLCBzcmNbMl0sIHNyY1s0XV0sXG4gICAgICAgIFtzcmNbMV0sIHNyY1szXSwgc3JjWzVdXSxcbiAgICAgICAgWyAgICAgMCwgICAgICAwLCAgICAgMV1dO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IDM7IGorKykge1xuICAgICAgICB2YWwgPSAwO1xuICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IDM7IGsrKykge1xuICAgICAgICAgIHZhbCArPSBtW2ldW2tdICogb3RoZXJba11bal07XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0W2ldW2pdID0gdmFsO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX21hdHJpeCA9IFtcbiAgICAgIHJlc3VsdFswXVswXSwgcmVzdWx0WzFdWzBdLCByZXN1bHRbMF1bMV0sXG4gICAgICByZXN1bHRbMV1bMV0sIHJlc3VsdFswXVsyXSwgcmVzdWx0WzFdWzJdXG4gICAgXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG5cbn07XG5cblxuTC5tYXRyaXggPSBmdW5jdGlvbihhLCBiLCBjLCBkLCBlLCBmKSB7XG4gIHJldHVybiBuZXcgTC5NYXRyaXgoYSwgYiwgYywgZCwgZSwgZik7XG59O1xuIiwiLyoqXG4gKiBUZXh0Qm94XG4gKlxuICogQGF1dGhvciBydW1heFxuICogQGxpY2Vuc2UgTUlUXG4gKi9cblxuLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuXG5MLkVkaXRhYmxlLlRleHRCb3hFZGl0b3IgPSBMLkVkaXRhYmxlLlJlY3RhbmdsZUVkaXRvci5leHRlbmQoe1xuXG4gIG9wdGlvbnM6IHtcbiAgICB0ZXh0YXJlYVBhZGRpbmc6IDFcbiAgfSxcblxuICAvKipcbiAgICogQHBhcmFtICB7TC5NYXB9ICAgICBtYXBcbiAgICogQHBhcmFtICB7TC5UZXh0Ym94fSBmZWF0dXJlXG4gICAqIEBwYXJhbSAge09iamVjdD19ICAgb3B0aW9uc1xuICAgKi9cbiAgaW5pdGlhbGl6ZTogZnVuY3Rpb24obWFwLCBmZWF0dXJlLCBvcHRpb25zKSB7XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7SFRNTFRleHRBcmVhRWxlbWVudH1cbiAgICAgKi9cbiAgICB0aGlzLl90ZXh0QXJlYSA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAqL1xuICAgIHRoaXMuX3RleHQgICAgID0gbnVsbDtcblxuICAgIEwuRWRpdGFibGUuUmVjdGFuZ2xlRWRpdG9yLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcywgbWFwLCBmZWF0dXJlLCBvcHRpb25zKTtcbiAgfSxcblxuXG4gIHVwZGF0ZVN0eWxlOiBmdW5jdGlvbigpIHtcbiAgICBpZiAobnVsbCAhPT0gdGhpcy5fdGV4dEFyZWEpIHtcbiAgICAgIHZhciBzdHlsZSAgID0gdGhpcy5fdGV4dEFyZWEuc3R5bGU7XG4gICAgICB2YXIgb3B0aW9ucyA9IHRoaXMuZmVhdHVyZS5vcHRpb25zO1xuXG4gICAgICBzdHlsZS5mb250U2l6ZSAgID0gb3B0aW9ucy5mb250U2l6ZSArICdweCc7XG4gICAgICBzdHlsZS5jb2xvciAgICAgID0gb3B0aW9ucy5mb250Q29sb3I7XG4gICAgICBzdHlsZS5mb250RmFtaWx5ID0gb3B0aW9ucy5mb250RmFtaWx5O1xuICAgIH1cbiAgfSxcblxuXG4gIGVuYWJsZTogZnVuY3Rpb24oKSB7XG4gICAgTC5FZGl0YWJsZS5SZWN0YW5nbGVFZGl0b3IucHJvdG90eXBlLmVuYWJsZS5jYWxsKHRoaXMpO1xuICAgIHRoaXMubWFwXG4gICAgICAgIC5vbignZHJhZ2VuZCcsIHRoaXMuX2ZvY3VzLCB0aGlzKVxuICAgICAgICAub24oJ3pvb21hbmltJywgdGhpcy5fYW5pbWF0ZVpvb20sIHRoaXMpXG4gICAgICAgIC5vbignem9vbWVuZCcsIHRoaXMuX3VwZGF0ZVRleHRBcmVhQm91bmRzLCB0aGlzKTtcblxuICAgIGlmIChudWxsID09PSB0aGlzLl90ZXh0QXJlYSkge1xuICAgICAgdGhpcy5fdGV4dEFyZWEgPSBMLkRvbVV0aWwuY3JlYXRlKCd0ZXh0YXJlYScsXG4gICAgICAgICdsZWFmbGV0LXpvb20tYW5pbWF0ZWQgbGVhZmxldC10ZXh0Ym94Jyk7XG4gICAgICB2YXIgc3R5bGUgPSB0aGlzLl90ZXh0QXJlYS5zdHlsZTtcbiAgICAgIHN0eWxlLnJlc2l6ZSAgICAgICAgICA9ICdub25lJztcbiAgICAgIHN0eWxlLmJvcmRlciAgICAgICAgICA9ICdub25lJztcbiAgICAgIHN0eWxlLnBhZGRpbmcgICAgICAgICA9IHRoaXMub3B0aW9ucy50ZXh0YXJlYVBhZGRpbmcgKyAncHgnO1xuICAgICAgc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJ3RyYW5zcGFyZW50JztcblxuICAgICAgdGhpcy51cGRhdGVTdHlsZSgpO1xuICAgICAgdGhpcy5tYXAuZ2V0UGFuZSgnbWFya2VyUGFuZScpLmFwcGVuZENoaWxkKHRoaXMuX3RleHRBcmVhKTtcblxuICAgICAgaWYgKHRoaXMuX3RleHQpIHtcbiAgICAgICAgdGhpcy5fdGV4dEFyZWEuaW5uZXJIVE1MID0gdGhpcy5fdGV4dDtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fdXBkYXRlVGV4dEFyZWFCb3VuZHMoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuXG4gIHNldFRleHQ6IGZ1bmN0aW9uKHRleHQpIHtcbiAgICB0aGlzLl90ZXh0ID0gdGV4dDtcblxuICAgIGlmIChudWxsICE9PSB0aGlzLl90ZXh0QXJlYSkge1xuICAgICAgdGhpcy5fdGV4dEFyZWEudmFsdWUgPSB0ZXh0O1xuICAgIH1cbiAgfSxcblxuXG4gIGdldFRleHQ6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX3RleHQgPSB0aGlzLl90ZXh0QXJlYS52YWx1ZTtcbiAgICByZXR1cm4gdGhpcy5fdGV4dDtcbiAgfSxcblxuXG4gIGRpc2FibGU6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9lbmFibGVkKSB7XG4gICAgICB0aGlzLm1hcFxuICAgICAgICAub2ZmKCdkcmFnZW5kJywgIHRoaXMuX2ZvY3VzLCB0aGlzKVxuICAgICAgICAub2ZmKCd6b29tYW5pbScsIHRoaXMuX2FuaW1hdGVab29tLCB0aGlzKVxuICAgICAgICAub2ZmKCd6b29tZW5kJywgIHRoaXMuX3VwZGF0ZVRleHRBcmVhQm91bmRzLCB0aGlzKTtcblxuICAgICAgaWYgKG51bGwgIT09IHRoaXMudGV4dEFyZWEpIHtcbiAgICAgICAgdGhpcy5nZXRUZXh0KCk7XG4gICAgICAgIHRoaXMuX3RleHRBcmVhLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5fdGV4dEFyZWEpO1xuICAgICAgICB0aGlzLl90ZXh0QXJlYSA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgTC5FZGl0YWJsZS5SZWN0YW5nbGVFZGl0b3IucHJvdG90eXBlLmRpc2FibGUuY2FsbCh0aGlzKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG5cbiAgdXBkYXRlQm91bmRzOiBmdW5jdGlvbiAoYm91bmRzKSB7XG4gICAgTC5FZGl0YWJsZS5SZWN0YW5nbGVFZGl0b3IucHJvdG90eXBlLnVwZGF0ZUJvdW5kcy5jYWxsKHRoaXMsIGJvdW5kcyk7XG4gICAgcmV0dXJuIHRoaXMuX3VwZGF0ZVRleHRBcmVhQm91bmRzKCk7XG4gIH0sXG5cblxuICBfZm9jdXM6IGZ1bmN0aW9uKCkge1xuICAgIGlmIChudWxsICE9PSB0aGlzLl90ZXh0QXJlYSkge1xuICAgICAgTC5VdGlsLnJlcXVlc3RBbmltRnJhbWUoZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3RleHRBcmVhLmZvY3VzKCk7XG4gICAgICB9LCB0aGlzKTtcbiAgICB9XG4gIH0sXG5cblxuICAvKipcbiAgICogQW5pbWF0ZWQgcmVzaXplXG4gICAqIEBwYXJhbSAge0V2ZW50fSBldnRcbiAgICovXG4gIF9hbmltYXRlWm9vbTogZnVuY3Rpb24oZXZ0KSB7XG4gICAgdmFyIGJvdW5kcyA9IHRoaXMuZmVhdHVyZS5fYm91bmRzO1xuICAgIHZhciBzY2FsZSAgPSB0aGlzLmZlYXR1cmUuX2dldFNjYWxlKGV2dC56b29tKTtcbiAgICB2YXIgb2Zmc2V0ID0gdGhpcy5tYXAuX2xhdExuZ1RvTmV3TGF5ZXJQb2ludChcbiAgICAgIGJvdW5kcy5nZXROb3J0aFdlc3QoKSwgZXZ0Lnpvb20sIGV2dC5jZW50ZXIpO1xuXG4gICAgTC5Eb21VdGlsLnNldFRyYW5zZm9ybSh0aGlzLl90ZXh0QXJlYSwgb2Zmc2V0LCBzY2FsZS50b0ZpeGVkKDMpKTtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBSZXNpemUsIHJlcG9zaXRpb24gb24gem9vbSBlbmQgb3IgcmVzaXplXG4gICAqL1xuICBfdXBkYXRlVGV4dEFyZWFCb3VuZHM6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzY2FsZSwgbGF0bG5ncywgcG9zLCBzaXplO1xuICAgIHZhciBmZWF0dXJlICA9IHRoaXMuZmVhdHVyZTtcbiAgICB2YXIgYm91bmRzICAgPSBmZWF0dXJlLl9ib3VuZHM7XG4gICAgdmFyIHRleHRBcmVhID0gdGhpcy5fdGV4dEFyZWE7XG4gICAgdmFyIG1hcCAgICAgID0gdGhpcy5tYXA7XG5cbiAgICBpZiAobnVsbCAhPT0gdGV4dEFyZWEpIHtcbiAgICAgIGlmIChudWxsICE9PSBib3VuZHMpIHtcbiAgICAgICAgc2NhbGUgPSBmZWF0dXJlLl9nZXRTY2FsZShtYXAuZ2V0Wm9vbSgpKTtcbiAgICAgICAgbGF0bG5ncyA9IGZlYXR1cmUuX2JvdW5kc1RvTGF0TG5ncyhib3VuZHMpO1xuICAgICAgICBwb3MgPSBtYXAubGF0TG5nVG9MYXllclBvaW50KGxhdGxuZ3NbMV0pO1xuICAgICAgICBzaXplID0gbWFwLmxhdExuZ1RvTGF5ZXJQb2ludChsYXRsbmdzWzNdKS5zdWJ0cmFjdChwb3MpO1xuICAgICAgICBMLkRvbVV0aWxcbiAgICAgICAgICAgLnNldFNpemUodGV4dEFyZWEsIHNpemUuZGl2aWRlQnkoc2NhbGUpLnJvdW5kKCkpXG4gICAgICAgICAgIC5zZXRUcmFuc2Zvcm0odGV4dEFyZWEsIHBvcywgc2NhbGUudG9GaXhlZCgzKSk7XG4gICAgICAgIHRleHRBcmVhLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgdGV4dEFyZWEuc2V0QXR0cmlidXRlKCdzcGVsbGNoZWNrJywgZmFsc2UpO1xuICAgICAgICB0aGlzLl9mb2N1cygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGV4dEFyZWEuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG59KTtcblxuXG5MLlRleHRCb3guaW5jbHVkZSh7XG5cbiAgZW5hYmxlRWRpdDogZnVuY3Rpb24obWFwKSB7XG4gICAgaWYgKCF0aGlzLmVkaXRvcikge1xuICAgICAgdGhpcy5jcmVhdGVFZGl0b3IobWFwKTtcbiAgICB9XG4gICAgdmFyIHJldCA9IEwuUmVjdGFuZ2xlLnByb3RvdHlwZS5lbmFibGVFZGl0LmNhbGwodGhpcywgbWFwKTtcblxuICAgIGlmICh0aGlzLl90ZXh0Tm9kZSkge1xuICAgICAgdGhpcy5fdGV4dE5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLl90ZXh0Tm9kZSk7XG4gICAgICB0aGlzLl90ZXh0Tm9kZSA9IG51bGw7XG4gICAgfVxuXG4gICAgcmV0ID0gTC5SZWN0YW5nbGUucHJvdG90eXBlLmVuYWJsZUVkaXQuY2FsbCh0aGlzLCBtYXApO1xuICAgIHRoaXMuZWRpdG9yLnNldFRleHQodGhpcy5fdGV4dCk7XG5cbiAgICByZXR1cm4gcmV0O1xuICB9LFxuXG5cbiAgZGlzYWJsZUVkaXQ6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLmVkaXRvcikge1xuICAgICAgdGhpcy5fdGV4dCA9IHRoaXMuZWRpdG9yLmdldFRleHQoKTtcbiAgICB9XG5cbiAgICBMLlJlY3RhbmdsZS5wcm90b3R5cGUuZGlzYWJsZUVkaXQuY2FsbCh0aGlzKTtcbiAgICB0aGlzLl9yZW5kZXJUZXh0KCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuXG4gIGdldEVkaXRvckNsYXNzOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gTC5FZGl0YWJsZS5UZXh0Qm94RWRpdG9yO1xuICB9XG5cbn0pO1xuXG5cbi8qKlxuICogQHBhcmFtICB7QXJyYXkuPExhdExuZz49fSBsYXRsbmdcbiAqIEBwYXJhbSAge09iamVjdD19IG9wdGlvbnNcbiAqIEByZXR1cm4ge0wuVGV4dEJveH1cbiAqL1xuTC5FZGl0YWJsZS5wcm90b3R5cGUuc3RhcnRUZXh0Qm94ID0gZnVuY3Rpb24obGF0bG5nLCBvcHRpb25zKSB7XG4gIHJldHVybiB0aGlzLnN0YXJ0UmVjdGFuZ2xlKG51bGwsIEwuZXh0ZW5kKHtcbiAgICByZWN0YW5nbGVDbGFzczogTC5UZXh0Qm94XG4gIH0sIG9wdGlvbnMpKTtcbn07XG4iLCJcbkwuVGV4dEJveCA9IEwuUmVjdGFuZ2xlLmV4dGVuZCh7XG5cbiAgX3RleHQ6ICdQbGVhc2UsIGFkZCB0ZXh0JyxcbiAgX3RleHROb2RlOiBudWxsLFxuXG4gIG9wdGlvbnM6IHtcbiAgICBwYWRkaW5nOiAyLFxuICAgIGZvbnRTaXplOiAxMixcbiAgICBmaWxsT3BhY2l0eTogMC41LFxuICAgIGZpbGxDb2xvcjogJyNmZmZmZmYnLFxuICAgIHdlaWdodDogMSxcbiAgICBmb250Q29sb3I6ICcnLFxuICAgIGZvbnRGYW1pbHk6ICcnLFxuICAgIHJhdGlvOiAxXG4gICAgLy9UT0RPOiB3cmFwQnk6ICdsZXR0ZXInLCAnY2hhcicsICdub3dyYXAnLCBldGMuXG4gIH0sXG5cblxuICAvKipcbiAgICogQHBhcmFtIHtPYmplY3R9IHN0eWxlXG4gICAqL1xuICBzZXRTdHlsZTogZnVuY3Rpb24oc3R5bGUpIHtcbiAgICBMLnNldE9wdGlvbnModGhpcywgc3R5bGUpO1xuXG4gICAgaWYgKHRoaXMuZWRpdG9yICYmIHRoaXMuZWRpdG9yLl9lbmFibGVkKSB7XG4gICAgICB0aGlzLmVkaXRvci51cGRhdGVTdHlsZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9yZW5kZXJUZXh0KCk7XG4gICAgfVxuICB9LFxuXG5cbiAgdXBkYXRlU3R5bGU6IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0ZXh0Tm9kZSA9IHRoaXMuX3RleHROb2RlO1xuICAgIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgIGlmIChudWxsICE9PSB0ZXh0Tm9kZSkge1xuICAgICAgdGV4dE5vZGUuc2V0QXR0cmlidXRlKCdmb250LWZhbWlseScsIG9wdGlvbnMuZm9udEZhbWlseSk7XG4gICAgICB0ZXh0Tm9kZS5zZXRBdHRyaWJ1dGUoJ2ZvbnQtc2l6ZScsIG9wdGlvbnMuZm9udFNpemUgKyAncHgnKTtcbiAgICAgIHRleHROb2RlLnNldEF0dHJpYnV0ZSgnZmlsbCcsIG9wdGlvbnMuZm9udENvbG9yKTtcbiAgICB9XG4gIH0sXG5cblxuICBfcmVuZGVyVGV4dDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fdGV4dE5vZGUgPSB0aGlzLl9yZW5kZXJlci5yZW5kZXJUZXh0KHRoaXMpO1xuICAgIHRoaXMuX3BhdGgucGFyZW50Tm9kZVxuICAgICAgICAuaW5zZXJ0QmVmb3JlKHRoaXMuX3RleHROb2RlLCB0aGlzLl9wYXRoLm5leHRTaWJsaW5nKTtcbiAgICB0aGlzLnVwZGF0ZVN0eWxlKCk7XG4gICAgdGhpcy5fdXBkYXRlUG9zaXRpb24oKTtcbiAgfSxcblxuXG4gIF91cGRhdGVQb3NpdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgaWYgKG51bGwgIT09IHRoaXMuX3RleHROb2RlICYmIDAgIT09IHRoaXMuX3JpbmdzLmxlbmd0aCkge1xuICAgICAgdmFyIHBvcyA9IHRoaXMuX3JpbmdzWzBdWzFdO1xuICAgICAgdmFyIHRleHRNYXRyaXggPSBuZXcgTC5NYXRyaXgoMSwgMCwgMCwgMSwgMCwgMClcbiAgICAgICAgLnRyYW5zbGF0ZShwb3MpXG4gICAgICAgIC5zY2FsZSh0aGlzLl9nZXRTY2FsZSh0aGlzLl9tYXAuZ2V0Wm9vbSgpKSk7XG4gICAgICB0aGlzLl90ZXh0Tm9kZS5zZXRBdHRyaWJ1dGUoJ3RyYW5zZm9ybScsXG4gICAgICAgICdtYXRyaXgoJyArIHRleHRNYXRyaXguX21hdHJpeC5qb2luKCcgJykgKyAnKScpO1xuICAgIH1cbiAgfSxcblxuXG4gIF9nZXRTY2FsZTogZnVuY3Rpb24oem9vbSkge1xuICAgIHJldHVybiAodGhpcy5fbWFwID9cbiAgICAgIE1hdGgucG93KDIsIHpvb20pICogdGhpcy5vcHRpb25zLnJhdGlvIDogMSk7XG4gIH0sXG5cblxuICBfdXBkYXRlUGF0aDogZnVuY3Rpb24oKSB7XG4gICAgTC5SZWN0YW5nbGUucHJvdG90eXBlLl91cGRhdGVQYXRoLmNhbGwodGhpcyk7XG4gICAgdGhpcy5fdXBkYXRlUG9zaXRpb24oKTtcbiAgfVxuXG59KTtcbiIsIi8qKlxuICogQHBhcmFtICB7RWxlbWVudH0gZWxlbWVudFxuICogQHBhcmFtICB7TC5Qb2ludH0gc2l6ZVxuICogQHJldHVybiB7T2JqZWN0fSBzZWxmXG4gKi9cbkwuRG9tVXRpbC5zZXRTaXplID0gIEwuRG9tVXRpbC5zZXRTaXplIHx8IGZ1bmN0aW9uKGVsZW1lbnQsIHNpemUpIHtcbiAgZWxlbWVudC5zdHlsZS53aWR0aCA9IHNpemUueCAgKyAncHgnO1xuICBlbGVtZW50LnN0eWxlLmhlaWdodCA9IHNpemUueSArICdweCc7XG4gIHJldHVybiB0aGlzO1xufTtcbiJdfQ==
