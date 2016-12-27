(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.smartlabelManager = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lib = require('./lib');

var _lib2 = _interopRequireDefault(_lib);

var slLib = _lib2['default'].init(typeof window !== "undefined" ? window : undefined),
    doc = slLib.win.document,
    documentSupport = slLib.getDocumentSupport(),
    SVG_BBOX_CORRECTION = documentSupport.isWebKit ? 0 : 4.5;

function ContainerManager(parentContainer, isBrowserLess, maxContainers) {
    var svg;

    maxContainers = maxContainers > 5 ? maxContainers : 5;
    maxContainers = maxContainers < 20 ? maxContainers : 20;

    this.maxContainers = maxContainers;
    this.first = null;
    this.last = null;
    this.containers = {};
    this.length = 0;
    this.rootNode = parentContainer;

    if (isBrowserLess) {
        svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttributeNS('http://www.w3.org/2000/svg', 'xlink', 'http://www.w3.org/1999/xlink');
        svg.setAttributeNS('http://www.w3.org/2000/svg', 'height', '0');
        svg.setAttributeNS('http://www.w3.org/2000/svg', 'width', '0');
        this.svgRoot = svg;
        this.rootNode.appendChild(svg);
    }
}

ContainerManager.prototype.get = function (style) {
    var diff,
        key,
        containerObj,
        containers = this.containers,
        len = this.length,
        max = this.maxContainers,
        keyStr = '';

    for (key in slLib.supportedStyle) {
        if (style[key] !== undefined) {
            keyStr += slLib.supportedStyle[key] + ':' + style[key] + ';';
        }
    }

    if (!keyStr) {
        return false;
    }

    if (containerObj = containers[keyStr]) {
        if (this.first !== containerObj) {
            containerObj.prev && (containerObj.prev.next = containerObj.next);
            containerObj.next && (containerObj.next.prev = containerObj.prev);
            containerObj.next = this.first;
            containerObj.next.prev = containerObj;
            this.last === containerObj && (this.last = containerObj.prev);
            containerObj.prev = null;
            this.first = containerObj;
        }
    } else {
        if (len >= max) {
            diff = len - max + 1;
            // +1 is to remove an extra entry to make space for the new container to be added.
            while (diff--) {
                this.removeContainer(this.last);
            }
        }
        containerObj = this.addContainer(keyStr);
    }

    return containerObj;
};

ContainerManager.prototype.addContainer = function (keyStr) {
    var node, container;

    this.containers[keyStr] = container = {
        next: null,
        prev: null,
        node: null,
        ellipsesWidth: 0,
        lineHeight: 0,
        dotWidth: 0,
        avgCharWidth: 4,
        keyStr: keyStr,
        charCache: {}
    };

    // Since the container objects are arranged from most recent to least recent order, we need to add the new
    // object at the beginning of the list.
    container.next = this.first;
    container.next && (container.next.prev = container);
    this.first = container;
    if (!this.last) {
        this.last = container;
    }
    this.length += 1;

    node = container.node = doc.createElement('div');
    this.rootNode.appendChild(node);

    if (documentSupport.isIE && !documentSupport.hasSVG) {
        node.style.setAttribute('cssText', keyStr);
    } else {
        node.setAttribute('style', keyStr);
    }

    node.setAttribute('aria-hidden', 'true');
    node.setAttribute('role', 'presentation');
    node.style.display = 'inline-block';

    node.innerHTML = slLib.testStrAvg; // A test string.
    container.lineHeight = node.offsetHeight;
    container.avgCharWidth = node.offsetWidth / 3;

    if (documentSupport.isBrowserLess) {
        node = container.svgText = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
        node.setAttribute('style', keyStr);
        this.svgRoot.appendChild(node);

        node.textContent = slLib.testStrAvg; // A test string.
        container.lineHeight = node.getBBox().height;
        container.avgCharWidth = (node.getBBox().width - SVG_BBOX_CORRECTION) / 3;

        node.textContent = '...';
        container.ellipsesWidth = node.getBBox().width - SVG_BBOX_CORRECTION;
        node.textContent = '.';
        container.dotWidth = node.getBBox().width - SVG_BBOX_CORRECTION;
    } else {
        node.innerHTML = '...';
        container.ellipsesWidth = node.offsetWidth;
        node.innerHTML = '.';
        container.dotWidth = node.offsetWidth;
        node.innerHTML = '';
    }

    return container;
};

ContainerManager.prototype.removeContainer = function (cObj) {
    var keyStr = cObj.keyStr;

    if (!keyStr || !this.length || !cObj) {
        return;
    }
    this.length -= 1;

    cObj.prev && (cObj.prev.next = cObj.next);
    cObj.next && (cObj.next.prev = cObj.prev);
    this.first === cObj && (this.first = cObj.next);
    this.last === cObj && (this.last = cObj.prev);

    cObj.node.parentNode.removeChild(cObj.node);

    delete this.containers[keyStr];
};

ContainerManager.prototype.dispose = function () {
    var key,
        containers = this.containers;

    this.maxContainers = null;
    for (key in containers) {
        this.removeContainer(containers[key]);
    }

    this.rootNode.parentNode.removeChild(this.rootNode);

    this.rootNode = null;
    this.first = null;
    this.last = null;
};

module.exports = ContainerManager;

},{"./lib":2}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});
var lib = {
	init: function init(win) {
		var doc = win.document,
		    nav = win.navigator,
		    userAgent = nav.userAgent,
		    DIV = 'DIV',
		    ceil = Math.ceil,
		    floor = Math.floor,
		    containerInstanceCount = 0,
		    clsNameSpace = 'fusioncharts-smartlabel-',
		    containerClass = clsNameSpace + 'container',
		    classNameWithTag = clsNameSpace + 'tag',
		    classNameWithTagBR = clsNameSpace + 'br';

		lib = {
			win: win,

			containerClass: containerClass,

			classNameWithTag: classNameWithTag,

			classNameWithTagBR: classNameWithTagBR,

			maxDefaultCacheLimit: 500,

			classNameReg: new RegExp('\b' + classNameWithTag + '\b'),

			classNameBrReg: new RegExp('\b' + classNameWithTagBR + '\b'),

			spanAdditionRegx: /(<[^<\>]+?\>)|(&(?:[a-z]+|#[0-9]+);|.)/ig,

			spanAdditionReplacer: '$1<span class="' + classNameWithTag + '">$2</span>',

			spanRemovalRegx: new RegExp('\\<span[^\\>]+?' + classNameWithTag + '[^\\>]{0,}\\>(.*?)\\<\\/span\\>', 'ig'),

			xmlTagRegEx: new RegExp('<[^>][^<]*[^>]+>', 'i'),

			ltgtRegex: /&lt;|&gt;/g,

			brReplaceRegex: /<br\/>/ig,

			testStrAvg: 'WgI',

			// This style is applied over the parent smartlabel container. The container is kept hidden from the viewport
			parentContainerStyle: {
				position: 'absolute',
				top: '-9999em',
				whiteSpace: 'nowrap',
				padding: '0px',
				width: '1px',
				height: '1px',
				overflow: 'hidden'
			},

			// All the style which might affect the text metrics
			supportedStyle: {
				font: 'font',
				fontFamily: 'font-family',
				'font-family': 'font-family',
				fontWeight: 'font-weight',
				'font-weight': 'font-weight',
				fontSize: 'font-size',
				'font-size': 'font-size',
				lineHeight: 'line-height',
				'line-height': 'line-height',
				fontStyle: 'font-style',
				'font-style': 'font-style'
			},

			// Get the support list for html the document where the text calcution is to be done.
			getDocumentSupport: function getDocumentSupport() {
				var childRetriverFn, childRetriverString, noClassTesting;

				if (doc.getElementsByClassName) {
					childRetriverFn = 'getElementsByClassName';
					childRetriverString = classNameWithTag;
					noClassTesting = true;
				} else {
					childRetriverFn = 'getElementsByTagName';
					childRetriverString = 'span';
					noClassTesting = false;
				}

				return {
					isIE: /msie/i.test(userAgent) && !win.opera,
					hasSVG: Boolean(win.SVGAngle || doc.implementation.hasFeature('http://www.w3.org/TR/SVG11/feature#BasicStructure', '1.1')),
					isHeadLess: new RegExp(' HtmlUnit').test(userAgent),
					isWebKit: new RegExp(' AppleWebKit/').test(userAgent),
					childRetriverFn: childRetriverFn,
					childRetriverString: childRetriverString,
					noClassTesting: noClassTesting
				};
			},

			/*
    * Create a html div element and attach it with a parent. All the subsequent operations are performed
    * by upding this dom tree only.
    *
    * @param {HTMLElement} - The html element where the newly created div is to be attached. If not passed,
    *                      the new div is appended on the body.
    */
			createContainer: function createContainer(containerParent) {
				var body, container;

				if (containerParent && (containerParent.offsetWidth || containerParent.offsetHeight)) {
					if (containerParent.appendChild) {
						containerParent.appendChild(container = doc.createElement(DIV));
						container.className = containerClass;
						container.setAttribute('aria-hidden', 'true');
						container.setAttribute('role', 'presentation');
						return container;
					}
				} else {
					body = doc.getElementsByTagName('body')[0];

					if (body && body.appendChild) {
						container = doc.createElement(DIV);
						container.className = containerClass;
						container.setAttribute('aria-hidden', 'true');
						container.setAttribute('role', 'presentation');
						containerInstanceCount += 1;
						body.appendChild(container);
						return container;
					}
				}
			},

			// Finds a approximate position where the text is to be broken
			getNearestBreakIndex: function getNearestBreakIndex(text, maxWidth, sl) {
				if (!text || !text.length) {
					return 0;
				}

				var difference,
				    getWidth = sl._getWidthFn(),
				    charLen = 0,
				    increment = 0,
				    oriWidth = getWidth(text),
				    avgWidth = oriWidth / text.length;

				difference = maxWidth;
				charLen = ceil(maxWidth / avgWidth);

				if (oriWidth < maxWidth) {
					return text.length - 1;
				}

				if (charLen > text.length) {
					difference = maxWidth - oriWidth;
					charLen = text.length;
				}

				while (difference > 0) {
					difference = maxWidth - getWidth(text.substr(0, charLen));
					increment = floor(difference / avgWidth);
					if (increment) {
						charLen += increment;
					} else {
						return charLen;
					}
				}

				while (difference < 0) {
					difference = maxWidth - getWidth(text.substr(0, charLen));
					increment = floor(difference / avgWidth);
					if (increment) {
						charLen += increment;
					} else {
						return charLen;
					}
				}
				return charLen;
			},

			/*
    * Determine lineheight of a text for a given style. It adds propery lineHeight to the style passed
    *
    * @param {Object} - The style based on which the text's metric needs to be calculated. The calculation happens
    *                  based on fontSize property, if its not present a default font size is assumed.
    *
    * @return {Object} - The style that was passed with lineHeight as a named propery set on the object.
    */
			setLineHeight: function setLineHeight(styleObj) {
				var fSize = styleObj.fontSize = styleObj.fontSize || '12px';
				styleObj.lineHeight = styleObj.lineHeight || styleObj['line-height'] || parseInt(fSize, 10) * 1.2 + 'px';
				return styleObj;
			}
		};

		return lib;
	}
};

exports['default'] = lib;
module.exports = exports['default'];

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lib = require('./lib');

var _lib2 = _interopRequireDefault(_lib);

var _containerManager = require('./container-manager');

var _containerManager2 = _interopRequireDefault(_containerManager);

var slLib = _lib2['default'].init(typeof window !== "undefined" ? window : undefined),
    doc = slLib.win.document,
    M = slLib.win.Math,
    max = M.max,
    round = M.round,
    BLANK = '',
    htmlSplCharSpace = { ' ': '&nbsp;' },
    documentSupport = slLib.getDocumentSupport(),
    SVG_BBOX_CORRECTION = documentSupport.isWebKit ? 0 : 4.5;

/*
 * Create new instance of SmartLabelManager.
 *
 * SmartLabelManager controls the lifetime of the execution space where the text's metrics will be calculated.
 * This takes a string for a given style and returns the height, width.
 * If a bound box is defined it wraps the text and returns the wrapped height and width.
 * It allows to append ellipsis at the end if the text is truncated.
 *
 * @param {String | Number} id - Id of the instance. If the same id is passed, it disposes the old instance and
 *                              save the new one;
 * @param {String | HTMLElement} container - The id or the instance of the container where the intermediate dom
 *                              elements are to be attached. If not passed, it appends in div
 *
 * @param {Boolean} useEllipses - This decides if a ellipses to be appended if the text is truncated.
 * @param {Object} options - Control options
 *                          {
 *                              maxCacheLimit: No of letter to be cached. Default: 500.
 *                          }
 * @constructor
 */
function SmartLabelManager(id, container, useEllipses, options) {
    var wrapper,
        prop,
        max,
        prevInstance,
        isBrowserLess = false,
        store = SmartLabelManager.store;

    if (typeof id === 'undefined' || typeof id === 'object') {
        return;
    }

    if (prevInstance = store[id]) {
        prevInstance.dispose();
    }

    store[id] = this;
    options = options || {};
    options.maxCacheLimit = isFinite(max = options.maxCacheLimit) ? max : slLib.maxDefaultCacheLimit;

    if (typeof container === 'string') {
        container = doc.getElementById(container);
    }

    wrapper = slLib.createContainer(container);
    wrapper.innerHTML = slLib.testStrAvg;

    if (documentSupport.isHeadLess || !documentSupport.isIE && !wrapper.offsetHeight && !wrapper.offsetWidth) {
        isBrowserLess = true;
    }

    wrapper.innerHTML = '';
    for (prop in slLib.parentContainerStyle) {
        wrapper.style[prop] = slLib.parentContainerStyle[prop];
    }

    this.id = id;
    this.parentContainer = wrapper;

    this._containerManager = new _containerManager2['default'](wrapper, isBrowserLess, 10);
    this._showNoEllipses = !useEllipses;
    this._init = true;
    this.style = {};
    this.options = options;

    this.setStyle();
}

/*
 * getSmartText returns the text separated by <br/> whenever a break is necessary. This is to recgonize one
 * generalized format independent of the implementation (canvas based solution, svg based solution). This method
 * converts the output of getSmartText().text to array of lines if the text is wrapped. It sets a named property
 * `lines` on the object passed as parameter.
 *
 * @param {Object} smartlabel - the object returned by getSmartText based on which line arr which to be formed.
 *
 * @return {Object} - The same object which was passed in the arguments. Also a named property `lines` is set.
 */
SmartLabelManager.textToLines = function (smartlabel) {
    smartlabel = smartlabel || {};

    if (!smartlabel.text) {
        smartlabel.text = '';
    } else if (typeof smartlabel.text !== 'string') {
        smartlabel.text = smartlabel.text.toString();
    }

    smartlabel.lines = smartlabel.text.split(/\n|<br\s*?\/?>/ig);
    return smartlabel;
};

// Saves all the instance created so far
SmartLabelManager.store = {};

// Calculates space taken by a character with an approximation value which is calculated by repeating the
// character by string length times.
SmartLabelManager.prototype._calCharDimWithCache = function (text, calculateDifference, length) {
    if (!this._init) {
        return false;
    }

    var size,
        csArr,
        tw,
        twi,
        cachedStyle,
        asymmetricDifference,
        maxAdvancedCacheLimit = this.options.maxCacheLimit,
        container = this._container,
        style = this.style || {},
        cache = this._advancedCache || (this._advancedCache = {}),
        advancedCacheKey = this._advancedCacheKey || (this._advancedCacheKey = []),
        cacheName = text + (style.fontSize || BLANK) + (style.fontFamily || BLANK) + (style.fontWeight || BLANK) + (style.fontStyle || BLANK),
        cacheInitName = text + 'init' + (style.fontSize || BLANK) + (style.fontFamily || BLANK) + (style.fontWeight || BLANK) + (style.fontStyle || BLANK);

    htmlSplCharSpace[text] && (text = htmlSplCharSpace[text]);

    if (!calculateDifference) {
        asymmetricDifference = 0;
    } else {
        if ((asymmetricDifference = cache[cacheInitName]) === undefined) {
            container.innerHTML = text.repeat ? text.repeat(length) : Array(length + 1).join(text); // jshint ignore:line
            tw = container.offsetWidth;

            container.innerHTML = text;
            twi = container.offsetWidth;

            asymmetricDifference = cache[cacheInitName] = (tw - length * twi) / (length + 1);
            advancedCacheKey.push(cacheInitName);
            if (advancedCacheKey.length > maxAdvancedCacheLimit) {
                delete cache[advancedCacheKey.shift()];
            }
        }
    }

    if (cachedStyle = cache[cacheName]) {
        csArr = cachedStyle.split(',');
        return {
            width: parseFloat(csArr[0], 10),
            height: parseFloat(csArr[1], 10)
        };
    }

    container.innerHTML = text;

    size = {
        height: container.offsetHeight,
        width: container.offsetWidth + asymmetricDifference
    };

    cache[cacheName] = size.width + ',' + size.height;
    advancedCacheKey.push(cacheName);
    if (advancedCacheKey.length > maxAdvancedCacheLimit) {
        delete cache[advancedCacheKey.shift()];
    }

    return size;
};

// Provide function to calculate the height and width based on the environment and available support from dom.
SmartLabelManager.prototype._getWidthFn = function () {
    var contObj = this._containerObj,
        container = this._container,
        svgText = contObj.svgText;

    if (svgText) {
        return function (str) {
            var bbox, width;

            svgText.textContent = str;
            bbox = svgText.getBBox();
            width = bbox.width - SVG_BBOX_CORRECTION;
            if (width < 1) {
                width = bbox.width;
            }

            return width;
        };
    } else {
        return function (str) {
            container.innerHTML = str;
            return container.offsetWidth;
        };
    }
};

/*
 * Sets the style based on which the text's metrics to be calculated.
 *
 * @param {Object} style - The style object which affects the text size
 *                      {
 *                          fontSize / 'font-size' : MUST BE FOLLOWED BY PX (10px, 11px)
 *                          fontFamily / 'font-family'
 *                          fontWeight / 'font-weight'
 *                          fontStyle / 'font-style'
 *                      }
 *
 * @return {SmartLabelManager} - Current instance of SmartLabelManager
 */
SmartLabelManager.prototype.setStyle = function (style) {
    if (!this._init) {
        return this;
    }

    var sCont;

    if (style === this.style && !this._styleNotSet) {
        return;
    }

    if (!style) {
        style = this.style;
    }

    slLib.setLineHeight(style);
    this.style = style;

    this._containerObj = sCont = this._containerManager.get(style);

    if (this._containerObj) {
        this._container = sCont.node;
        this._context = sCont.context;
        this._cache = sCont.charCache;
        this._lineHeight = sCont.lineHeight;
        this._styleNotSet = false;
    } else {
        this._styleNotSet = true;
    }

    return this;
};

/*
 * Decides whether ellipses to be shown if the node is truncated
 *
 * @param {Boolean} useEllipses - decides if a ellipses to be appended if the text is truncated. Default: false
 *
 * @return {SmartLabelManager} - Current instance of SmartLabelManager
 */
SmartLabelManager.prototype.useEllipsesOnOverflow = function (useEllipses) {
    if (!this._init) {
        return this;
    }
    this._showNoEllipses = !useEllipses;
    return this;
};

/*
 * Get wrapped or truncated text if a bound box is defined around it. The result text would be separated by <br/>
 * if wrapped
 *
 * @param {String} text - the subject text
 * @param {Number} maxWidth - width in px of the the bound box
 * @param {Number} maxHeight - height in px of the the bound box
 * @param {Boolean} noWrap - whether the text to be wrapped. Default false.
 *
 * @return {Object} - The metrics of the text bounded by the box
 *                  {
 *                      height : height of the wrapped text
 *                      width : width of the wrapped text
 *                      isTruncated : whether the text is truncated
 *                      maxHeight : Maximum height given
 *                      maxWidth : Maximum width given
 *                      oriText : Original text sent
 *                      oriTextHeight : Original text height
 *                      oriTextWidth : Original text width
 *                      text : SMART TEXT
 *                  }
 */
SmartLabelManager.prototype.getSmartText = function (text, maxWidth, maxHeight, noWrap) {
    if (!this._init) {
        return false;
    }

    if (text === undefined || text === null) {
        text = '';
    } else if (typeof text !== 'string') {
        text = text.toString();
    }

    var len,
        trimStr,
        tempArr,
        tmpText,
        maxWidthWithEll,
        toolText,
        oriWidth,
        oriHeight,
        newCharIndex,
        nearestChar,
        tempChar,
        getWidth,
        initialLeft,
        initialTop,
        getOriSizeImproveObj,
        spanArr,
        x,
        y,
        minWidth,
        elem,
        chr,
        elemRightMostPoint,
        elemLowestPoint,
        lastBR,
        removeFromIndex,
        removeFromIndexForEllipses,
        hasHTMLTag = false,
        maxStrWidth = 0,
        lastDash = -1,
        lastSpace = -1,
        lastIndexBroken = -1,
        strWidth = 0,
        strHeight = 0,
        oriTextArr = [],
        i = 0,
        ellipsesStr = this._showNoEllipses ? '' : '...',
        lineHeight = this._lineHeight,
        context = this._context,
        container = this._container,
        sCont = this._containerObj,
        ellipsesWidth = sCont.ellipsesWidth,
        dotWidth = sCont.dotWidth,
        characterArr = [],
        dashIndex = -1,
        spaceIndex = -1,
        lastLineBreak = -1,
        fastTrim = function fastTrim(str) {
        str = str.replace(/^\s\s*/, '');
        var ws = /\s/,
            i = str.length;
        while (ws.test(str.charAt(i -= 1))) {/* jshint noempty:false */}
        return str.slice(0, i + 1);
    },
        smartLabel = {
        text: text,
        maxWidth: maxWidth,
        maxHeight: maxHeight,
        width: null,
        height: null,
        oriTextWidth: null,
        oriTextHeight: null,
        oriText: text,
        isTruncated: false
    };

    getWidth = this._getWidthFn();

    // In some browsers, offsetheight of a single-line text is getting little (1 px) heigher value of the
    // lineheight. As a result, smartLabel is unable to return single-line text.
    // To fix this, increase the maxHeight a little amount. Hence maxHeight =  lineHeight * 1.2
    if (maxHeight === lineHeight) {
        maxHeight *= 1.2;
    }

    if (container) {
        if (!documentSupport.isBrowserLess) {
            hasHTMLTag = slLib.xmlTagRegEx.test(text);
            if (!hasHTMLTag) {
                // Due to support of <,> for xml we convert &lt;, &gt; to <,> respectively so to get the correct
                // width it is required to convert the same before calculation for the new improve version of the
                // get text width.
                tmpText = text.replace(slLib.ltgtRegex, function (match) {
                    return match === '&lt;' ? '<' : '>';
                });
                getOriSizeImproveObj = this.getOriSize(tmpText, true);

                smartLabel.oriTextWidth = oriWidth = getOriSizeImproveObj.width;
                smartLabel.oriTextHeight = oriHeight = getOriSizeImproveObj.height;
            } else {
                container.innerHTML = text;
                smartLabel.oriTextWidth = oriWidth = container.offsetWidth;
                smartLabel.oriTextHeight = oriHeight = container.offsetHeight;
            }

            if (oriHeight <= maxHeight && oriWidth <= maxWidth) {
                smartLabel.width = smartLabel.oriTextWidth = oriWidth;
                smartLabel.height = smartLabel.oriTextHeight = oriHeight;
                return smartLabel;
            }

            if (lineHeight > maxHeight) {
                smartLabel.text = '';
                smartLabel.width = smartLabel.oriTextWidth = 0;
                smartLabel.height = smartLabel.oriTextHeight = 0;
                return smartLabel;
            }
        }

        // Calculate width with ellipses
        text = fastTrim(text).replace(/(\s+)/g, ' ');
        maxWidthWithEll = this._showNoEllipses ? maxWidth : maxWidth - ellipsesWidth;

        if (!hasHTMLTag) {
            oriTextArr = text.split('');
            len = oriTextArr.length;
            trimStr = '', tempArr = [];
            tempChar = oriTextArr[0];

            if (this._cache[tempChar]) {
                minWidth = this._cache[tempChar].width;
            } else {
                minWidth = getWidth(tempChar);
                this._cache[tempChar] = { width: minWidth };
            }

            if (maxWidthWithEll > minWidth) {
                tempArr = text.substr(0, slLib.getNearestBreakIndex(text, maxWidthWithEll, this)).split('');
                i = tempArr.length;
            } else if (minWidth > maxWidth) {
                smartLabel.text = '';
                smartLabel.width = smartLabel.oriTextWidth = smartLabel.height = smartLabel.oriTextHeight = 0;
                return smartLabel;
            } else if (ellipsesStr) {
                maxWidthWithEll = maxWidth - 2 * dotWidth;
                if (maxWidthWithEll > minWidth) {
                    ellipsesStr = '..';
                } else {
                    maxWidthWithEll = maxWidth - dotWidth;
                    if (maxWidthWithEll > minWidth) {
                        ellipsesStr = '.';
                    } else {
                        maxWidthWithEll = 0;
                        ellipsesStr = '';
                    }
                }
            }

            strWidth = getWidth(tempArr.join(''));
            strHeight = this._lineHeight;

            if (noWrap) {
                for (; i < len; i += 1) {
                    tempChar = tempArr[i] = oriTextArr[i];
                    if (this._cache[tempChar]) {
                        minWidth = this._cache[tempChar].width;
                    } else {
                        if (!getOriSizeImproveObj || !(minWidth = getOriSizeImproveObj.detailObj[tempChar])) {
                            minWidth = getWidth(tempChar);
                        }
                        this._cache[tempChar] = {
                            width: minWidth
                        };
                    }
                    strWidth += minWidth;
                    if (strWidth > maxWidthWithEll) {
                        if (!trimStr) {
                            trimStr = tempArr.slice(0, -1).join('');
                        }
                        if (strWidth > maxWidth) {
                            smartLabel.text = fastTrim(trimStr) + ellipsesStr;
                            smartLabel.tooltext = smartLabel.oriText;
                            smartLabel.width = getWidth(smartLabel.text);
                            smartLabel.height = this._lineHeight;
                            return smartLabel;
                        }
                    }
                }

                smartLabel.text = tempArr.join('');
                smartLabel.width = strWidth;
                smartLabel.height = this._lineHeight;
                return smartLabel;
            } else {
                for (; i < len; i += 1) {
                    tempChar = tempArr[i] = oriTextArr[i];
                    if (tempChar === ' ' && !context) {
                        tempChar = '&nbsp;';
                    }

                    if (this._cache[tempChar]) {
                        minWidth = this._cache[tempChar].width;
                    } else {
                        if (!getOriSizeImproveObj || !(minWidth = getOriSizeImproveObj.detailObj[tempChar])) {
                            minWidth = getWidth(tempChar);
                        }
                        this._cache[tempChar] = {
                            width: minWidth
                        };
                    }
                    strWidth += minWidth;

                    if (strWidth > maxWidthWithEll) {
                        if (!trimStr) {
                            trimStr = tempArr.slice(0, -1).join('');
                        }
                        if (strWidth > maxWidth) {
                            /** @todo use regular expressions for better performance. */
                            lastSpace = text.substr(0, tempArr.length).lastIndexOf(' ');
                            lastDash = text.substr(0, tempArr.length).lastIndexOf('-');
                            if (lastSpace > lastIndexBroken) {
                                strWidth = getWidth(tempArr.slice(lastIndexBroken + 1, lastSpace).join(''));
                                tempArr.splice(lastSpace, 1, '<br/>');
                                lastIndexBroken = lastSpace;
                                newCharIndex = lastSpace + 1;
                            } else if (lastDash > lastIndexBroken) {
                                if (lastDash === tempArr.length - 1) {
                                    strWidth = getWidth(tempArr.slice(lastIndexBroken + 1, lastSpace).join(''));
                                    tempArr.splice(lastDash, 1, '<br/>-');
                                } else {
                                    strWidth = getWidth(tempArr.slice(lastIndexBroken + 1, lastSpace).join(''));
                                    tempArr.splice(lastDash, 1, '-<br/>');
                                }
                                lastIndexBroken = lastDash;
                                newCharIndex = lastDash + 1;
                            } else {
                                tempArr.splice(tempArr.length - 1, 1, '<br/>' + oriTextArr[i]);
                                lastLineBreak = tempArr.length - 2;
                                strWidth = getWidth(tempArr.slice(lastIndexBroken + 1, lastLineBreak + 1).join(''));
                                lastIndexBroken = lastLineBreak;
                                newCharIndex = i;
                            }
                            strHeight += this._lineHeight;
                            if (strHeight > maxHeight) {
                                smartLabel.text = fastTrim(trimStr) + ellipsesStr;
                                smartLabel.tooltext = smartLabel.oriText;
                                // The max width among all the lines will be the width of the string.
                                smartLabel.width = maxWidth;
                                smartLabel.height = strHeight - this._lineHeight;
                                return smartLabel;
                            } else {
                                maxStrWidth = max(maxStrWidth, strWidth);
                                trimStr = null;
                                nearestChar = slLib.getNearestBreakIndex(text.substr(newCharIndex), maxWidthWithEll, this);
                                strWidth = getWidth(text.substr(newCharIndex, nearestChar || 1));
                                if (tempArr.length < newCharIndex + nearestChar) {
                                    tempArr = tempArr.concat(text.substr(tempArr.length, newCharIndex + nearestChar - tempArr.length).split(''));
                                    i = tempArr.length - 1;
                                }
                            }
                        }
                    }
                }

                maxStrWidth = max(maxStrWidth, strWidth);

                smartLabel.text = tempArr.join('');
                smartLabel.width = maxStrWidth;
                smartLabel.height = strHeight;
                return smartLabel;
            }
        } else {
            toolText = text.replace(slLib.spanAdditionRegx, '$2');
            text = text.replace(slLib.spanAdditionRegx, slLib.spanAdditionReplacer);
            text = text.replace(/(<br\s*\/*\>)/g, '<span class="' + [slLib.classNameWithTag, ' ', slLib.classNameWithTagBR].join('') + '">$1</span>');

            container.innerHTML = text;

            spanArr = container[documentSupport.childRetriverFn](documentSupport.childRetriverString);

            for (x = 0, y = spanArr.length; x < y; x += 1) {
                elem = spanArr[x];
                //chech whether this span is temporary inserted span from it's class
                if (documentSupport.noClassTesting || slLib.classNameReg.test(elem.className)) {
                    chr = elem.innerHTML;
                    if (chr !== '') {
                        if (chr === ' ') {
                            spaceIndex = characterArr.length;
                        } else if (chr === '-') {
                            dashIndex = characterArr.length;
                        }

                        characterArr.push({
                            spaceIdx: spaceIndex,
                            dashIdx: dashIndex,
                            elem: elem
                        });
                        oriTextArr.push(chr);
                    }
                }
            }

            i = 0;
            len = characterArr.length;
            minWidth = characterArr[0].elem.offsetWidth;

            if (minWidth > maxWidth) {
                smartLabel.text = '';
                smartLabel.width = smartLabel.oriTextWidth = smartLabel.height = smartLabel.oriTextHeight = 0;

                return smartLabel;
            } else if (minWidth > maxWidthWithEll && !this._showNoEllipses) {

                maxWidthWithEll = maxWidth - 2 * dotWidth;
                if (maxWidthWithEll > minWidth) {
                    ellipsesStr = '..';
                } else {
                    maxWidthWithEll = maxWidth - dotWidth;
                    if (maxWidthWithEll > minWidth) {
                        ellipsesStr = '.';
                    } else {
                        maxWidthWithEll = 0;
                        ellipsesStr = '';
                    }
                }
            }

            initialLeft = characterArr[0].elem.offsetLeft;
            initialTop = characterArr[0].elem.offsetTop;

            if (noWrap) {
                for (; i < len; i += 1) {
                    elem = characterArr[i].elem;
                    elemRightMostPoint = elem.offsetLeft - initialLeft + elem.offsetWidth;

                    if (elemRightMostPoint > maxWidthWithEll) {
                        if (!removeFromIndexForEllipses) {
                            removeFromIndexForEllipses = i;
                        }
                        if (container.offsetWidth > maxWidth) {
                            removeFromIndex = i;
                            i = len;
                        }
                    }
                }
            } else {
                for (; i < len; i += 1) {
                    elem = characterArr[i].elem;
                    elemLowestPoint = elem.offsetHeight + (elem.offsetTop - initialTop);
                    elemRightMostPoint = elem.offsetLeft - initialLeft + elem.offsetWidth;

                    lastBR = null;

                    if (elemRightMostPoint > maxWidthWithEll) {
                        if (!removeFromIndexForEllipses) {
                            removeFromIndexForEllipses = i;
                        }

                        if (elemRightMostPoint > maxWidth) {
                            lastSpace = characterArr[i].spaceIdx;
                            lastDash = characterArr[i].dashIdx;
                            if (lastSpace > lastIndexBroken) {
                                characterArr[lastSpace].elem.innerHTML = '<br/>';
                                lastIndexBroken = lastSpace;
                            } else if (lastDash > lastIndexBroken) {
                                if (lastDash === i) {
                                    // in case the overflowing character itself is the '-'
                                    characterArr[lastDash].elem.innerHTML = '<br/>-';
                                } else {
                                    characterArr[lastDash].elem.innerHTML = '-<br/>';
                                }
                                lastIndexBroken = lastDash;
                            } else {
                                elem.parentNode.insertBefore(lastBR = doc.createElement('br'), elem);
                            }

                            //check whether this break made current element outside the area height
                            if (elem.offsetHeight + elem.offsetTop > maxHeight) {
                                //remove the lastly inserted line break
                                if (lastBR) {
                                    lastBR.parentNode.removeChild(lastBR);
                                } else if (lastIndexBroken === lastDash) {
                                    characterArr[lastDash].elem.innerHTML = '-';
                                } else {
                                    characterArr[lastSpace].elem.innerHTML = ' ';
                                }
                                removeFromIndex = i;
                                //break the looping condition
                                i = len;
                            } else {
                                removeFromIndexForEllipses = null;
                            }
                        }
                    } else {
                        //check whether this break made current element outside the area height
                        if (elemLowestPoint > maxHeight) {
                            removeFromIndex = i;
                            i = len;
                        }
                    }
                }
            }

            if (removeFromIndex < len) {
                //set the trancated property of the smartlabel
                smartLabel.isTruncated = true;

                /** @todo is this really needed? */
                removeFromIndexForEllipses = removeFromIndexForEllipses ? removeFromIndexForEllipses : removeFromIndex;

                for (i = len - 1; i >= removeFromIndexForEllipses; i -= 1) {
                    elem = characterArr[i].elem;
                    //chech whether this span is temporary inserted span from it's class
                    elem.parentNode.removeChild(elem);
                }

                for (; i >= 0; i -= 1) {
                    elem = characterArr[i].elem;
                    if (slLib.classNameBrReg.test(elem.className)) {
                        //chech whether this span is temporary inserted span from it's class
                        elem.parentNode.removeChild(elem);
                    } else {
                        i = 0;
                    }
                }
            }

            //get the smart text
            smartLabel.text = container.innerHTML.replace(slLib.spanRemovalRegx, '$1').replace(/\&amp\;/g, '&');
            if (smartLabel.isTruncated) {
                smartLabel.text += ellipsesStr;
                smartLabel.tooltext = toolText;
            }
        }

        smartLabel.height = container.offsetHeight;
        smartLabel.width = container.offsetWidth;

        return smartLabel;
    } else {
        smartLabel.error = new Error('Body Tag Missing!');
        return smartLabel;
    }
};

/*
 * Get the height and width of a text.
 *
 * @param {String} text - Text whose metrics to be measured
 * @param {Boolean} Optional detailedCalculationFlag - this flag if set it calculates per letter position
 *                          information and returns it. Ideally you dont need it unless you want to post process the
 *                          string. And its an EXPENSIVE OPERATION.
 *
 * @return {Object} - If detailedCalculationFlag is set to true the returned object would be
 *                  {
 *                      height: height of the text
 *                      width: width of the text
 *                      detailObj: detail calculation of letters in the format {lettername: width}
 *                  }
 *                  If detailedCalculationFlag is set to false the returned object wont have the detailObj prop.
 */
SmartLabelManager.prototype.getOriSize = function (text, detailedCalculationFlag) {
    if (!this._init) {
        return false;
    }

    var textArr,
        letter,
        lSize,
        i,
        l,
        cumulativeSize = 0,
        height = 0,
        indiSizeStore = {};

    if (!detailedCalculationFlag) {
        return this._calCharDimWithCache(text);
    }

    // Calculate the width of every letter with an approximation
    textArr = text.split('');
    for (i = 0, l = textArr.length; i < l; i++) {
        letter = textArr[i];
        lSize = this._calCharDimWithCache(letter, true, textArr.length);
        height = max(height, lSize.height);
        cumulativeSize += lSize.width;
        indiSizeStore[letter] = lSize.width;
    }

    return {
        width: round(cumulativeSize),
        height: height,
        detailObj: indiSizeStore
    };
};

/*
 * Dispose the container and object allocated by the smartlabel
 */
SmartLabelManager.prototype.dispose = function () {
    if (!this._init) {
        return this;
    }

    this._containerManager && this._containerManager.dispose && this._containerManager.dispose();

    delete this._container;
    delete this._context;
    delete this._cache;
    delete this._containerManager;
    delete this._containerObj;
    delete this.id;
    delete this.style;
    delete this.parentContainer;
    delete this._showNoEllipses;

    return this;
};

exports['default'] = SmartLabelManager;
module.exports = exports['default'];

},{"./container-manager":1,"./lib":2}]},{},[3])(3)
});