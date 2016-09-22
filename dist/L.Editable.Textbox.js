(function(t){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=t()}else if(typeof define==="function"&&define.amd){define([],t)}else{var e;if(typeof window!=="undefined"){e=window}else if(typeof global!=="undefined"){e=global}else if(typeof self!=="undefined"){e=self}else{e=this}e=e.L||(e.L={});e=e.Editable||(e.Editable={});e.Textbox=t()}})(function(){var t,e,i;return function n(t,e,i){function r(o,s){if(!e[o]){if(!t[o]){var l=typeof require=="function"&&require;if(!s&&l)return l(o,!0);if(a)return a(o,!0);var d=new Error("Cannot find module '"+o+"'");throw d.code="MODULE_NOT_FOUND",d}var f=e[o]={exports:{}};t[o][0].call(f.exports,function(e){var i=t[o][1][e];return r(i?i:e)},f,f.exports,n,t,e,i)}return e[o].exports}var a=typeof require=="function"&&require;for(var o=0;o<i.length;o++)r(i[o]);return r}({1:[function(t,e,i){var n=t("leaflet");t("leaflet-editable");t("leaflet-path-transform/src/Matrix");t("./src/Textbox");t("./src/Util");t("./src/Editable.Textbox");t("./src/SVG");e.exports=n.Editable.TextBoxEditor},{"./src/Editable.Textbox":3,"./src/SVG":4,"./src/Textbox":5,"./src/Util":6,leaflet:undefined,"leaflet-editable":undefined,"leaflet-path-transform/src/Matrix":2}],2:[function(t,e,i){L.Matrix=function(t,e,i,n,r,a){this._matrix=[t,e,i,n,r,a]};L.Matrix.prototype={transform:function(t){return this._transform(t.clone())},_transform:function(t){var e=this._matrix;var i=t.x,n=t.y;t.x=e[0]*i+e[1]*n+e[4];t.y=e[2]*i+e[3]*n+e[5];return t},untransform:function(t){var e=this._matrix;return new L.Point((t.x/e[0]-e[4])/e[0],(t.y/e[2]-e[5])/e[2])},clone:function(){var t=this._matrix;return new L.Matrix(t[0],t[1],t[2],t[3],t[4],t[5])},translate:function(t){if(t===undefined){return new L.Point(this._matrix[4],this._matrix[5])}var e,i;if(typeof t==="number"){e=i=t}else{e=t.x;i=t.y}return this._add(1,0,0,1,e,i)},scale:function(t,e){if(t===undefined){return new L.Point(this._matrix[0],this._matrix[3])}var i,n;e=e||L.point(0,0);if(typeof t==="number"){i=n=t}else{i=t.x;n=t.y}return this._add(i,0,0,n,e.x,e.y)._add(1,0,0,1,-e.x,-e.y)},rotate:function(t,e){var i=Math.cos(t);var n=Math.sin(t);e=e||new L.Point(0,0);return this._add(i,n,-n,i,e.x,e.y)._add(1,0,0,1,-e.x,-e.y)},flip:function(){this._matrix[1]*=-1;this._matrix[2]*=-1;return this},_add:function(t,e,i,n,r,a){var o=[[],[],[]];var s=this._matrix;var l=[[s[0],s[2],s[4]],[s[1],s[3],s[5]],[0,0,1]];var d=[[t,i,r],[e,n,a],[0,0,1]],f;if(t&&t instanceof L.Matrix){s=t._matrix;d=[[s[0],s[2],s[4]],[s[1],s[3],s[5]],[0,0,1]]}for(var u=0;u<3;u++){for(var h=0;h<3;h++){f=0;for(var x=0;x<3;x++){f+=l[u][x]*d[x][h]}o[u][h]=f}}this._matrix=[o[0][0],o[1][0],o[0][1],o[1][1],o[0][2],o[1][2]];return this}};L.matrix=function(t,e,i,n,r,a){return new L.Matrix(t,e,i,n,r,a)}},{}],3:[function(t,e,i){/**
 * TextBox
 *
 * @author rumax
 * @license MIT
 */
L.Editable.TextBoxEditor=L.Editable.RectangleEditor.extend({options:{textareaPadding:1},initialize:function(t,e,i){this._textArea=null;this._text=null;L.Editable.RectangleEditor.prototype.initialize.call(this,t,e,i)},updateStyle:function(){if(null!==this._textArea){var t=this._textArea.style;var e=this.feature.options;t.fontSize=e.fontSize+"px";t.color=e.fontColor;t.fontFamily=e.fontFamily}},enable:function(){L.Editable.RectangleEditor.prototype.enable.call(this);this.map.on("dragend",this._focus,this).on("zoomanim",this._animateZoom,this).on("zoomend",this._updateTextAreaBounds,this);if(null===this._textArea){this._textArea=L.DomUtil.create("textarea","leaflet-zoom-animated leaflet-textbox");var t=this._textArea.style;t.resize="none";t.border="none";t.padding=this.options.textareaPadding+"px";t.backgroundColor="transparent";t.overflow="hidden";this.updateStyle();this.map.getPane("markerPane").appendChild(this._textArea);this._text=this.feature._text;if(this._text){this._textArea.innerHTML=this._text}L.DomEvent.addListener(this._textArea,"keypress",L.DomEvent.stopPropagation);L.DomEvent.disableClickPropagation(this._textArea);this._updateTextAreaBounds()}if(this.feature._textNode){this.feature._textNode.parentNode.removeChild(this.feature._textNode);this.feature._textNode=null}return this},setText:function(t){this._text=t;if(null!==this._textArea){this._textArea.value=t}},getText:function(){if(this._enabled){this._text=this._textArea.value}return this._text},disable:function(){if(this._enabled){this.map.off("dragend",this._focus,this).off("zoomanim",this._animateZoom,this).off("zoomend",this._updateTextAreaBounds,this);if(null!==this._textArea){this.getText();L.DomEvent.removeListener(this._textArea,"keypress",L.DomEvent.stopPropagation);this._textArea.parentNode.removeChild(this._textArea);this._textArea=null}this.feature._text=this._text;if(this.map.hasLayer(this.feature)){this.feature._renderText()}}L.Editable.RectangleEditor.prototype.disable.call(this);return this},updateBounds:function(t){L.Editable.RectangleEditor.prototype.updateBounds.call(this,t);return this._updateTextAreaBounds()},_focus:function(){L.Util.requestAnimFrame(function(){if(null!==this._textArea){this._textArea.focus()}},this)},_animateZoom:function(t){var e=this.feature._bounds;var i=this.feature._getScale(t.zoom);var n=this.map._latLngToNewLayerPoint(e.getNorthWest(),t.zoom,t.center);L.DomUtil.setTransform(this._textArea,n,i.toFixed(3))},_updateTextAreaBounds:function(){var t;var e;var i;var n;var r=this.feature;var a=r._bounds;var o=this._textArea;var s=this.map;var a;if(null!==o){if(null!==a){t=r._getScale(s.getZoom());a=r.getBounds();n=s.latLngToLayerPoint(a.getCenter());e=s.latLngToLayerPoint(a.getNorthWest());i=L.point(2*Math.abs(n.x-e.x),2*Math.abs(n.y-e.y)).divideBy(t).round();L.DomUtil.setSize(o,i).setTransform(o,e,t.toFixed(3));o.style.display="";o.style.position="absolute";o.setAttribute("spellcheck",false);this._focus()}else{o.style.display="none"}}return this}});L.TextBox.include({enableEdit:function(t){if(!this.editor){this.createEditor(t)}return L.Rectangle.prototype.enableEdit.call(this,t)},disableEdit:function(){if(this.editor){this._text=this.editor.getText()}L.Rectangle.prototype.disableEdit.call(this);return this},getEditorClass:function(){return L.Editable.TextBoxEditor}});L.Editable.prototype.startTextBox=function(t,e){return this.startRectangle(null,L.extend({rectangleClass:L.TextBox},e))}},{}],4:[function(t,e,i){/**
 * SVG tools
 *
 * @author rumax
 * @license MIT
 * @preserve
 */
var n=12;var r=1.12;L.SVG.calcFontSize=L.SVG.calcFontSize||function(t){var e=n;var i=Number.MAX_VALUE;var r=Number.MIN_VALUE;var a=t.querySelectorAll("text");var o;var s;if(0<a.length){e=0;for(var l=a.length-1;0<=l;--l){s=a[l].getAttribute("font-size");if(null!==s){o=parseFloat(a[l].getAttribute("font-size"));e+=o;if(i>o){i=o}if(r<o){r=o}}}return{size:Math.round(e/a.length+.5),min:Math.round(i+.5),max:Number.MIN_VALUE===r?e:Math.round(r+.5)}}return{size:e,min:e,max:e}};L.SVG.include({renderText:function(t){var e=t._textNode;var i=t._text;if(e){e.parentNode.removeChild(e)}e=t._textNode=L.SVG.create("text");t.updateStyle();this._rootGroup.appendChild(e);if(i){var n=t._getScale(this._map.getZoom());var a=t.getBounds();var o=t._map.latLngToLayerPoint(a.getCenter());var s=t._map.latLngToLayerPoint(a.getNorthWest());var l=L.point(2*Math.abs(o.x-s.x),2*Math.abs(o.y-s.y)).divideBy(n);var d=i.split("");var f=d.shift();var u=d.shift();var h=1;var x=l.x-t.options.padding;var p=this._textMakeNextLine(e,f,{x:t.options.padding});var c=e.getBBox().height;console.log(c);p.setAttribute("dy",c);while(u){if(" "===u){f+=u}else if("\n"===u){f="";p=this._textMakeNextLine(e,f,{x:t.options.padding,dy:r*c})}else if("	"!==u){var _=f;f+=u;p.firstChild.nodeValue=f;var m=t.options.padding+p.getComputedTextLength();if(m>x&&1<=f.length){++h;p.firstChild.nodeValue=_.replace(/\s*$/gm,"");_="";f=u;p=this._textMakeNextLine(e,f,{x:t.options.padding,dy:r*c})}}u=d.shift()}}else if(null!==e){e.parentNode.removeChild(e);e=null}return e},_textMakeNextLine:function(t,e,i){var n=L.SVG.create("tspan");var r;for(r in i||{}){if(i.hasOwnProperty(r)){n.setAttribute(r,i[r])}}n.appendChild(window.document.createTextNode(e||""));t.appendChild(n);return n}})},{}],5:[function(t,e,i){L.TextBox=L.Rectangle.extend({options:{padding:2,fontSize:12,fillOpacity:.5,fillColor:"#ffffff",weight:1,fontColor:"",fontFamily:"",ratio:1,text:"Please, add text"},initialize:function(t,e){L.Rectangle.prototype.initialize.call(this,t,e);this._text=this.options.text;this._textNode=null},setStyle:function(t){L.setOptions(this,t);if(this.editor&&this.editor._enabled){this.editor.updateStyle()}else{this._renderText()}},updateStyle:function(){var t=this._textNode;var e=this.options;if(null!==t){t.setAttribute("font-family",e.fontFamily);t.setAttribute("font-size",e.fontSize+"px");t.setAttribute("fill",e.fontColor)}},getText:function(){if(this._textNode){return Array.prototype.slice.call(this._textNode.childNodes).filter(function(t){return t.tagName.toLowerCase()==="tspan"}).map(function(t){this.options.lineHeight=t.getAttribute("dy");return t.textContent},this)}else{return this._text}},onRemove:function(t){if(null!==this._textNode){if(null!==this._textNode.parentNode){this._textNode.parentNode.removeChild(this._textNode)}this._textNode=null}L.Rectangle.prototype.onRemove.call(this,t)},_renderText:function(){if(this._renderer){this._textNode=this._renderer.renderText(this);this._path.parentNode.insertBefore(this._textNode,this._path.nextSibling);this.updateStyle();this._updatePosition()}},_updatePosition:function(){if(null!==this._textNode){var t=this.getBounds();var e=this._map.latLngToLayerPoint(t.getNorthWest());var i=new L.Matrix(1,0,0,1,0,0).translate(e).scale(this._getScale(this._map.getZoom()));this._textNode.setAttribute("transform","matrix("+i._matrix.join(" ")+")")}},_getScale:function(t){return this._map?Math.pow(2,t)*this.options.ratio:1},_updatePath:function(){L.Rectangle.prototype._updatePath.call(this);this._updatePosition()},toGeoJSON:function(){var t=L.Rectangle.prototype.toGeoJSON.call(this);t.properties.text=this._text}})},{}],6:[function(t,e,i){L.DomUtil.setSize=L.DomUtil.setSize||function(t,e){t.style.width=e.x+"px";t.style.height=e.y+"px";return this}},{}]},{},[1])(1)});