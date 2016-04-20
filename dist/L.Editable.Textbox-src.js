(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g=(g.L||(g.L = {}));g=(g.Editable||(g.Editable = {}));g.Textbox = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*eslint no-undef: "error"*/
/*eslint-env node*/

var L = require('leaflet');

require('leaflet-editable');
require('leaflet-path-transform/src/Matrix');
require('./src/Textbox');
require('./src/Util');
require('./src/Editable.Textbox');

module.exports = L.Editable.TextBoxEditor;

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

        textArea.style.display  = '';
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9sZWFmbGV0LXBhdGgtdHJhbnNmb3JtL3NyYy9NYXRyaXguanMiLCJzcmMvRWRpdGFibGUuVGV4dGJveC5qcyIsInNyYy9UZXh0Ym94LmpzIiwic3JjL1V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25PQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKmVzbGludCBuby11bmRlZjogXCJlcnJvclwiKi9cbi8qZXNsaW50LWVudiBub2RlKi9cblxudmFyIEwgPSByZXF1aXJlKCdsZWFmbGV0Jyk7XG5cbnJlcXVpcmUoJ2xlYWZsZXQtZWRpdGFibGUnKTtcbnJlcXVpcmUoJ2xlYWZsZXQtcGF0aC10cmFuc2Zvcm0vc3JjL01hdHJpeCcpO1xucmVxdWlyZSgnLi9zcmMvVGV4dGJveCcpO1xucmVxdWlyZSgnLi9zcmMvVXRpbCcpO1xucmVxdWlyZSgnLi9zcmMvRWRpdGFibGUuVGV4dGJveCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEwuRWRpdGFibGUuVGV4dEJveEVkaXRvcjtcbiIsIi8qKlxuICogQGNsYXNzICBMLk1hdHJpeFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBhXG4gKiBAcGFyYW0ge051bWJlcn0gYlxuICogQHBhcmFtIHtOdW1iZXJ9IGNcbiAqIEBwYXJhbSB7TnVtYmVyfSBkXG4gKiBAcGFyYW0ge051bWJlcn0gZVxuICogQHBhcmFtIHtOdW1iZXJ9IGZcbiAqL1xuTC5NYXRyaXggPSBmdW5jdGlvbihhLCBiLCBjLCBkLCBlLCBmKSB7XG5cbiAgLyoqXG4gICAqIEB0eXBlIHtBcnJheS48TnVtYmVyPn1cbiAgICovXG4gIHRoaXMuX21hdHJpeCA9IFthLCBiLCBjLCBkLCBlLCBmXTtcbn07XG5cblxuTC5NYXRyaXgucHJvdG90eXBlID0ge1xuXG5cbiAgLyoqXG4gICAqIEBwYXJhbSAge0wuUG9pbnR9IHBvaW50XG4gICAqIEByZXR1cm4ge0wuUG9pbnR9XG4gICAqL1xuICB0cmFuc2Zvcm06IGZ1bmN0aW9uKHBvaW50KSB7XG4gICAgcmV0dXJuIHRoaXMuX3RyYW5zZm9ybShwb2ludC5jbG9uZSgpKTtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBEZXN0cnVjdGl2ZVxuICAgKlxuICAgKiBbIHggXSA9IFsgYSAgYiAgdHggXSBbIHggXSA9IFsgYSAqIHggKyBiICogeSArIHR4IF1cbiAgICogWyB5IF0gPSBbIGMgIGQgIHR5IF0gWyB5IF0gPSBbIGMgKiB4ICsgZCAqIHkgKyB0eSBdXG4gICAqXG4gICAqIEBwYXJhbSAge0wuUG9pbnR9IHBvaW50XG4gICAqIEByZXR1cm4ge0wuUG9pbnR9XG4gICAqL1xuICBfdHJhbnNmb3JtOiBmdW5jdGlvbihwb2ludCkge1xuICAgIHZhciBtYXRyaXggPSB0aGlzLl9tYXRyaXg7XG4gICAgdmFyIHggPSBwb2ludC54LCB5ID0gcG9pbnQueTtcbiAgICBwb2ludC54ID0gbWF0cml4WzBdICogeCArIG1hdHJpeFsxXSAqIHkgKyBtYXRyaXhbNF07XG4gICAgcG9pbnQueSA9IG1hdHJpeFsyXSAqIHggKyBtYXRyaXhbM10gKiB5ICsgbWF0cml4WzVdO1xuICAgIHJldHVybiBwb2ludDtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtMLlBvaW50fSBwb2ludFxuICAgKiBAcmV0dXJuIHtMLlBvaW50fVxuICAgKi9cbiAgdW50cmFuc2Zvcm06IGZ1bmN0aW9uIChwb2ludCkge1xuICAgIHZhciBtYXRyaXggPSB0aGlzLl9tYXRyaXg7XG4gICAgcmV0dXJuIG5ldyBMLlBvaW50KFxuICAgICAgKHBvaW50LnggLyBtYXRyaXhbMF0gLSBtYXRyaXhbNF0pIC8gbWF0cml4WzBdLFxuICAgICAgKHBvaW50LnkgLyBtYXRyaXhbMl0gLSBtYXRyaXhbNV0pIC8gbWF0cml4WzJdXG4gICAgKTtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtMLk1hdHJpeH1cbiAgICovXG4gIGNsb25lOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgbWF0cml4ID0gdGhpcy5fbWF0cml4O1xuICAgIHJldHVybiBuZXcgTC5NYXRyaXgoXG4gICAgICBtYXRyaXhbMF0sIG1hdHJpeFsxXSwgbWF0cml4WzJdLFxuICAgICAgbWF0cml4WzNdLCBtYXRyaXhbNF0sIG1hdHJpeFs1XVxuICAgICk7XG4gIH0sXG5cblxuICAvKipcbiAgICogQHBhcmFtIHtMLlBvaW50PXxOdW1iZXI9fSB0cmFuc2xhdGVcbiAgICogQHJldHVybiB7TC5NYXRyaXh8TC5Qb2ludH1cbiAgICovXG4gIHRyYW5zbGF0ZTogZnVuY3Rpb24odHJhbnNsYXRlKSB7XG4gICAgaWYgKHRyYW5zbGF0ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gbmV3IEwuUG9pbnQodGhpcy5fbWF0cml4WzRdLCB0aGlzLl9tYXRyaXhbNV0pO1xuICAgIH1cblxuICAgIHZhciB0cmFuc2xhdGVYLCB0cmFuc2xhdGVZO1xuICAgIGlmICh0eXBlb2YgdHJhbnNsYXRlID09PSAnbnVtYmVyJykge1xuICAgICAgdHJhbnNsYXRlWCA9IHRyYW5zbGF0ZVkgPSB0cmFuc2xhdGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRyYW5zbGF0ZVggPSB0cmFuc2xhdGUueDtcbiAgICAgIHRyYW5zbGF0ZVkgPSB0cmFuc2xhdGUueTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fYWRkKDEsIDAsIDAsIDEsIHRyYW5zbGF0ZVgsIHRyYW5zbGF0ZVkpO1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7TC5Qb2ludD18TnVtYmVyPX0gc2NhbGVcbiAgICogQHJldHVybiB7TC5NYXRyaXh8TC5Qb2ludH1cbiAgICovXG4gIHNjYWxlOiBmdW5jdGlvbihzY2FsZSwgb3JpZ2luKSB7XG4gICAgaWYgKHNjYWxlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBuZXcgTC5Qb2ludCh0aGlzLl9tYXRyaXhbMF0sIHRoaXMuX21hdHJpeFszXSk7XG4gICAgfVxuXG4gICAgdmFyIHNjYWxlWCwgc2NhbGVZO1xuICAgIG9yaWdpbiA9IG9yaWdpbiB8fCBMLnBvaW50KDAsIDApO1xuICAgIGlmICh0eXBlb2Ygc2NhbGUgPT09ICdudW1iZXInKSB7XG4gICAgICBzY2FsZVggPSBzY2FsZVkgPSBzY2FsZTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2NhbGVYID0gc2NhbGUueDtcbiAgICAgIHNjYWxlWSA9IHNjYWxlLnk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgICAgIC5fYWRkKHNjYWxlWCwgMCwgMCwgc2NhbGVZLCBvcmlnaW4ueCwgb3JpZ2luLnkpXG4gICAgICAuX2FkZCgxLCAwLCAwLCAxLCAtb3JpZ2luLngsIC1vcmlnaW4ueSk7XG4gIH0sXG5cblxuICAvKipcbiAgICogbTAwICBtMDEgIHggLSBtMDAgKiB4IC0gbTAxICogeVxuICAgKiBtMTAgIG0xMSAgeSAtIG0xMCAqIHggLSBtMTEgKiB5XG4gICAqIEBwYXJhbSB7TnVtYmVyfSAgIGFuZ2xlXG4gICAqIEBwYXJhbSB7TC5Qb2ludD19IG9yaWdpblxuICAgKiBAcmV0dXJuIHtMLk1hdHJpeH1cbiAgICovXG4gIHJvdGF0ZTogZnVuY3Rpb24oYW5nbGUsIG9yaWdpbikge1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyhhbmdsZSk7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKGFuZ2xlKTtcblxuICAgIG9yaWdpbiA9IG9yaWdpbiB8fCBuZXcgTC5Qb2ludCgwLCAwKTtcblxuICAgIHJldHVybiB0aGlzXG4gICAgICAuX2FkZChjb3MsIHNpbiwgLXNpbiwgY29zLCBvcmlnaW4ueCwgb3JpZ2luLnkpXG4gICAgICAuX2FkZCgxLCAwLCAwLCAxLCAtb3JpZ2luLngsIC1vcmlnaW4ueSk7XG4gIH0sXG5cblxuICAvKipcbiAgICogSW52ZXJ0IHJvdGF0aW9uXG4gICAqIEByZXR1cm4ge0wuTWF0cml4fVxuICAgKi9cbiAgZmxpcDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fbWF0cml4WzFdICo9IC0xO1xuICAgIHRoaXMuX21hdHJpeFsyXSAqPSAtMTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge051bWJlcnxMLk1hdHJpeH0gYVxuICAgKiBAcGFyYW0ge051bWJlcn0gYlxuICAgKiBAcGFyYW0ge051bWJlcn0gY1xuICAgKiBAcGFyYW0ge051bWJlcn0gZFxuICAgKiBAcGFyYW0ge051bWJlcn0gZVxuICAgKiBAcGFyYW0ge051bWJlcn0gZlxuICAgKi9cbiAgX2FkZDogZnVuY3Rpb24oYSwgYiwgYywgZCwgZSwgZikge1xuICAgIHZhciByZXN1bHQgPSBbW10sIFtdLCBbXV07XG4gICAgdmFyIHNyYyA9IHRoaXMuX21hdHJpeDtcbiAgICB2YXIgbSA9IFtcbiAgICAgIFtzcmNbMF0sIHNyY1syXSwgc3JjWzRdXSxcbiAgICAgIFtzcmNbMV0sIHNyY1szXSwgc3JjWzVdXSxcbiAgICAgIFsgICAgIDAsICAgICAgMCwgICAgIDFdXG4gICAgXTtcbiAgICB2YXIgb3RoZXIgPSBbXG4gICAgICBbYSwgYywgZV0sXG4gICAgICBbYiwgZCwgZl0sXG4gICAgICBbMCwgMCwgMV1cbiAgICBdLCB2YWw7XG5cblxuICAgIGlmIChhICYmIGEgaW5zdGFuY2VvZiBMLk1hdHJpeCkge1xuICAgICAgc3JjID0gYS5fbWF0cml4O1xuICAgICAgb3RoZXIgPSBbXG4gICAgICAgIFtzcmNbMF0sIHNyY1syXSwgc3JjWzRdXSxcbiAgICAgICAgW3NyY1sxXSwgc3JjWzNdLCBzcmNbNV1dLFxuICAgICAgICBbICAgICAwLCAgICAgIDAsICAgICAxXV07XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgMzsgaisrKSB7XG4gICAgICAgIHZhbCA9IDA7XG4gICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgMzsgaysrKSB7XG4gICAgICAgICAgdmFsICs9IG1baV1ba10gKiBvdGhlcltrXVtqXTtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHRbaV1bal0gPSB2YWw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fbWF0cml4ID0gW1xuICAgICAgcmVzdWx0WzBdWzBdLCByZXN1bHRbMV1bMF0sIHJlc3VsdFswXVsxXSxcbiAgICAgIHJlc3VsdFsxXVsxXSwgcmVzdWx0WzBdWzJdLCByZXN1bHRbMV1bMl1cbiAgICBdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cblxufTtcblxuXG5MLm1hdHJpeCA9IGZ1bmN0aW9uKGEsIGIsIGMsIGQsIGUsIGYpIHtcbiAgcmV0dXJuIG5ldyBMLk1hdHJpeChhLCBiLCBjLCBkLCBlLCBmKTtcbn07XG4iLCIvKipcbiAqIFRleHRCb3hcbiAqXG4gKiBAYXV0aG9yIHJ1bWF4XG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1jb25zb2xlICovXG5cbkwuRWRpdGFibGUuVGV4dEJveEVkaXRvciA9IEwuRWRpdGFibGUuUmVjdGFuZ2xlRWRpdG9yLmV4dGVuZCh7XG5cbiAgb3B0aW9uczoge1xuICAgIHRleHRhcmVhUGFkZGluZzogMVxuICB9LFxuXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtMLk1hcH0gICAgIG1hcFxuICAgKiBAcGFyYW0gIHtMLlRleHRib3h9IGZlYXR1cmVcbiAgICogQHBhcmFtICB7T2JqZWN0PX0gICBvcHRpb25zXG4gICAqL1xuICBpbml0aWFsaXplOiBmdW5jdGlvbihtYXAsIGZlYXR1cmUsIG9wdGlvbnMpIHtcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtIVE1MVGV4dEFyZWFFbGVtZW50fVxuICAgICAqL1xuICAgIHRoaXMuX3RleHRBcmVhID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICovXG4gICAgdGhpcy5fdGV4dCAgICAgPSBudWxsO1xuXG4gICAgTC5FZGl0YWJsZS5SZWN0YW5nbGVFZGl0b3IucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCh0aGlzLCBtYXAsIGZlYXR1cmUsIG9wdGlvbnMpO1xuICB9LFxuXG5cbiAgdXBkYXRlU3R5bGU6IGZ1bmN0aW9uKCkge1xuICAgIGlmIChudWxsICE9PSB0aGlzLl90ZXh0QXJlYSkge1xuICAgICAgdmFyIHN0eWxlICAgPSB0aGlzLl90ZXh0QXJlYS5zdHlsZTtcbiAgICAgIHZhciBvcHRpb25zID0gdGhpcy5mZWF0dXJlLm9wdGlvbnM7XG5cbiAgICAgIHN0eWxlLmZvbnRTaXplICAgPSBvcHRpb25zLmZvbnRTaXplICsgJ3B4JztcbiAgICAgIHN0eWxlLmNvbG9yICAgICAgPSBvcHRpb25zLmZvbnRDb2xvcjtcbiAgICAgIHN0eWxlLmZvbnRGYW1pbHkgPSBvcHRpb25zLmZvbnRGYW1pbHk7XG4gICAgfVxuICB9LFxuXG5cbiAgZW5hYmxlOiBmdW5jdGlvbigpIHtcbiAgICBMLkVkaXRhYmxlLlJlY3RhbmdsZUVkaXRvci5wcm90b3R5cGUuZW5hYmxlLmNhbGwodGhpcyk7XG4gICAgdGhpcy5tYXBcbiAgICAgICAgLm9uKCdkcmFnZW5kJywgdGhpcy5fZm9jdXMsIHRoaXMpXG4gICAgICAgIC5vbignem9vbWFuaW0nLCB0aGlzLl9hbmltYXRlWm9vbSwgdGhpcylcbiAgICAgICAgLm9uKCd6b29tZW5kJywgdGhpcy5fdXBkYXRlVGV4dEFyZWFCb3VuZHMsIHRoaXMpO1xuXG4gICAgaWYgKG51bGwgPT09IHRoaXMuX3RleHRBcmVhKSB7XG4gICAgICB0aGlzLl90ZXh0QXJlYSA9IEwuRG9tVXRpbC5jcmVhdGUoJ3RleHRhcmVhJyxcbiAgICAgICAgJ2xlYWZsZXQtem9vbS1hbmltYXRlZCBsZWFmbGV0LXRleHRib3gnKTtcbiAgICAgIHZhciBzdHlsZSA9IHRoaXMuX3RleHRBcmVhLnN0eWxlO1xuICAgICAgc3R5bGUucmVzaXplICAgICAgICAgID0gJ25vbmUnO1xuICAgICAgc3R5bGUuYm9yZGVyICAgICAgICAgID0gJ25vbmUnO1xuICAgICAgc3R5bGUucGFkZGluZyAgICAgICAgID0gdGhpcy5vcHRpb25zLnRleHRhcmVhUGFkZGluZyArICdweCc7XG4gICAgICBzdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAndHJhbnNwYXJlbnQnO1xuXG4gICAgICB0aGlzLnVwZGF0ZVN0eWxlKCk7XG4gICAgICB0aGlzLm1hcC5nZXRQYW5lKCdtYXJrZXJQYW5lJykuYXBwZW5kQ2hpbGQodGhpcy5fdGV4dEFyZWEpO1xuXG4gICAgICBpZiAodGhpcy5fdGV4dCkge1xuICAgICAgICB0aGlzLl90ZXh0QXJlYS5pbm5lckhUTUwgPSB0aGlzLl90ZXh0O1xuICAgICAgfVxuXG4gICAgICB0aGlzLl91cGRhdGVUZXh0QXJlYUJvdW5kcygpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG5cbiAgc2V0VGV4dDogZnVuY3Rpb24odGV4dCkge1xuICAgIHRoaXMuX3RleHQgPSB0ZXh0O1xuXG4gICAgaWYgKG51bGwgIT09IHRoaXMuX3RleHRBcmVhKSB7XG4gICAgICB0aGlzLl90ZXh0QXJlYS52YWx1ZSA9IHRleHQ7XG4gICAgfVxuICB9LFxuXG5cbiAgZ2V0VGV4dDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fdGV4dCA9IHRoaXMuX3RleHRBcmVhLnZhbHVlO1xuICAgIHJldHVybiB0aGlzLl90ZXh0O1xuICB9LFxuXG5cbiAgZGlzYWJsZTogZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuX2VuYWJsZWQpIHtcbiAgICAgIHRoaXMubWFwXG4gICAgICAgIC5vZmYoJ2RyYWdlbmQnLCAgdGhpcy5fZm9jdXMsIHRoaXMpXG4gICAgICAgIC5vZmYoJ3pvb21hbmltJywgdGhpcy5fYW5pbWF0ZVpvb20sIHRoaXMpXG4gICAgICAgIC5vZmYoJ3pvb21lbmQnLCAgdGhpcy5fdXBkYXRlVGV4dEFyZWFCb3VuZHMsIHRoaXMpO1xuXG4gICAgICBpZiAobnVsbCAhPT0gdGhpcy50ZXh0QXJlYSkge1xuICAgICAgICB0aGlzLmdldFRleHQoKTtcbiAgICAgICAgdGhpcy5fdGV4dEFyZWEucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLl90ZXh0QXJlYSk7XG4gICAgICAgIHRoaXMuX3RleHRBcmVhID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBMLkVkaXRhYmxlLlJlY3RhbmdsZUVkaXRvci5wcm90b3R5cGUuZGlzYWJsZS5jYWxsKHRoaXMpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cblxuICB1cGRhdGVCb3VuZHM6IGZ1bmN0aW9uIChib3VuZHMpIHtcbiAgICBMLkVkaXRhYmxlLlJlY3RhbmdsZUVkaXRvci5wcm90b3R5cGUudXBkYXRlQm91bmRzLmNhbGwodGhpcywgYm91bmRzKTtcbiAgICByZXR1cm4gdGhpcy5fdXBkYXRlVGV4dEFyZWFCb3VuZHMoKTtcbiAgfSxcblxuXG4gIF9mb2N1czogZnVuY3Rpb24oKSB7XG4gICAgaWYgKG51bGwgIT09IHRoaXMuX3RleHRBcmVhKSB7XG4gICAgICBMLlV0aWwucmVxdWVzdEFuaW1GcmFtZShmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fdGV4dEFyZWEuZm9jdXMoKTtcbiAgICAgIH0sIHRoaXMpO1xuICAgIH1cbiAgfSxcblxuXG4gIC8qKlxuICAgKiBBbmltYXRlZCByZXNpemVcbiAgICogQHBhcmFtICB7RXZlbnR9IGV2dFxuICAgKi9cbiAgX2FuaW1hdGVab29tOiBmdW5jdGlvbihldnQpIHtcbiAgICB2YXIgYm91bmRzID0gdGhpcy5mZWF0dXJlLl9ib3VuZHM7XG4gICAgdmFyIHNjYWxlICA9IHRoaXMuZmVhdHVyZS5fZ2V0U2NhbGUoZXZ0Lnpvb20pO1xuICAgIHZhciBvZmZzZXQgPSB0aGlzLm1hcC5fbGF0TG5nVG9OZXdMYXllclBvaW50KFxuICAgICAgYm91bmRzLmdldE5vcnRoV2VzdCgpLCBldnQuem9vbSwgZXZ0LmNlbnRlcik7XG5cbiAgICBMLkRvbVV0aWwuc2V0VHJhbnNmb3JtKHRoaXMuX3RleHRBcmVhLCBvZmZzZXQsIHNjYWxlLnRvRml4ZWQoMykpO1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIFJlc2l6ZSwgcmVwb3NpdGlvbiBvbiB6b29tIGVuZCBvciByZXNpemVcbiAgICovXG4gIF91cGRhdGVUZXh0QXJlYUJvdW5kczogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNjYWxlLCBsYXRsbmdzLCBwb3MsIHNpemU7XG4gICAgdmFyIGZlYXR1cmUgID0gdGhpcy5mZWF0dXJlO1xuICAgIHZhciBib3VuZHMgICA9IGZlYXR1cmUuX2JvdW5kcztcbiAgICB2YXIgdGV4dEFyZWEgPSB0aGlzLl90ZXh0QXJlYTtcbiAgICB2YXIgbWFwICAgICAgPSB0aGlzLm1hcDtcblxuICAgIGlmIChudWxsICE9PSB0ZXh0QXJlYSkge1xuICAgICAgaWYgKG51bGwgIT09IGJvdW5kcykge1xuICAgICAgICBzY2FsZSA9IGZlYXR1cmUuX2dldFNjYWxlKG1hcC5nZXRab29tKCkpO1xuICAgICAgICBsYXRsbmdzID0gZmVhdHVyZS5fYm91bmRzVG9MYXRMbmdzKGJvdW5kcyk7XG4gICAgICAgIHBvcyA9IG1hcC5sYXRMbmdUb0xheWVyUG9pbnQobGF0bG5nc1sxXSk7XG4gICAgICAgIHNpemUgPSBtYXAubGF0TG5nVG9MYXllclBvaW50KGxhdGxuZ3NbM10pLnN1YnRyYWN0KHBvcyk7XG4gICAgICAgIEwuRG9tVXRpbFxuICAgICAgICAgICAuc2V0U2l6ZSh0ZXh0QXJlYSwgc2l6ZS5kaXZpZGVCeShzY2FsZSkucm91bmQoKSlcbiAgICAgICAgICAgLnNldFRyYW5zZm9ybSh0ZXh0QXJlYSwgcG9zLCBzY2FsZS50b0ZpeGVkKDMpKTtcblxuICAgICAgICB0ZXh0QXJlYS5zdHlsZS5kaXNwbGF5ICA9ICcnO1xuICAgICAgICB0ZXh0QXJlYS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIHRleHRBcmVhLnNldEF0dHJpYnV0ZSgnc3BlbGxjaGVjaycsIGZhbHNlKTtcblxuICAgICAgICB0aGlzLl9mb2N1cygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGV4dEFyZWEuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG59KTtcblxuXG5MLlRleHRCb3guaW5jbHVkZSh7XG5cbiAgZW5hYmxlRWRpdDogZnVuY3Rpb24obWFwKSB7XG4gICAgaWYgKCF0aGlzLmVkaXRvcikge1xuICAgICAgdGhpcy5jcmVhdGVFZGl0b3IobWFwKTtcbiAgICB9XG4gICAgdmFyIHJldCA9IEwuUmVjdGFuZ2xlLnByb3RvdHlwZS5lbmFibGVFZGl0LmNhbGwodGhpcywgbWFwKTtcblxuICAgIGlmICh0aGlzLl90ZXh0Tm9kZSkge1xuICAgICAgdGhpcy5fdGV4dE5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLl90ZXh0Tm9kZSk7XG4gICAgICB0aGlzLl90ZXh0Tm9kZSA9IG51bGw7XG4gICAgfVxuXG4gICAgcmV0ID0gTC5SZWN0YW5nbGUucHJvdG90eXBlLmVuYWJsZUVkaXQuY2FsbCh0aGlzLCBtYXApO1xuICAgIHRoaXMuZWRpdG9yLnNldFRleHQodGhpcy5fdGV4dCk7XG5cbiAgICByZXR1cm4gcmV0O1xuICB9LFxuXG5cbiAgZGlzYWJsZUVkaXQ6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLmVkaXRvcikge1xuICAgICAgdGhpcy5fdGV4dCA9IHRoaXMuZWRpdG9yLmdldFRleHQoKTtcbiAgICB9XG5cbiAgICBMLlJlY3RhbmdsZS5wcm90b3R5cGUuZGlzYWJsZUVkaXQuY2FsbCh0aGlzKTtcbiAgICB0aGlzLl9yZW5kZXJUZXh0KCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuXG4gIGdldEVkaXRvckNsYXNzOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gTC5FZGl0YWJsZS5UZXh0Qm94RWRpdG9yO1xuICB9XG5cbn0pO1xuXG5cbi8qKlxuICogQHBhcmFtICB7QXJyYXkuPExhdExuZz49fSBsYXRsbmdcbiAqIEBwYXJhbSAge09iamVjdD19IG9wdGlvbnNcbiAqIEByZXR1cm4ge0wuVGV4dEJveH1cbiAqL1xuTC5FZGl0YWJsZS5wcm90b3R5cGUuc3RhcnRUZXh0Qm94ID0gZnVuY3Rpb24obGF0bG5nLCBvcHRpb25zKSB7XG4gIHJldHVybiB0aGlzLnN0YXJ0UmVjdGFuZ2xlKG51bGwsIEwuZXh0ZW5kKHtcbiAgICByZWN0YW5nbGVDbGFzczogTC5UZXh0Qm94XG4gIH0sIG9wdGlvbnMpKTtcbn07XG4iLCJcbkwuVGV4dEJveCA9IEwuUmVjdGFuZ2xlLmV4dGVuZCh7XG5cbiAgb3B0aW9uczoge1xuICAgIHBhZGRpbmc6IDIsXG4gICAgZm9udFNpemU6IDEyLFxuICAgIGZpbGxPcGFjaXR5OiAwLjUsXG4gICAgZmlsbENvbG9yOiAnI2ZmZmZmZicsXG4gICAgd2VpZ2h0OiAxLFxuICAgIGZvbnRDb2xvcjogJycsXG4gICAgZm9udEZhbWlseTogJycsXG4gICAgcmF0aW86IDEsXG4gICAgdGV4dDogJ1BsZWFzZSwgYWRkIHRleHQnXG5cbiAgICAvL1RPRE86IHdyYXBCeTogJ2xldHRlcicsICdjaGFyJywgJ25vd3JhcCcsIGV0Yy5cbiAgfSxcblxuXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uKGJvdW5kcywgb3B0aW9ucykge1xuICAgIEwuUmVjdGFuZ2xlLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcywgYm91bmRzLCBvcHRpb25zKTtcblxuICAgIHRoaXMuX3RleHQgPSB0aGlzLm9wdGlvbnMudGV4dDtcbiAgICB0aGlzLl90ZXh0Tm9kZSA9IG51bGw7XG4gIH0sXG5cblxuICAvKipcbiAgICogQHBhcmFtIHtPYmplY3R9IHN0eWxlXG4gICAqL1xuICBzZXRTdHlsZTogZnVuY3Rpb24oc3R5bGUpIHtcbiAgICBMLnNldE9wdGlvbnModGhpcywgc3R5bGUpO1xuXG4gICAgaWYgKHRoaXMuZWRpdG9yICYmIHRoaXMuZWRpdG9yLl9lbmFibGVkKSB7XG4gICAgICB0aGlzLmVkaXRvci51cGRhdGVTdHlsZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9yZW5kZXJUZXh0KCk7XG4gICAgfVxuICB9LFxuXG5cbiAgdXBkYXRlU3R5bGU6IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0ZXh0Tm9kZSA9IHRoaXMuX3RleHROb2RlO1xuICAgIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgIGlmIChudWxsICE9PSB0ZXh0Tm9kZSkge1xuICAgICAgdGV4dE5vZGUuc2V0QXR0cmlidXRlKCdmb250LWZhbWlseScsIG9wdGlvbnMuZm9udEZhbWlseSk7XG4gICAgICB0ZXh0Tm9kZS5zZXRBdHRyaWJ1dGUoJ2ZvbnQtc2l6ZScsIG9wdGlvbnMuZm9udFNpemUgKyAncHgnKTtcbiAgICAgIHRleHROb2RlLnNldEF0dHJpYnV0ZSgnZmlsbCcsIG9wdGlvbnMuZm9udENvbG9yKTtcbiAgICB9XG4gIH0sXG5cblxuICBfcmVuZGVyVGV4dDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fdGV4dE5vZGUgPSB0aGlzLl9yZW5kZXJlci5yZW5kZXJUZXh0KHRoaXMpO1xuICAgIHRoaXMuX3BhdGgucGFyZW50Tm9kZVxuICAgICAgICAuaW5zZXJ0QmVmb3JlKHRoaXMuX3RleHROb2RlLCB0aGlzLl9wYXRoLm5leHRTaWJsaW5nKTtcbiAgICB0aGlzLnVwZGF0ZVN0eWxlKCk7XG4gICAgdGhpcy5fdXBkYXRlUG9zaXRpb24oKTtcbiAgfSxcblxuXG4gIF91cGRhdGVQb3NpdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgaWYgKG51bGwgIT09IHRoaXMuX3RleHROb2RlICYmIDAgIT09IHRoaXMuX3JpbmdzLmxlbmd0aCkge1xuICAgICAgdmFyIHBvcyA9IHRoaXMuX3JpbmdzWzBdWzFdO1xuICAgICAgdmFyIHRleHRNYXRyaXggPSBuZXcgTC5NYXRyaXgoMSwgMCwgMCwgMSwgMCwgMClcbiAgICAgICAgLnRyYW5zbGF0ZShwb3MpXG4gICAgICAgIC5zY2FsZSh0aGlzLl9nZXRTY2FsZSh0aGlzLl9tYXAuZ2V0Wm9vbSgpKSk7XG4gICAgICB0aGlzLl90ZXh0Tm9kZS5zZXRBdHRyaWJ1dGUoJ3RyYW5zZm9ybScsXG4gICAgICAgICdtYXRyaXgoJyArIHRleHRNYXRyaXguX21hdHJpeC5qb2luKCcgJykgKyAnKScpO1xuICAgIH1cbiAgfSxcblxuXG4gIF9nZXRTY2FsZTogZnVuY3Rpb24oem9vbSkge1xuICAgIHJldHVybiAodGhpcy5fbWFwID9cbiAgICAgIE1hdGgucG93KDIsIHpvb20pICogdGhpcy5vcHRpb25zLnJhdGlvIDogMSk7XG4gIH0sXG5cblxuICBfdXBkYXRlUGF0aDogZnVuY3Rpb24oKSB7XG4gICAgTC5SZWN0YW5nbGUucHJvdG90eXBlLl91cGRhdGVQYXRoLmNhbGwodGhpcyk7XG4gICAgdGhpcy5fdXBkYXRlUG9zaXRpb24oKTtcbiAgfVxuXG59KTtcbiIsIi8qKlxuICogQHBhcmFtICB7RWxlbWVudH0gZWxlbWVudFxuICogQHBhcmFtICB7TC5Qb2ludH0gc2l6ZVxuICogQHJldHVybiB7T2JqZWN0fSBzZWxmXG4gKi9cbkwuRG9tVXRpbC5zZXRTaXplID0gIEwuRG9tVXRpbC5zZXRTaXplIHx8IGZ1bmN0aW9uKGVsZW1lbnQsIHNpemUpIHtcbiAgZWxlbWVudC5zdHlsZS53aWR0aCA9IHNpemUueCAgKyAncHgnO1xuICBlbGVtZW50LnN0eWxlLmhlaWdodCA9IHNpemUueSArICdweCc7XG4gIHJldHVybiB0aGlzO1xufTtcbiJdfQ==
