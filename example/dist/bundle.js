require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}],"fusioncharts-smartlabel":[function(require,module,exports){
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

},{"./container-manager":1,"./lib":2}]},{},[])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvYWthc2hnb3N3YW1pL0Z1c2lvbkNoYXJ0cy9Db2RlYmFzZS9mdXNpb25jaGFydHMtc21hcnRsYWJlbC9zcmMvY29udGFpbmVyLW1hbmFnZXIuanMiLCIvVXNlcnMvYWthc2hnb3N3YW1pL0Z1c2lvbkNoYXJ0cy9Db2RlYmFzZS9mdXNpb25jaGFydHMtc21hcnRsYWJlbC9zcmMvbGliLmpzIiwiL1VzZXJzL2FrYXNoZ29zd2FtaS9GdXNpb25DaGFydHMvQ29kZWJhc2UvZnVzaW9uY2hhcnRzLXNtYXJ0bGFiZWwvc3JjL3NtYXJ0bGFiZWwtbWFuYWdlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7bUJDQWdCLE9BQU87Ozs7QUFFdkIsSUFBSSxLQUFLLEdBQUcsaUJBQUksSUFBSSxDQUFDLE9BQU8sTUFBTSxLQUFLLFdBQVcsR0FBRyxNQUFNLFlBQU8sQ0FBQztJQUMvRCxHQUFHLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRO0lBQ3hCLGVBQWUsR0FBRyxLQUFLLENBQUMsa0JBQWtCLEVBQUU7SUFDNUMsbUJBQW1CLEdBQUcsZUFBZSxDQUFDLFFBQVEsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDOztBQUU3RCxTQUFTLGdCQUFnQixDQUFFLGVBQWUsRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFFO0FBQ3RFLFFBQUksR0FBRyxDQUFDOztBQUVSLGlCQUFhLEdBQUcsYUFBYSxHQUFHLENBQUMsR0FBRyxhQUFhLEdBQUcsQ0FBQyxDQUFDO0FBQ3RELGlCQUFhLEdBQUcsYUFBYSxHQUFHLEVBQUUsR0FBRyxhQUFhLEdBQUcsRUFBRSxDQUFDOztBQUV4RCxRQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztBQUNuQyxRQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztBQUNsQixRQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztBQUNqQixRQUFJ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QUMsT0FBTyxHQUFHLFlBQVk7QUFDOUMsUUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUU7QUFDYixlQUFPLElBQUksQ0FBQztLQUNmOztBQUVELFFBQUksQ0FBQyxpQkFBaUIsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQzs7QUFFN0YsV0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO0FBQ3ZCLFdBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztBQUNyQixXQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDbkIsV0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUM7QUFDOUIsV0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDO0FBQzFCLFdBQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQztBQUNmLFdBQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztBQUNsQixXQUFPLElBQUksQ0FBQyxlQUFlLENBQUM7QUFDNUIsV0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDOztBQUU1QixXQUFPLElBQUksQ0FBQztDQUNmLENBQUM7O3FCQUVhLGlCQUFpQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgbGliIGZyb20gJy4vbGliJztcblxudmFyIHNsTGliID0gbGliLmluaXQodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHRoaXMpLFxuICAgIGRvYyA9IHNsTGliLndpbi5kb2N1bWVudCxcbiAgICBkb2N1bWVudFN1cHBvcnQgPSBzbExpYi5nZXREb2N1bWVudFN1cHBvcnQoKSxcbiAgICBTVkdfQkJPWF9DT1JSRUNUSU9OID0gZG9jdW1lbnRTdXBwb3J0LmlzV2ViS2l0ID8gMCA6IDQuNTtcblxuZnVuY3Rpb24gQ29udGFpbmVyTWFuYWdlciAocGFyZW50Q29udGFpbmVyLCBpc0Jyb3dzZXJMZXNzLCBtYXhDb250YWluZXJzKSB7XG4gICAgdmFyIHN2ZztcblxuICAgIG1heENvbnRhaW5lcnMgPSBtYXhDb250YWluZXJzID4gNSA/IG1heENvbnRhaW5lcnMgOiA1O1xuICAgIG1heENvbnRhaW5lcnMgPSBtYXhDb250YWluZXJzIDwgMjAgPyBtYXhDb250YWluZXJzIDogMjA7XG5cbiAgICB0aGlzLm1heENvbnRhaW5lcnMgPSBtYXhDb250YWluZXJzO1xuICAgIHRoaXMuZmlyc3QgPSBudWxsO1xuICAgIHRoaXMubGFzdCA9IG51bGw7XG4gICAgdGhpcy5jb250YWluZXJzID0ge307XG4gICAgdGhpcy5sZW5ndGggPSAwO1xuICAgIHRoaXMucm9vdE5vZGUgPSBwYXJlbnRDb250YWluZXI7XG5cbiAgICBpZiAoaXNCcm93c2VyTGVzcykge1xuICAgICAgICBzdmcgPSBkb2MuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsJ3N2ZycpO1xuICAgICAgICBzdmcuc2V0QXR0cmlidXRlTlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywneGxpbmsnLCdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJyk7XG4gICAgICAgIHN2Zy5zZXRBdHRyaWJ1dGVOUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCdoZWlnaHQnLCcwJyk7XG4gICAgICAgIHN2Zy5zZXRBdHRyaWJ1dGVOUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCd3aWR0aCcsJzAnKTtcbiAgICAgICAgdGhpcy5zdmdSb290ID0gc3ZnO1xuICAgICAgICB0aGlzLnJvb3ROb2RlLmFwcGVuZENoaWxkKHN2Zyk7XG4gICAgfVxufVxuXG5Db250YWluZXJNYW5hZ2VyLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoc3R5bGUpIHtcbiAgICB2YXIgZGlmZixcbiAgICAgICAga2V5LFxuICAgICAgICBjb250YWluZXJPYmosXG4gICAgICAgIGNvbnRhaW5lcnMgPSB0aGlzLmNvbnRhaW5lcnMsXG4gICAgICAgIGxlbiA9IHRoaXMubGVuZ3RoLFxuICAgICAgICBtYXggPSB0aGlzLm1heENvbnRhaW5lcnMsXG4gICAgICAgIGtleVN0ciA9ICcnO1xuXG4gICAgZm9yIChrZXkgaW4gc2xMaWIuc3VwcG9ydGVkU3R5bGUpIHtcbiAgICAgICAgaWYgKHN0eWxlW2tleV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAga2V5U3RyICs9IHNsTGliLnN1cHBvcnRlZFN0eWxlW2tleV0gKyAnOicgKyBzdHlsZVtrZXldICsgJzsnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFrZXlTdHIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChjb250YWluZXJPYmogPSBjb250YWluZXJzW2tleVN0cl0pIHtcbiAgICAgICAgaWYgKHRoaXMuZmlyc3QgIT09IGNvbnRhaW5lck9iaikge1xuICAgICAgICAgICAgY29udGFpbmVyT2JqLnByZXYgJiYgKGNvbnRhaW5lck9iai5wcmV2Lm5leHQgPSBjb250YWluZXJPYmoubmV4dCk7XG4gICAgICAgICAgICBjb250YWluZXJPYmoubmV4dCAmJiAoY29udGFpbmVyT2JqLm5leHQucHJldiA9IGNvbnRhaW5lck9iai5wcmV2KTtcbiAgICAgICAgICAgIGNvbnRhaW5lck9iai5uZXh0ID0gdGhpcy5maXJzdDtcbiAgICAgICAgICAgIGNvbnRhaW5lck9iai5uZXh0LnByZXYgPSBjb250YWluZXJPYmo7XG4gICAgICAgICAgICAodGhpcy5sYXN0ID09PSBjb250YWluZXJPYmopICYmICh0aGlzLmxhc3QgPSBjb250YWluZXJPYmoucHJldik7XG4gICAgICAgICAgICBjb250YWluZXJPYmoucHJldiA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLmZpcnN0ID0gY29udGFpbmVyT2JqO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGxlbiA+PSBtYXgpIHtcbiAgICAgICAgICAgIGRpZmYgPSAobGVuIC0gbWF4KSArIDE7XG4gICAgICAgICAgICAvLyArMSBpcyB0byByZW1vdmUgYW4gZXh0cmEgZW50cnkgdG8gbWFrZSBzcGFjZSBmb3IgdGhlIG5ldyBjb250YWluZXIgdG8gYmUgYWRkZWQuXG4gICAgICAgICAgICB3aGlsZSAoZGlmZi0tKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVDb250YWluZXIodGhpcy5sYXN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb250YWluZXJPYmogPSB0aGlzLmFkZENvbnRhaW5lcihrZXlTdHIpO1xuICAgIH1cblxuICAgIHJldHVybiBjb250YWluZXJPYmo7XG59O1xuXG5Db250YWluZXJNYW5hZ2VyLnByb3RvdHlwZS5hZGRDb250YWluZXIgPSBmdW5jdGlvbiAoa2V5U3RyKSB7XG4gICAgdmFyIG5vZGUsXG4gICAgICAgIGNvbnRhaW5lcjtcblxuICAgIHRoaXMuY29udGFpbmVyc1trZXlTdHJdID0gY29udGFpbmVyID0ge1xuICAgICAgICBuZXh0OiBudWxsLFxuICAgICAgICBwcmV2OiBudWxsLFxuICAgICAgICBub2RlOiBudWxsLFxuICAgICAgICBlbGxpcHNlc1dpZHRoOiAwLFxuICAgICAgICBsaW5lSGVpZ2h0OiAwLFxuICAgICAgICBkb3RXaWR0aDogMCxcbiAgICAgICAgYXZnQ2hhcldpZHRoOiA0LFxuICAgICAgICBrZXlTdHI6IGtleVN0cixcbiAgICAgICAgY2hhckNhY2hlOiB7fVxuICAgIH07XG5cbiAgICAvLyBTaW5jZSB0aGUgY29udGFpbmVyIG9iamVjdHMgYXJlIGFycmFuZ2VkIGZyb20gbW9zdCByZWNlbnQgdG8gbGVhc3QgcmVjZW50IG9yZGVyLCB3ZSBuZWVkIHRvIGFkZCB0aGUgbmV3XG4gICAgLy8gb2JqZWN0IGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIGxpc3QuXG4gICAgY29udGFpbmVyLm5leHQgPSB0aGlzLmZpcnN0O1xuICAgIGNvbnRhaW5lci5uZXh0ICYmIChjb250YWluZXIubmV4dC5wcmV2ID0gY29udGFpbmVyKTtcbiAgICB0aGlzLmZpcnN0ID0gY29udGFpbmVyO1xuICAgIGlmICghdGhpcy5sYXN0KSB7XG4gICAgICAgICh0aGlzLmxhc3QgPSBjb250YWluZXIpO1xuICAgIH1cbiAgICB0aGlzLmxlbmd0aCArPSAxO1xuXG4gICAgbm9kZSA9IGNvbnRhaW5lci5ub2RlID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMucm9vdE5vZGUuYXBwZW5kQ2hpbGQobm9kZSk7XG5cbiAgICBpZiAoZG9jdW1lbnRTdXBwb3J0LmlzSUUgJiYgIWRvY3VtZW50U3VwcG9ydC5oYXNTVkcpIHtcbiAgICAgICAgbm9kZS5zdHlsZS5zZXRBdHRyaWJ1dGUoJ2Nzc1RleHQnLCBrZXlTdHIpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywga2V5U3RyKTtcbiAgICB9XG5cbiAgICBub2RlLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgIG5vZGUuc2V0QXR0cmlidXRlKCdyb2xlJywgJ3ByZXNlbnRhdGlvbicpO1xuICAgIG5vZGUuc3R5bGUuZGlzcGxheSA9ICdpbmxpbmUtYmxvY2snO1xuXG4gICAgbm9kZS5pbm5lckhUTUwgPSBzbExpYi50ZXN0U3RyQXZnOyAvLyBBIHRlc3Qgc3RyaW5nLlxuICAgIGNvbnRhaW5lci5saW5lSGVpZ2h0ID0gbm9kZS5vZmZzZXRIZWlnaHQ7XG4gICAgY29udGFpbmVyLmF2Z0NoYXJXaWR0aCA9IChub2RlLm9mZnNldFdpZHRoIC8gMyk7XG5cbiAgICBpZiAoZG9jdW1lbnRTdXBwb3J0LmlzQnJvd3Nlckxlc3MpIHtcbiAgICAgICAgbm9kZSA9IGNvbnRhaW5lci5zdmdUZXh0ID0gZG9jLmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCAndGV4dCcpO1xuICAgICAgICBub2RlLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBrZXlTdHIpO1xuICAgICAgICB0aGlzLnN2Z1Jvb3QuYXBwZW5kQ2hpbGQobm9kZSk7XG5cbiAgICAgICAgbm9kZS50ZXh0Q29udGVudCA9IHNsTGliLnRlc3RTdHJBdmc7IC8vIEEgdGVzdCBzdHJpbmcuXG4gICAgICAgIGNvbnRhaW5lci5saW5lSGVpZ2h0ID0gbm9kZS5nZXRCQm94KCkuaGVpZ2h0O1xuICAgICAgICBjb250YWluZXIuYXZnQ2hhcldpZHRoID0gKChub2RlLmdldEJCb3goKS53aWR0aCAtIFNWR19CQk9YX0NPUlJFQ1RJT04pIC8gMyk7XG5cbiAgICAgICAgbm9kZS50ZXh0Q29udGVudCA9ICcuLi4nO1xuICAgICAgICBjb250YWluZXIuZWxsaXBzZXNXaWR0aCA9IG5vZGUuZ2V0QkJveCgpLndpZHRoIC0gU1ZHX0JCT1hfQ09SUkVDVElPTjtcbiAgICAgICAgbm9kZS50ZXh0Q29udGVudCA9ICcuJztcbiAgICAgICAgY29udGFpbmVyLmRvdFdpZHRoID0gbm9kZS5nZXRCQm94KCkud2lkdGggLSBTVkdfQkJPWF9DT1JSRUNUSU9OO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIG5vZGUuaW5uZXJIVE1MID0gJy4uLic7XG4gICAgICAgIGNvbnRhaW5lci5lbGxpcHNlc1dpZHRoID0gbm9kZS5vZmZzZXRXaWR0aDtcbiAgICAgICAgbm9kZS5pbm5lckhUTUwgPSAnLic7XG4gICAgICAgIGNvbnRhaW5lci5kb3RXaWR0aCA9IG5vZGUub2Zmc2V0V2lkdGg7XG4gICAgICAgIG5vZGUuaW5uZXJIVE1MID0gJyc7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbnRhaW5lcjtcbn07XG5cbkNvbnRhaW5lck1hbmFnZXIucHJvdG90eXBlLnJlbW92ZUNvbnRhaW5lciA9IGZ1bmN0aW9uIChjT2JqKSB7XG4gICAgdmFyIGtleVN0ciA9IGNPYmoua2V5U3RyO1xuXG4gICAgaWYgKCFrZXlTdHIgfHwgIXRoaXMubGVuZ3RoIHx8ICFjT2JqKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5sZW5ndGggLT0gMTtcblxuICAgIGNPYmoucHJldiAmJiAoY09iai5wcmV2Lm5leHQgPSBjT2JqLm5leHQpO1xuICAgIGNPYmoubmV4dCAmJiAoY09iai5uZXh0LnByZXYgPSBjT2JqLnByZXYpO1xuICAgICh0aGlzLmZpcnN0ID09PSBjT2JqKSAmJiAodGhpcy5maXJzdCA9IGNPYmoubmV4dCk7XG4gICAgKHRoaXMubGFzdCA9PT0gY09iaikgJiYgKHRoaXMubGFzdCA9IGNPYmoucHJldik7XG5cbiAgICBjT2JqLm5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChjT2JqLm5vZGUpO1xuICAgIFxuICAgIGRlbGV0ZSB0aGlzLmNvbnRhaW5lcnNba2V5U3RyXTtcbn07XG5cbkNvbnRhaW5lck1hbmFnZXIucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGtleSxcbiAgICAgICAgY29udGFpbmVycyA9IHRoaXMuY29udGFpbmVycztcblxuICAgIHRoaXMubWF4Q29udGFpbmVycyA9IG51bGw7XG4gICAgZm9yIChrZXkgaW4gY29udGFpbmVycykge1xuICAgICAgICB0aGlzLnJlbW92ZUNvbnRhaW5lcihjb250YWluZXJzW2tleV0pO1xuICAgIH1cblxuICAgIHRoaXMucm9vdE5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLnJvb3ROb2RlKTtcblxuICAgIHRoaXMucm9vdE5vZGUgPSBudWxsO1xuICAgIHRoaXMuZmlyc3QgPSBudWxsO1xuICAgIHRoaXMubGFzdCA9IG51bGw7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRhaW5lck1hbmFnZXI7IiwidmFyIGxpYiA9IHtcblx0aW5pdDogZnVuY3Rpb24gKHdpbikge1xuXHRcdHZhciBkb2MgPSB3aW4uZG9jdW1lbnQsXG4gICAgICAgIFx0bmF2ID0gd2luLm5hdmlnYXRvcixcbiAgICAgICAgXHR1c2VyQWdlbnQgPSBuYXYudXNlckFnZW50LFxuICAgICAgICBcdERJViA9ICdESVYnLFxuICAgICAgICBcdGNlaWwgPSBNYXRoLmNlaWwsXG4gICAgICAgIFx0Zmxvb3IgPSBNYXRoLmZsb29yLFxuICAgICAgICBcdGNvbnRhaW5lckluc3RhbmNlQ291bnQgPSAwLFxuICAgICAgICBcdGNsc05hbWVTcGFjZSA9ICdmdXNpb25jaGFydHMtc21hcnRsYWJlbC0nLFxuICAgICAgICBcdGNvbnRhaW5lckNsYXNzID0gY2xzTmFtZVNwYWNlICsgJ2NvbnRhaW5lcicsXG4gICAgICAgIFx0Y2xhc3NOYW1lV2l0aFRhZyA9IGNsc05hbWVTcGFjZSArICd0YWcnLFxuICAgICAgICBcdGNsYXNzTmFtZVdpdGhUYWdCUiA9IGNsc05hbWVTcGFjZSArICdicic7XG5cblx0XHRsaWIgPSB7XG5cdFx0XHR3aW46IHdpbixcblxuXHRcdFx0Y29udGFpbmVyQ2xhc3M6IGNvbnRhaW5lckNsYXNzLFxuXG5cdFx0XHRjbGFzc05hbWVXaXRoVGFnOiBjbGFzc05hbWVXaXRoVGFnLFxuXG5cdFx0XHRjbGFzc05hbWVXaXRoVGFnQlI6IGNsYXNzTmFtZVdpdGhUYWdCUixcblx0XHRcdFxuXHRcdFx0bWF4RGVmYXVsdENhY2hlTGltaXQ6IDUwMCxcblxuXHRcdFx0Y2xhc3NOYW1lUmVnOiBuZXcgUmVnRXhwKCdcXGInICsgY2xhc3NOYW1lV2l0aFRhZyArICdcXGInKSxcblx0XHRcdFxuXHRcdFx0Y2xhc3NOYW1lQnJSZWc6IG5ldyBSZWdFeHAoJ1xcYicgKyBjbGFzc05hbWVXaXRoVGFnQlIgKyAnXFxiJyksXG5cblx0XHRcdHNwYW5BZGRpdGlvblJlZ3g6IC8oPFtePFxcPl0rP1xcPil8KCYoPzpbYS16XSt8I1swLTldKyk7fC4pL2lnLFxuXHRcdFx0XG5cdFx0XHRzcGFuQWRkaXRpb25SZXBsYWNlcjogJyQxPHNwYW4gY2xhc3M9XCInKyBjbGFzc05hbWVXaXRoVGFnICsgJ1wiPiQyPC9zcGFuPicsXG5cblx0XHRcdHNwYW5SZW1vdmFsUmVneDogbmV3IFJlZ0V4cCgnXFxcXDxzcGFuW15cXFxcPl0rPycrIGNsYXNzTmFtZVdpdGhUYWcgKydbXlxcXFw+XXswLH1cXFxcPiguKj8pXFxcXDxcXFxcL3NwYW5cXFxcPicsICdpZycpLFxuXG5cdFx0XHR4bWxUYWdSZWdFeDogbmV3IFJlZ0V4cCgnPFtePl1bXjxdKltePl0rPicsICdpJyksXG5cblx0XHRcdGx0Z3RSZWdleDogLyZsdDt8Jmd0Oy9nLFxuICAgICAgICBcdFxuICAgICAgICBcdGJyUmVwbGFjZVJlZ2V4OiAvPGJyXFwvPi9pZyxcblxuICAgICAgICBcdHRlc3RTdHJBdmc6ICdXZ0knLFxuXG4gICAgICAgIFx0Ly8gVGhpcyBzdHlsZSBpcyBhcHBsaWVkIG92ZXIgdGhlIHBhcmVudCBzbWFydGxhYmVsIGNvbnRhaW5lci4gVGhlIGNvbnRhaW5lciBpcyBrZXB0IGhpZGRlbiBmcm9tIHRoZSB2aWV3cG9ydFxuXHRcdFx0cGFyZW50Q29udGFpbmVyU3R5bGU6IHtcblx0XHRcdCAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcblx0XHRcdCAgICB0b3A6ICctOTk5OWVtJyxcblx0XHRcdCAgICB3aGl0ZVNwYWNlOiAnbm93cmFwJyxcblx0XHRcdCAgICBwYWRkaW5nOiAnMHB4Jyxcblx0XHRcdCAgICB3aWR0aDogJzFweCcsXG5cdFx0XHQgICAgaGVpZ2h0OiAnMXB4Jyxcblx0XHRcdCAgICBvdmVyZmxvdzogJ2hpZGRlbidcblx0XHRcdH0sXG5cblx0XHRcdC8vIEFsbCB0aGUgc3R5bGUgd2hpY2ggbWlnaHQgYWZmZWN0IHRoZSB0ZXh0IG1ldHJpY3Ncblx0XHRcdHN1cHBvcnRlZFN0eWxlOiB7XG5cdFx0XHQgICAgZm9udDogJ2ZvbnQnLFxuXHRcdFx0ICAgIGZvbnRGYW1pbHk6ICdmb250LWZhbWlseScsXG5cdFx0XHQgICAgJ2ZvbnQtZmFtaWx5JzogJ2ZvbnQtZmFtaWx5Jyxcblx0XHRcdCAgICBmb250V2VpZ2h0OiAnZm9udC13ZWlnaHQnLFxuXHRcdFx0ICAgICdmb250LXdlaWdodCc6ICdmb250LXdlaWdodCcsXG5cdFx0XHQgICAgZm9udFNpemU6ICdmb250LXNpemUnLFxuXHRcdFx0ICAgICdmb250LXNpemUnOiAnZm9udC1zaXplJyxcblx0XHRcdCAgICBsaW5lSGVpZ2h0OiAnbGluZS1oZWlnaHQnLFxuXHRcdFx0ICAgICdsaW5lLWhlaWdodCc6ICdsaW5lLWhlaWdodCcsXG5cdFx0XHQgICAgZm9udFN0eWxlOiAnZm9udC1zdHlsZScsXG5cdFx0XHQgICAgJ2ZvbnQtc3R5bGUnOiAnZm9udC1zdHlsZSdcblx0XHRcdH0sXG5cblx0XHRcdC8vIEdldCB0aGUgc3VwcG9ydCBsaXN0IGZvciBodG1sIHRoZSBkb2N1bWVudCB3aGVyZSB0aGUgdGV4dCBjYWxjdXRpb24gaXMgdG8gYmUgZG9uZS5cblx0XHRcdGdldERvY3VtZW50U3VwcG9ydDogZnVuY3Rpb24gKCkge1xuXHRcdFx0XHR2YXIgY2hpbGRSZXRyaXZlckZuLFxuXHRcdFx0XHQgICAgY2hpbGRSZXRyaXZlclN0cmluZyxcblx0XHRcdFx0ICAgIG5vQ2xhc3NUZXN0aW5nO1xuXG5cdFx0XHRcdGlmIChkb2MuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSkge1xuXHRcdFx0XHQgICAgY2hpbGRSZXRyaXZlckZuID0gJ2dldEVsZW1lbnRzQnlDbGFzc05hbWUnO1xuXHRcdFx0XHQgICAgY2hpbGRSZXRyaXZlclN0cmluZyA9IGNsYXNzTmFtZVdpdGhUYWc7XG5cdFx0XHRcdCAgICBub0NsYXNzVGVzdGluZyA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdCAgICBjaGlsZFJldHJpdmVyRm4gPSAnZ2V0RWxlbWVudHNCeVRhZ05hbWUnO1xuXHRcdFx0XHQgICAgY2hpbGRSZXRyaXZlclN0cmluZyA9ICdzcGFuJztcblx0XHRcdFx0ICAgIG5vQ2xhc3NUZXN0aW5nID0gZmFsc2U7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHQgICAgaXNJRTogL21zaWUvaS50ZXN0KHVzZXJBZ2VudCkgJiYgIXdpbi5vcGVyYSxcblx0XHRcdFx0ICAgIGhhc1NWRzogQm9vbGVhbih3aW4uU1ZHQW5nbGUgfHwgZG9jLmltcGxlbWVudGF0aW9uLmhhc0ZlYXR1cmUoXG5cdFx0XHRcdCAgICAgICAgJ2h0dHA6Ly93d3cudzMub3JnL1RSL1NWRzExL2ZlYXR1cmUjQmFzaWNTdHJ1Y3R1cmUnLCAnMS4xJykpLFxuXHRcdFx0XHQgICAgaXNIZWFkTGVzczogbmV3IFJlZ0V4cCgnIEh0bWxVbml0JykudGVzdCh1c2VyQWdlbnQpLFxuXHRcdFx0XHQgICAgaXNXZWJLaXQ6IG5ldyBSZWdFeHAoJyBBcHBsZVdlYktpdC8nKS50ZXN0KHVzZXJBZ2VudCksXG5cdFx0XHRcdCAgICBjaGlsZFJldHJpdmVyRm46IGNoaWxkUmV0cml2ZXJGbixcblx0XHRcdFx0ICAgIGNoaWxkUmV0cml2ZXJTdHJpbmc6IGNoaWxkUmV0cml2ZXJTdHJpbmcsXG5cdFx0XHRcdCAgICBub0NsYXNzVGVzdGluZzogbm9DbGFzc1Rlc3Rpbmdcblx0XHRcdFx0fTtcblx0XHRcdH0sXG5cblx0XHRcdC8qXG5cdFx0XHQgKiBDcmVhdGUgYSBodG1sIGRpdiBlbGVtZW50IGFuZCBhdHRhY2ggaXQgd2l0aCBhIHBhcmVudC4gQWxsIHRoZSBzdWJzZXF1ZW50IG9wZXJhdGlvbnMgYXJlIHBlcmZvcm1lZFxuXHRcdFx0ICogYnkgdXBkaW5nIHRoaXMgZG9tIHRyZWUgb25seS5cblx0XHRcdCAqXG5cdFx0XHQgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSAtIFRoZSBodG1sIGVsZW1lbnQgd2hlcmUgdGhlIG5ld2x5IGNyZWF0ZWQgZGl2IGlzIHRvIGJlIGF0dGFjaGVkLiBJZiBub3QgcGFzc2VkLFxuXHRcdFx0ICogICAgICAgICAgICAgICAgICAgICAgdGhlIG5ldyBkaXYgaXMgYXBwZW5kZWQgb24gdGhlIGJvZHkuXG5cdFx0XHQgKi9cblx0XHRcdGNyZWF0ZUNvbnRhaW5lcjogZnVuY3Rpb24gKGNvbnRhaW5lclBhcmVudCkge1xuXHRcdFx0ICAgIHZhciBib2R5LFxuXHRcdFx0ICAgICAgICBjb250YWluZXI7XG5cblx0XHRcdCAgICBpZiAoY29udGFpbmVyUGFyZW50ICYmIChjb250YWluZXJQYXJlbnQub2Zmc2V0V2lkdGggfHwgY29udGFpbmVyUGFyZW50Lm9mZnNldEhlaWdodCkpIHtcblx0XHRcdCAgICAgICAgaWYgKGNvbnRhaW5lclBhcmVudC5hcHBlbmRDaGlsZCkge1xuXHRcdFx0ICAgICAgICAgICAgY29udGFpbmVyUGFyZW50LmFwcGVuZENoaWxkKGNvbnRhaW5lciA9IGRvYy5jcmVhdGVFbGVtZW50KERJVikpO1xuXHRcdFx0ICAgICAgICAgICAgY29udGFpbmVyLmNsYXNzTmFtZSA9IGNvbnRhaW5lckNsYXNzO1xuXHRcdFx0ICAgICAgICAgICAgY29udGFpbmVyLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuXHRcdFx0ICAgICAgICAgICAgY29udGFpbmVyLnNldEF0dHJpYnV0ZSgncm9sZScsICdwcmVzZW50YXRpb24nKTtcblx0XHRcdCAgICAgICAgICAgIHJldHVybiBjb250YWluZXI7XG5cdFx0XHQgICAgICAgIH1cblx0XHRcdCAgICB9XG5cdFx0XHQgICAgZWxzZSB7XG5cdFx0XHQgICAgICAgIGJvZHkgPSBkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2JvZHknKVswXTtcblxuXHRcdFx0ICAgICAgICBpZiAoYm9keSAmJiBib2R5LmFwcGVuZENoaWxkKSB7XG5cdFx0XHQgICAgICAgICAgICBjb250YWluZXIgPSBkb2MuY3JlYXRlRWxlbWVudChESVYpO1xuXHRcdFx0ICAgICAgICAgICAgY29udGFpbmVyLmNsYXNzTmFtZSA9IGNvbnRhaW5lckNsYXNzO1xuXHRcdFx0ICAgICAgICAgICAgY29udGFpbmVyLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuXHRcdFx0ICAgICAgICAgICAgY29udGFpbmVyLnNldEF0dHJpYnV0ZSgncm9sZScsICdwcmVzZW50YXRpb24nKTtcblx0XHRcdCAgICAgICAgICAgIGNvbnRhaW5lckluc3RhbmNlQ291bnQgKz0gMTtcblx0XHRcdCAgICAgICAgICAgIGJvZHkuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcblx0XHRcdCAgICAgICAgICAgIHJldHVybiBjb250YWluZXI7XG5cdFx0XHQgICAgICAgIH1cblx0XHRcdCAgICB9XG5cdFx0XHR9LFxuXG5cdFx0XHQvLyBGaW5kcyBhIGFwcHJveGltYXRlIHBvc2l0aW9uIHdoZXJlIHRoZSB0ZXh0IGlzIHRvIGJlIGJyb2tlblxuXHRcdFx0Z2V0TmVhcmVzdEJyZWFrSW5kZXg6IGZ1bmN0aW9uICAodGV4dCwgbWF4V2lkdGgsIHNsKSB7XG5cdFx0XHQgICAgaWYgKCF0ZXh0IHx8ICF0ZXh0Lmxlbmd0aCkge1xuXHRcdFx0ICAgICAgICByZXR1cm4gMDtcblx0XHRcdCAgICB9XG5cblx0XHRcdCAgICB2YXIgZGlmZmVyZW5jZSxcblx0XHRcdCAgICAgICAgZ2V0V2lkdGggPSBzbC5fZ2V0V2lkdGhGbigpLFxuXHRcdFx0ICAgICAgICBjaGFyTGVuID0gMCxcblx0XHRcdCAgICAgICAgaW5jcmVtZW50ID0gMCxcblx0XHRcdCAgICAgICAgb3JpV2lkdGggPSBnZXRXaWR0aCh0ZXh0KSxcblx0XHRcdCAgICAgICAgYXZnV2lkdGggPSBvcmlXaWR0aCAvIHRleHQubGVuZ3RoO1xuXG5cdFx0XHQgICAgZGlmZmVyZW5jZSA9IG1heFdpZHRoO1xuXHRcdFx0ICAgIGNoYXJMZW4gPSBjZWlsKG1heFdpZHRoIC8gYXZnV2lkdGgpO1xuXG5cdFx0XHQgICAgaWYgKG9yaVdpZHRoIDwgbWF4V2lkdGgpIHtcblx0XHRcdCAgICAgICAgcmV0dXJuICh0ZXh0Lmxlbmd0aCAtIDEpO1xuXHRcdFx0ICAgIH1cblxuXHRcdFx0ICAgIGlmIChjaGFyTGVuID4gdGV4dC5sZW5ndGgpIHtcblx0XHRcdCAgICAgICAgZGlmZmVyZW5jZSA9IG1heFdpZHRoIC0gb3JpV2lkdGg7XG5cdFx0XHQgICAgICAgIGNoYXJMZW4gPSB0ZXh0Lmxlbmd0aDtcblx0XHRcdCAgICB9XG5cblx0XHRcdCAgICB3aGlsZSAoZGlmZmVyZW5jZSA+IDApIHtcblx0XHRcdCAgICAgICAgZGlmZmVyZW5jZSA9IG1heFdpZHRoIC0gZ2V0V2lkdGgodGV4dC5zdWJzdHIoMCwgY2hhckxlbikpO1xuXHRcdFx0ICAgICAgICBpbmNyZW1lbnQgPSBmbG9vcihkaWZmZXJlbmNlIC8gYXZnV2lkdGgpO1xuXHRcdFx0ICAgICAgICBpZiAoaW5jcmVtZW50KSB7XG5cdFx0XHQgICAgICAgICAgICBjaGFyTGVuICs9IGluY3JlbWVudDtcblx0XHRcdCAgICAgICAgfSBlbHNlIHtcblx0XHRcdCAgICAgICAgICAgIHJldHVybiBjaGFyTGVuO1xuXHRcdFx0ICAgICAgICB9XG5cdFx0XHQgICAgfVxuXG5cdFx0XHQgICAgd2hpbGUgKGRpZmZlcmVuY2UgPCAwKSB7XG5cdFx0XHQgICAgICAgIGRpZmZlcmVuY2UgPSBtYXhXaWR0aCAtIGdldFdpZHRoKHRleHQuc3Vic3RyKDAsIGNoYXJMZW4pKTtcblx0XHRcdCAgICAgICAgaW5jcmVtZW50ID0gZmxvb3IoZGlmZmVyZW5jZSAvIGF2Z1dpZHRoKTtcblx0XHRcdCAgICAgICAgaWYgKGluY3JlbWVudCkge1xuXHRcdFx0ICAgICAgICAgICAgY2hhckxlbiArPSBpbmNyZW1lbnQ7XG5cdFx0XHQgICAgICAgIH0gZWxzZSB7XG5cdFx0XHQgICAgICAgICAgICByZXR1cm4gY2hhckxlbjtcblx0XHRcdCAgICAgICAgfVxuXHRcdFx0ICAgIH1cblx0XHRcdCAgICByZXR1cm4gY2hhckxlbjtcblx0XHRcdH0sXG5cblx0XHRcdC8qXG5cdFx0XHQgKiBEZXRlcm1pbmUgbGluZWhlaWdodCBvZiBhIHRleHQgZm9yIGEgZ2l2ZW4gc3R5bGUuIEl0IGFkZHMgcHJvcGVyeSBsaW5lSGVpZ2h0IHRvIHRoZSBzdHlsZSBwYXNzZWRcblx0XHRcdCAqXG5cdFx0XHQgKiBAcGFyYW0ge09iamVjdH0gLSBUaGUgc3R5bGUgYmFzZWQgb24gd2hpY2ggdGhlIHRleHQncyBtZXRyaWMgbmVlZHMgdG8gYmUgY2FsY3VsYXRlZC4gVGhlIGNhbGN1bGF0aW9uIGhhcHBlbnNcblx0XHRcdCAqICAgICAgICAgICAgICAgICAgYmFzZWQgb24gZm9udFNpemUgcHJvcGVydHksIGlmIGl0cyBub3QgcHJlc2VudCBhIGRlZmF1bHQgZm9udCBzaXplIGlzIGFzc3VtZWQuXG5cdFx0XHQgKlxuXHRcdFx0ICogQHJldHVybiB7T2JqZWN0fSAtIFRoZSBzdHlsZSB0aGF0IHdhcyBwYXNzZWQgd2l0aCBsaW5lSGVpZ2h0IGFzIGEgbmFtZWQgcHJvcGVyeSBzZXQgb24gdGhlIG9iamVjdC5cblx0XHRcdCAqL1xuXHRcdFx0c2V0TGluZUhlaWdodDogZnVuY3Rpb24gIChzdHlsZU9iaikge1xuXHRcdCAgICAgICAgdmFyIGZTaXplID0gc3R5bGVPYmouZm9udFNpemUgPSAoc3R5bGVPYmouZm9udFNpemUgfHwgJzEycHgnKTtcblx0XHQgICAgICAgIHN0eWxlT2JqLmxpbmVIZWlnaHQgPSBzdHlsZU9iai5saW5lSGVpZ2h0IHx8IHN0eWxlT2JqWydsaW5lLWhlaWdodCddIHx8ICgocGFyc2VJbnQoZlNpemUsIDEwKSAqIDEuMikgKyAncHgnKTtcblx0XHQgICAgICAgIHJldHVybiBzdHlsZU9iajtcblx0XHQgICAgfVxuXHRcdH07XG5cblx0XHRyZXR1cm4gbGliO1xuXHR9XG59O1xuXG5cbmV4cG9ydCBkZWZhdWx0IGxpYjsiLCJpbXBvcnQgbGliIGZyb20gJy4vbGliJztcbmltcG9ydCBDb250YWluZXJNYW5hZ2VyIGZyb20gJy4vY29udGFpbmVyLW1hbmFnZXInO1xuXG52YXIgc2xMaWIgPSBsaWIuaW5pdCh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDogdGhpcyksXG4gICAgZG9jID0gc2xMaWIud2luLmRvY3VtZW50LFxuICAgIE0gPSBzbExpYi53aW4uTWF0aCxcbiAgICBtYXggPSBNLm1heCxcbiAgICByb3VuZCA9IE0ucm91bmQsXG4gICAgQkxBTksgPSAnJyxcbiAgICBodG1sU3BsQ2hhclNwYWNlID0geyAnICc6ICcmbmJzcDsnIH0sXG4gICAgZG9jdW1lbnRTdXBwb3J0ID0gc2xMaWIuZ2V0RG9jdW1lbnRTdXBwb3J0KCksXG4gICAgU1ZHX0JCT1hfQ09SUkVDVElPTiA9IGRvY3VtZW50U3VwcG9ydC5pc1dlYktpdCA/IDAgOiA0LjU7XG5cbi8qXG4gKiBDcmVhdGUgbmV3IGluc3RhbmNlIG9mIFNtYXJ0TGFiZWxNYW5hZ2VyLlxuICpcbiAqIFNtYXJ0TGFiZWxNYW5hZ2VyIGNvbnRyb2xzIHRoZSBsaWZldGltZSBvZiB0aGUgZXhlY3V0aW9uIHNwYWNlIHdoZXJlIHRoZSB0ZXh0J3MgbWV0cmljcyB3aWxsIGJlIGNhbGN1bGF0ZWQuXG4gKiBUaGlzIHRha2VzIGEgc3RyaW5nIGZvciBhIGdpdmVuIHN0eWxlIGFuZCByZXR1cm5zIHRoZSBoZWlnaHQsIHdpZHRoLlxuICogSWYgYSBib3VuZCBib3ggaXMgZGVmaW5lZCBpdCB3cmFwcyB0aGUgdGV4dCBhbmQgcmV0dXJucyB0aGUgd3JhcHBlZCBoZWlnaHQgYW5kIHdpZHRoLlxuICogSXQgYWxsb3dzIHRvIGFwcGVuZCBlbGxpcHNpcyBhdCB0aGUgZW5kIGlmIHRoZSB0ZXh0IGlzIHRydW5jYXRlZC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZyB8IE51bWJlcn0gaWQgLSBJZCBvZiB0aGUgaW5zdGFuY2UuIElmIHRoZSBzYW1lIGlkIGlzIHBhc3NlZCwgaXQgZGlzcG9zZXMgdGhlIG9sZCBpbnN0YW5jZSBhbmRcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2F2ZSB0aGUgbmV3IG9uZTtcbiAqIEBwYXJhbSB7U3RyaW5nIHwgSFRNTEVsZW1lbnR9IGNvbnRhaW5lciAtIFRoZSBpZCBvciB0aGUgaW5zdGFuY2Ugb2YgdGhlIGNvbnRhaW5lciB3aGVyZSB0aGUgaW50ZXJtZWRpYXRlIGRvbVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50cyBhcmUgdG8gYmUgYXR0YWNoZWQuIElmIG5vdCBwYXNzZWQsIGl0IGFwcGVuZHMgaW4gZGl2XG4gKlxuICogQHBhcmFtIHtCb29sZWFufSB1c2VFbGxpcHNlcyAtIFRoaXMgZGVjaWRlcyBpZiBhIGVsbGlwc2VzIHRvIGJlIGFwcGVuZGVkIGlmIHRoZSB0ZXh0IGlzIHRydW5jYXRlZC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gQ29udHJvbCBvcHRpb25zXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhDYWNoZUxpbWl0OiBObyBvZiBsZXR0ZXIgdG8gYmUgY2FjaGVkLiBEZWZhdWx0OiA1MDAuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFNtYXJ0TGFiZWxNYW5hZ2VyKGlkLCBjb250YWluZXIsIHVzZUVsbGlwc2VzLCBvcHRpb25zKSB7XG4gICAgdmFyIHdyYXBwZXIsXG4gICAgICAgIHByb3AsXG4gICAgICAgIG1heCxcbiAgICAgICAgcHJldkluc3RhbmNlLFxuICAgICAgICBpc0Jyb3dzZXJMZXNzID0gZmFsc2UsXG4gICAgICAgIHN0b3JlID0gU21hcnRMYWJlbE1hbmFnZXIuc3RvcmU7XG5cbiAgICBpZiAodHlwZW9mIGlkID09PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgaWQgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAocHJldkluc3RhbmNlID0gc3RvcmVbaWRdKSB7XG4gICAgICAgIHByZXZJbnN0YW5jZS5kaXNwb3NlKCk7XG4gICAgfVxuXG4gICAgc3RvcmVbaWRdID0gdGhpcztcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBvcHRpb25zLm1heENhY2hlTGltaXQgPSBpc0Zpbml0ZShtYXggPSBvcHRpb25zLm1heENhY2hlTGltaXQpID8gbWF4IDogc2xMaWIubWF4RGVmYXVsdENhY2hlTGltaXQ7XG5cbiAgICBpZiAodHlwZW9mIGNvbnRhaW5lciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY29udGFpbmVyID0gZG9jLmdldEVsZW1lbnRCeUlkKGNvbnRhaW5lcik7XG4gICAgfVxuXG4gICAgd3JhcHBlciA9IHNsTGliLmNyZWF0ZUNvbnRhaW5lcihjb250YWluZXIpO1xuICAgIHdyYXBwZXIuaW5uZXJIVE1MID0gc2xMaWIudGVzdFN0ckF2ZztcblxuICAgIGlmIChkb2N1bWVudFN1cHBvcnQuaXNIZWFkTGVzcyB8fCAoIWRvY3VtZW50U3VwcG9ydC5pc0lFICYmICF3cmFwcGVyLm9mZnNldEhlaWdodCAmJiAhd3JhcHBlci5vZmZzZXRXaWR0aCkpIHtcbiAgICAgICAgaXNCcm93c2VyTGVzcyA9IHRydWU7XG4gICAgfVxuXG4gICAgd3JhcHBlci5pbm5lckhUTUwgPSAnJztcbiAgICBmb3IgKHByb3AgaW4gc2xMaWIucGFyZW50Q29udGFpbmVyU3R5bGUpIHtcbiAgICAgICAgd3JhcHBlci5zdHlsZVtwcm9wXSA9IHNsTGliLnBhcmVudENvbnRhaW5lclN0eWxlW3Byb3BdO1xuICAgIH1cblxuICAgIHRoaXMuaWQgPSBpZDtcbiAgICB0aGlzLnBhcmVudENvbnRhaW5lciA9IHdyYXBwZXI7XG5cbiAgICB0aGlzLl9jb250YWluZXJNYW5hZ2VyID0gbmV3IENvbnRhaW5lck1hbmFnZXIod3JhcHBlciwgaXNCcm93c2VyTGVzcywgMTApO1xuICAgIHRoaXMuX3Nob3dOb0VsbGlwc2VzID0gIXVzZUVsbGlwc2VzO1xuICAgIHRoaXMuX2luaXQgPSB0cnVlO1xuICAgIHRoaXMuc3R5bGUgPSB7fTtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXG4gICAgdGhpcy5zZXRTdHlsZSgpO1xufVxuXG4vKlxuICogZ2V0U21hcnRUZXh0IHJldHVybnMgdGhlIHRleHQgc2VwYXJhdGVkIGJ5IDxici8+IHdoZW5ldmVyIGEgYnJlYWsgaXMgbmVjZXNzYXJ5LiBUaGlzIGlzIHRvIHJlY2dvbml6ZSBvbmVcbiAqIGdlbmVyYWxpemVkIGZvcm1hdCBpbmRlcGVuZGVudCBvZiB0aGUgaW1wbGVtZW50YXRpb24gKGNhbnZhcyBiYXNlZCBzb2x1dGlvbiwgc3ZnIGJhc2VkIHNvbHV0aW9uKS4gVGhpcyBtZXRob2RcbiAqIGNvbnZlcnRzIHRoZSBvdXRwdXQgb2YgZ2V0U21hcnRUZXh0KCkudGV4dCB0byBhcnJheSBvZiBsaW5lcyBpZiB0aGUgdGV4dCBpcyB3cmFwcGVkLiBJdCBzZXRzIGEgbmFtZWQgcHJvcGVydHlcbiAqIGBsaW5lc2Agb24gdGhlIG9iamVjdCBwYXNzZWQgYXMgcGFyYW1ldGVyLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBzbWFydGxhYmVsIC0gdGhlIG9iamVjdCByZXR1cm5lZCBieSBnZXRTbWFydFRleHQgYmFzZWQgb24gd2hpY2ggbGluZSBhcnIgd2hpY2ggdG8gYmUgZm9ybWVkLlxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gLSBUaGUgc2FtZSBvYmplY3Qgd2hpY2ggd2FzIHBhc3NlZCBpbiB0aGUgYXJndW1lbnRzLiBBbHNvIGEgbmFtZWQgcHJvcGVydHkgYGxpbmVzYCBpcyBzZXQuXG4gKi9cblNtYXJ0TGFiZWxNYW5hZ2VyLnRleHRUb0xpbmVzID0gZnVuY3Rpb24gKHNtYXJ0bGFiZWwpIHtcbiAgICBzbWFydGxhYmVsID0gc21hcnRsYWJlbCB8fCB7fTtcblxuICAgIGlmICghc21hcnRsYWJlbC50ZXh0KSB7XG4gICAgICAgIHNtYXJ0bGFiZWwudGV4dCA9ICcnO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNtYXJ0bGFiZWwudGV4dCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgc21hcnRsYWJlbC50ZXh0ID0gc21hcnRsYWJlbC50ZXh0LnRvU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgc21hcnRsYWJlbC5saW5lcyA9IHNtYXJ0bGFiZWwudGV4dC5zcGxpdCgvXFxufDxiclxccyo/XFwvPz4vaWcpO1xuICAgIHJldHVybiBzbWFydGxhYmVsO1xufTtcblxuLy8gU2F2ZXMgYWxsIHRoZSBpbnN0YW5jZSBjcmVhdGVkIHNvIGZhclxuU21hcnRMYWJlbE1hbmFnZXIuc3RvcmUgPSB7fTtcblxuLy8gQ2FsY3VsYXRlcyBzcGFjZSB0YWtlbiBieSBhIGNoYXJhY3RlciB3aXRoIGFuIGFwcHJveGltYXRpb24gdmFsdWUgd2hpY2ggaXMgY2FsY3VsYXRlZCBieSByZXBlYXRpbmcgdGhlXG4vLyBjaGFyYWN0ZXIgYnkgc3RyaW5nIGxlbmd0aCB0aW1lcy5cblNtYXJ0TGFiZWxNYW5hZ2VyLnByb3RvdHlwZS5fY2FsQ2hhckRpbVdpdGhDYWNoZSA9IGZ1bmN0aW9uICh0ZXh0LCBjYWxjdWxhdGVEaWZmZXJlbmNlLCBsZW5ndGgpIHtcbiAgICBpZiAoIXRoaXMuX2luaXQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHZhciBzaXplLFxuICAgICAgICBjc0FycixcbiAgICAgICAgdHcsXG4gICAgICAgIHR3aSxcbiAgICAgICAgY2FjaGVkU3R5bGUsXG4gICAgICAgIGFzeW1tZXRyaWNEaWZmZXJlbmNlLFxuICAgICAgICBtYXhBZHZhbmNlZENhY2hlTGltaXQgPSB0aGlzLm9wdGlvbnMubWF4Q2FjaGVMaW1pdCxcbiAgICAgICAgY29udGFpbmVyID0gdGhpcy5fY29udGFpbmVyLFxuICAgICAgICBzdHlsZSA9IHRoaXMuc3R5bGUgfHwge30sXG4gICAgICAgIGNhY2hlID0gdGhpcy5fYWR2YW5jZWRDYWNoZSB8fCAodGhpcy5fYWR2YW5jZWRDYWNoZSA9IHt9KSxcbiAgICAgICAgYWR2YW5jZWRDYWNoZUtleSA9IHRoaXMuX2FkdmFuY2VkQ2FjaGVLZXkgfHwgKHRoaXMuX2FkdmFuY2VkQ2FjaGVLZXkgPSBbXSksXG4gICAgICAgIGNhY2hlTmFtZSA9IHRleHQgKyAoc3R5bGUuZm9udFNpemUgfHwgQkxBTkspICsgKHN0eWxlLmZvbnRGYW1pbHkgfHwgQkxBTkspICsgKHN0eWxlLmZvbnRXZWlnaHQgfHwgQkxBTkspICtcbiAgICAgICAgICAgKHN0eWxlLmZvbnRTdHlsZSB8fCBCTEFOSyksXG4gICAgICAgY2FjaGVJbml0TmFtZSA9IHRleHQgKyAnaW5pdCcgKyAoc3R5bGUuZm9udFNpemUgfHwgQkxBTkspICsgKHN0eWxlLmZvbnRGYW1pbHkgfHwgQkxBTkspICtcbiAgICAgICAgICAgKHN0eWxlLmZvbnRXZWlnaHQgfHwgQkxBTkspICsgKHN0eWxlLmZvbnRTdHlsZSB8fCBCTEFOSyk7XG5cbiAgICBodG1sU3BsQ2hhclNwYWNlW3RleHRdICYmICh0ZXh0ID0gaHRtbFNwbENoYXJTcGFjZVt0ZXh0XSk7XG5cbiAgICBpZiAoIWNhbGN1bGF0ZURpZmZlcmVuY2UpIHtcbiAgICAgICAgYXN5bW1ldHJpY0RpZmZlcmVuY2UgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICgoYXN5bW1ldHJpY0RpZmZlcmVuY2UgPSBjYWNoZVtjYWNoZUluaXROYW1lXSkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9IHRleHQucmVwZWF0ID8gdGV4dC5yZXBlYXQobGVuZ3RoKSA6IEFycmF5KGxlbmd0aCArIDEpLmpvaW4odGV4dCk7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuICAgICAgICAgICAgdHcgPSBjb250YWluZXIub2Zmc2V0V2lkdGg7XG5cbiAgICAgICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSB0ZXh0O1xuICAgICAgICAgICAgdHdpID0gY29udGFpbmVyLm9mZnNldFdpZHRoO1xuXG4gICAgICAgICAgICBhc3ltbWV0cmljRGlmZmVyZW5jZSA9IGNhY2hlW2NhY2hlSW5pdE5hbWVdID0gKHR3IC0gbGVuZ3RoICogdHdpKSAvIChsZW5ndGggKyAxKTtcbiAgICAgICAgICAgIGFkdmFuY2VkQ2FjaGVLZXkucHVzaChjYWNoZUluaXROYW1lKTtcbiAgICAgICAgICAgIGlmIChhZHZhbmNlZENhY2hlS2V5Lmxlbmd0aCA+IG1heEFkdmFuY2VkQ2FjaGVMaW1pdCkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZVthZHZhbmNlZENhY2hlS2V5LnNoaWZ0KCldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNhY2hlZFN0eWxlID0gY2FjaGVbY2FjaGVOYW1lXSkge1xuICAgICAgICBjc0FyciA9IGNhY2hlZFN0eWxlLnNwbGl0KCcsJyk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB3aWR0aDogcGFyc2VGbG9hdChjc0FyclswXSwgMTApLFxuICAgICAgICAgICAgaGVpZ2h0OiBwYXJzZUZsb2F0KGNzQXJyWzFdLCAxMClcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBjb250YWluZXIuaW5uZXJIVE1MID0gdGV4dDtcblxuICAgIHNpemUgPSB7XG4gICAgICAgIGhlaWdodDogY29udGFpbmVyLm9mZnNldEhlaWdodCxcbiAgICAgICAgd2lkdGg6IGNvbnRhaW5lci5vZmZzZXRXaWR0aCArIGFzeW1tZXRyaWNEaWZmZXJlbmNlXG4gICAgfTtcblxuICAgIGNhY2hlW2NhY2hlTmFtZV0gPSBzaXplLndpZHRoICsgJywnICsgc2l6ZS5oZWlnaHQ7XG4gICAgYWR2YW5jZWRDYWNoZUtleS5wdXNoKGNhY2hlTmFtZSk7XG4gICAgaWYgKGFkdmFuY2VkQ2FjaGVLZXkubGVuZ3RoID4gbWF4QWR2YW5jZWRDYWNoZUxpbWl0KSB7XG4gICAgICAgIGRlbGV0ZSBjYWNoZVthZHZhbmNlZENhY2hlS2V5LnNoaWZ0KCldO1xuICAgIH1cblxuICAgIHJldHVybiBzaXplO1xufTtcblxuLy8gUHJvdmlkZSBmdW5jdGlvbiB0byBjYWxjdWxhdGUgdGhlIGhlaWdodCBhbmQgd2lkdGggYmFzZWQgb24gdGhlIGVudmlyb25tZW50IGFuZCBhdmFpbGFibGUgc3VwcG9ydCBmcm9tIGRvbS5cblNtYXJ0TGFiZWxNYW5hZ2VyLnByb3RvdHlwZS5fZ2V0V2lkdGhGbiA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY29udE9iaiA9IHRoaXMuX2NvbnRhaW5lck9iaixcbiAgICAgICAgY29udGFpbmVyID0gdGhpcy5fY29udGFpbmVyLFxuICAgICAgICBzdmdUZXh0ID0gY29udE9iai5zdmdUZXh0O1xuXG4gICAgaWYgKHN2Z1RleHQpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgICAgIHZhciBiYm94LFxuICAgICAgICAgICAgICAgIHdpZHRoO1xuXG4gICAgICAgICAgICBzdmdUZXh0LnRleHRDb250ZW50ID0gc3RyO1xuICAgICAgICAgICAgYmJveCA9IHN2Z1RleHQuZ2V0QkJveCgpO1xuICAgICAgICAgICAgd2lkdGggPSAoYmJveC53aWR0aCAtIFNWR19CQk9YX0NPUlJFQ1RJT04pO1xuICAgICAgICAgICAgaWYgKHdpZHRoIDwgMSkge1xuICAgICAgICAgICAgICAgIHdpZHRoID0gYmJveC53aWR0aDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHdpZHRoO1xuICAgICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gc3RyO1xuICAgICAgICAgICAgcmV0dXJuIGNvbnRhaW5lci5vZmZzZXRXaWR0aDtcbiAgICAgICAgfTtcbiAgICB9XG59O1xuXG4vKlxuICogU2V0cyB0aGUgc3R5bGUgYmFzZWQgb24gd2hpY2ggdGhlIHRleHQncyBtZXRyaWNzIHRvIGJlIGNhbGN1bGF0ZWQuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHN0eWxlIC0gVGhlIHN0eWxlIG9iamVjdCB3aGljaCBhZmZlY3RzIHRoZSB0ZXh0IHNpemVcbiAqICAgICAgICAgICAgICAgICAgICAgIHtcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZSAvICdmb250LXNpemUnIDogTVVTVCBCRSBGT0xMT1dFRCBCWSBQWCAoMTBweCwgMTFweClcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICBmb250RmFtaWx5IC8gJ2ZvbnQtZmFtaWx5J1xuICogICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRXZWlnaHQgLyAnZm9udC13ZWlnaHQnXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFN0eWxlIC8gJ2ZvbnQtc3R5bGUnXG4gKiAgICAgICAgICAgICAgICAgICAgICB9XG4gKlxuICogQHJldHVybiB7U21hcnRMYWJlbE1hbmFnZXJ9IC0gQ3VycmVudCBpbnN0YW5jZSBvZiBTbWFydExhYmVsTWFuYWdlclxuICovXG5TbWFydExhYmVsTWFuYWdlci5wcm90b3R5cGUuc2V0U3R5bGUgPSBmdW5jdGlvbiAoc3R5bGUpIHtcbiAgICBpZiAoIXRoaXMuX2luaXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdmFyIHNDb250O1xuXG4gICAgaWYgKHN0eWxlID09PSB0aGlzLnN0eWxlICYmICF0aGlzLl9zdHlsZU5vdFNldCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCFzdHlsZSkge1xuICAgICAgICBzdHlsZSA9IHRoaXMuc3R5bGU7XG4gICAgfVxuXG4gICAgc2xMaWIuc2V0TGluZUhlaWdodChzdHlsZSk7XG4gICAgdGhpcy5zdHlsZSA9IHN0eWxlO1xuXG4gICAgdGhpcy5fY29udGFpbmVyT2JqID0gc0NvbnQgPSB0aGlzLl9jb250YWluZXJNYW5hZ2VyLmdldChzdHlsZSk7XG5cbiAgICBpZiAodGhpcy5fY29udGFpbmVyT2JqKSB7XG4gICAgICAgIHRoaXMuX2NvbnRhaW5lciA9IHNDb250Lm5vZGU7XG4gICAgICAgIHRoaXMuX2NvbnRleHQgPSBzQ29udC5jb250ZXh0O1xuICAgICAgICB0aGlzLl9jYWNoZSA9IHNDb250LmNoYXJDYWNoZTtcbiAgICAgICAgdGhpcy5fbGluZUhlaWdodCA9IHNDb250LmxpbmVIZWlnaHQ7XG4gICAgICAgIHRoaXMuX3N0eWxlTm90U2V0ID0gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fc3R5bGVOb3RTZXQgPSB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLypcbiAqIERlY2lkZXMgd2hldGhlciBlbGxpcHNlcyB0byBiZSBzaG93biBpZiB0aGUgbm9kZSBpcyB0cnVuY2F0ZWRcbiAqXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHVzZUVsbGlwc2VzIC0gZGVjaWRlcyBpZiBhIGVsbGlwc2VzIHRvIGJlIGFwcGVuZGVkIGlmIHRoZSB0ZXh0IGlzIHRydW5jYXRlZC4gRGVmYXVsdDogZmFsc2VcbiAqXG4gKiBAcmV0dXJuIHtTbWFydExhYmVsTWFuYWdlcn0gLSBDdXJyZW50IGluc3RhbmNlIG9mIFNtYXJ0TGFiZWxNYW5hZ2VyXG4gKi9cblNtYXJ0TGFiZWxNYW5hZ2VyLnByb3RvdHlwZS51c2VFbGxpcHNlc09uT3ZlcmZsb3cgPSBmdW5jdGlvbiAodXNlRWxsaXBzZXMpIHtcbiAgICBpZiAoIXRoaXMuX2luaXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHRoaXMuX3Nob3dOb0VsbGlwc2VzID0gIXVzZUVsbGlwc2VzO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLypcbiAqIEdldCB3cmFwcGVkIG9yIHRydW5jYXRlZCB0ZXh0IGlmIGEgYm91bmQgYm94IGlzIGRlZmluZWQgYXJvdW5kIGl0LiBUaGUgcmVzdWx0IHRleHQgd291bGQgYmUgc2VwYXJhdGVkIGJ5IDxici8+XG4gKiBpZiB3cmFwcGVkXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHRleHQgLSB0aGUgc3ViamVjdCB0ZXh0XG4gKiBAcGFyYW0ge051bWJlcn0gbWF4V2lkdGggLSB3aWR0aCBpbiBweCBvZiB0aGUgdGhlIGJvdW5kIGJveFxuICogQHBhcmFtIHtOdW1iZXJ9IG1heEhlaWdodCAtIGhlaWdodCBpbiBweCBvZiB0aGUgdGhlIGJvdW5kIGJveFxuICogQHBhcmFtIHtCb29sZWFufSBub1dyYXAgLSB3aGV0aGVyIHRoZSB0ZXh0IHRvIGJlIHdyYXBwZWQuIERlZmF1bHQgZmFsc2UuXG4gKlxuICogQHJldHVybiB7T2JqZWN0fSAtIFRoZSBtZXRyaWNzIG9mIHRoZSB0ZXh0IGJvdW5kZWQgYnkgdGhlIGJveFxuICogICAgICAgICAgICAgICAgICB7XG4gKiAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgOiBoZWlnaHQgb2YgdGhlIHdyYXBwZWQgdGV4dFxuICogICAgICAgICAgICAgICAgICAgICAgd2lkdGggOiB3aWR0aCBvZiB0aGUgd3JhcHBlZCB0ZXh0XG4gKiAgICAgICAgICAgICAgICAgICAgICBpc1RydW5jYXRlZCA6IHdoZXRoZXIgdGhlIHRleHQgaXMgdHJ1bmNhdGVkXG4gKiAgICAgICAgICAgICAgICAgICAgICBtYXhIZWlnaHQgOiBNYXhpbXVtIGhlaWdodCBnaXZlblxuICogICAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGggOiBNYXhpbXVtIHdpZHRoIGdpdmVuXG4gKiAgICAgICAgICAgICAgICAgICAgICBvcmlUZXh0IDogT3JpZ2luYWwgdGV4dCBzZW50XG4gKiAgICAgICAgICAgICAgICAgICAgICBvcmlUZXh0SGVpZ2h0IDogT3JpZ2luYWwgdGV4dCBoZWlnaHRcbiAqICAgICAgICAgICAgICAgICAgICAgIG9yaVRleHRXaWR0aCA6IE9yaWdpbmFsIHRleHQgd2lkdGhcbiAqICAgICAgICAgICAgICAgICAgICAgIHRleHQgOiBTTUFSVCBURVhUXG4gKiAgICAgICAgICAgICAgICAgIH1cbiAqL1xuU21hcnRMYWJlbE1hbmFnZXIucHJvdG90eXBlLmdldFNtYXJ0VGV4dCA9IGZ1bmN0aW9uICh0ZXh0LCBtYXhXaWR0aCwgbWF4SGVpZ2h0LCBub1dyYXApIHtcbiAgICBpZiAoIXRoaXMuX2luaXQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmICh0ZXh0ID09PSB1bmRlZmluZWQgfHwgdGV4dCA9PT0gbnVsbCkge1xuICAgICAgICB0ZXh0ID0gJyc7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdGV4dCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGV4dCA9IHRleHQudG9TdHJpbmcoKTtcbiAgICB9XG5cbiAgICB2YXIgbGVuLFxuICAgICAgICB0cmltU3RyLFxuICAgICAgICB0ZW1wQXJyLFxuICAgICAgICB0bXBUZXh0LFxuICAgICAgICBtYXhXaWR0aFdpdGhFbGwsXG4gICAgICAgIHRvb2xUZXh0LFxuICAgICAgICBvcmlXaWR0aCxcbiAgICAgICAgb3JpSGVpZ2h0LFxuICAgICAgICBuZXdDaGFySW5kZXgsXG4gICAgICAgIG5lYXJlc3RDaGFyLFxuICAgICAgICB0ZW1wQ2hhcixcbiAgICAgICAgZ2V0V2lkdGgsXG4gICAgICAgIGluaXRpYWxMZWZ0LFxuICAgICAgICBpbml0aWFsVG9wLFxuICAgICAgICBnZXRPcmlTaXplSW1wcm92ZU9iaixcbiAgICAgICAgc3BhbkFycixcbiAgICAgICAgeCxcbiAgICAgICAgeSxcbiAgICAgICAgbWluV2lkdGgsXG4gICAgICAgIGVsZW0sXG4gICAgICAgIGNocixcbiAgICAgICAgZWxlbVJpZ2h0TW9zdFBvaW50LFxuICAgICAgICBlbGVtTG93ZXN0UG9pbnQsXG4gICAgICAgIGxhc3RCUixcbiAgICAgICAgcmVtb3ZlRnJvbUluZGV4LFxuICAgICAgICByZW1vdmVGcm9tSW5kZXhGb3JFbGxpcHNlcyxcbiAgICAgICAgaGFzSFRNTFRhZyA9IGZhbHNlLFxuICAgICAgICBtYXhTdHJXaWR0aCA9IDAsXG4gICAgICAgIGxhc3REYXNoID0gLTEsXG4gICAgICAgIGxhc3RTcGFjZSA9IC0xLFxuICAgICAgICBsYXN0SW5kZXhCcm9rZW4gPSAtMSxcbiAgICAgICAgc3RyV2lkdGggPSAwLFxuICAgICAgICBzdHJIZWlnaHQgPSAwLFxuICAgICAgICBvcmlUZXh0QXJyID0gW10sXG4gICAgICAgIGkgPSAwLFxuICAgICAgICBlbGxpcHNlc1N0ciA9ICh0aGlzLl9zaG93Tm9FbGxpcHNlcyA/ICcnIDogJy4uLicpLFxuICAgICAgICBsaW5lSGVpZ2h0ID0gdGhpcy5fbGluZUhlaWdodCxcbiAgICAgICAgY29udGV4dCA9IHRoaXMuX2NvbnRleHQsXG4gICAgICAgIGNvbnRhaW5lciA9IHRoaXMuX2NvbnRhaW5lcixcbiAgICAgICAgc0NvbnQgPSB0aGlzLl9jb250YWluZXJPYmosXG4gICAgICAgIGVsbGlwc2VzV2lkdGggPSBzQ29udC5lbGxpcHNlc1dpZHRoLFxuICAgICAgICBkb3RXaWR0aCA9ICBzQ29udC5kb3RXaWR0aCxcbiAgICAgICAgY2hhcmFjdGVyQXJyID0gW10sXG4gICAgICAgIGRhc2hJbmRleCA9IC0xLFxuICAgICAgICBzcGFjZUluZGV4ID0gLTEsXG4gICAgICAgIGxhc3RMaW5lQnJlYWsgPSAtMSxcbiAgICAgICAgZmFzdFRyaW0gPSBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvXlxcc1xccyovLCAnJyk7XG4gICAgICAgICAgICB2YXIgd3MgPSAvXFxzLywgaSA9IHN0ci5sZW5ndGg7XG4gICAgICAgICAgICB3aGlsZSAod3MudGVzdChzdHIuY2hhckF0KGkgLT0gMSkpKSB7IC8qIGpzaGludCBub2VtcHR5OmZhbHNlICovIH1cbiAgICAgICAgICAgIHJldHVybiBzdHIuc2xpY2UoMCwgaSArIDEpO1xuICAgICAgICB9LFxuICAgICAgICBzbWFydExhYmVsID0ge1xuICAgICAgICAgICAgdGV4dCA6IHRleHQsXG4gICAgICAgICAgICBtYXhXaWR0aCA6IG1heFdpZHRoLFxuICAgICAgICAgICAgbWF4SGVpZ2h0IDogbWF4SGVpZ2h0LFxuICAgICAgICAgICAgd2lkdGggOiBudWxsLFxuICAgICAgICAgICAgaGVpZ2h0IDogbnVsbCxcbiAgICAgICAgICAgIG9yaVRleHRXaWR0aCA6IG51bGwsXG4gICAgICAgICAgICBvcmlUZXh0SGVpZ2h0IDogbnVsbCxcbiAgICAgICAgICAgIG9yaVRleHQgOiB0ZXh0LFxuICAgICAgICAgICAgaXNUcnVuY2F0ZWQgOiBmYWxzZVxuICAgICAgICB9O1xuXG4gICAgZ2V0V2lkdGggPSB0aGlzLl9nZXRXaWR0aEZuKCk7XG5cbiAgICAvLyBJbiBzb21lIGJyb3dzZXJzLCBvZmZzZXRoZWlnaHQgb2YgYSBzaW5nbGUtbGluZSB0ZXh0IGlzIGdldHRpbmcgbGl0dGxlICgxIHB4KSBoZWlnaGVyIHZhbHVlIG9mIHRoZVxuICAgIC8vIGxpbmVoZWlnaHQuIEFzIGEgcmVzdWx0LCBzbWFydExhYmVsIGlzIHVuYWJsZSB0byByZXR1cm4gc2luZ2xlLWxpbmUgdGV4dC5cbiAgICAvLyBUbyBmaXggdGhpcywgaW5jcmVhc2UgdGhlIG1heEhlaWdodCBhIGxpdHRsZSBhbW91bnQuIEhlbmNlIG1heEhlaWdodCA9ICBsaW5lSGVpZ2h0ICogMS4yXG4gICAgaWYgKG1heEhlaWdodCA9PT0gbGluZUhlaWdodCkge1xuICAgICAgICBtYXhIZWlnaHQgKj0gMS4yO1xuICAgIH1cblxuXG4gICAgaWYgKGNvbnRhaW5lcikge1xuICAgICAgICBpZiAoIWRvY3VtZW50U3VwcG9ydC5pc0Jyb3dzZXJMZXNzKSB7XG4gICAgICAgICAgICBoYXNIVE1MVGFnID0gc2xMaWIueG1sVGFnUmVnRXgudGVzdCh0ZXh0KTtcbiAgICAgICAgICAgIGlmICghaGFzSFRNTFRhZykge1xuICAgICAgICAgICAgICAgIC8vIER1ZSB0byBzdXBwb3J0IG9mIDwsPiBmb3IgeG1sIHdlIGNvbnZlcnQgJmx0OywgJmd0OyB0byA8LD4gcmVzcGVjdGl2ZWx5IHNvIHRvIGdldCB0aGUgY29ycmVjdFxuICAgICAgICAgICAgICAgIC8vIHdpZHRoIGl0IGlzIHJlcXVpcmVkIHRvIGNvbnZlcnQgdGhlIHNhbWUgYmVmb3JlIGNhbGN1bGF0aW9uIGZvciB0aGUgbmV3IGltcHJvdmUgdmVyc2lvbiBvZiB0aGVcbiAgICAgICAgICAgICAgICAvLyBnZXQgdGV4dCB3aWR0aC5cbiAgICAgICAgICAgICAgICB0bXBUZXh0ID0gdGV4dC5yZXBsYWNlKHNsTGliLmx0Z3RSZWdleCwgZnVuY3Rpb24gKG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaCA9PT0gJyZsdDsnID8gJzwnIDogJz4nO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGdldE9yaVNpemVJbXByb3ZlT2JqID0gdGhpcy5nZXRPcmlTaXplKHRtcFRleHQsIHRydWUpO1xuXG4gICAgICAgICAgICAgICAgc21hcnRMYWJlbC5vcmlUZXh0V2lkdGggPSBvcmlXaWR0aCA9IGdldE9yaVNpemVJbXByb3ZlT2JqLndpZHRoO1xuICAgICAgICAgICAgICAgIHNtYXJ0TGFiZWwub3JpVGV4dEhlaWdodCA9IG9yaUhlaWdodCA9IGdldE9yaVNpemVJbXByb3ZlT2JqLmhlaWdodDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9IHRleHQ7XG4gICAgICAgICAgICAgICAgc21hcnRMYWJlbC5vcmlUZXh0V2lkdGggPSBvcmlXaWR0aCA9IGNvbnRhaW5lci5vZmZzZXRXaWR0aDtcbiAgICAgICAgICAgICAgICBzbWFydExhYmVsLm9yaVRleHRIZWlnaHQgPSBvcmlIZWlnaHQgPSBjb250YWluZXIub2Zmc2V0SGVpZ2h0O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob3JpSGVpZ2h0IDw9IG1heEhlaWdodCAmJiBvcmlXaWR0aCA8PSBtYXhXaWR0aCkge1xuICAgICAgICAgICAgICAgIHNtYXJ0TGFiZWwud2lkdGggPSBzbWFydExhYmVsLm9yaVRleHRXaWR0aCA9IG9yaVdpZHRoO1xuICAgICAgICAgICAgICAgIHNtYXJ0TGFiZWwuaGVpZ2h0ID0gc21hcnRMYWJlbC5vcmlUZXh0SGVpZ2h0ID0gb3JpSGVpZ2h0O1xuICAgICAgICAgICAgICAgIHJldHVybiBzbWFydExhYmVsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobGluZUhlaWdodCA+IG1heEhlaWdodCkge1xuICAgICAgICAgICAgICAgIHNtYXJ0TGFiZWwudGV4dCA9ICcnO1xuICAgICAgICAgICAgICAgIHNtYXJ0TGFiZWwud2lkdGggPSBzbWFydExhYmVsLm9yaVRleHRXaWR0aCA9IDA7XG4gICAgICAgICAgICAgICAgc21hcnRMYWJlbC5oZWlnaHQgPSBzbWFydExhYmVsLm9yaVRleHRIZWlnaHQgPSAwO1xuICAgICAgICAgICAgICAgIHJldHVybiBzbWFydExhYmVsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIHdpZHRoIHdpdGggZWxsaXBzZXNcbiAgICAgICAgdGV4dCA9IGZhc3RUcmltKHRleHQpLnJlcGxhY2UoLyhcXHMrKS9nLCAnICcpO1xuICAgICAgICBtYXhXaWR0aFdpdGhFbGwgPSB0aGlzLl9zaG93Tm9FbGxpcHNlcyA/IG1heFdpZHRoIDogKG1heFdpZHRoIC0gZWxsaXBzZXNXaWR0aCk7XG5cbiAgICAgICAgaWYgKCFoYXNIVE1MVGFnKSB7XG4gICAgICAgICAgICBvcmlUZXh0QXJyID0gdGV4dC5zcGxpdCgnJyk7XG4gICAgICAgICAgICBsZW4gPSBvcmlUZXh0QXJyLmxlbmd0aDtcbiAgICAgICAgICAgIHRyaW1TdHIgPSAnJywgdGVtcEFyciA9IFtdO1xuICAgICAgICAgICAgdGVtcENoYXIgPSBvcmlUZXh0QXJyWzBdO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5fY2FjaGVbdGVtcENoYXJdKSB7XG4gICAgICAgICAgICAgICAgbWluV2lkdGggPSB0aGlzLl9jYWNoZVt0ZW1wQ2hhcl0ud2lkdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBtaW5XaWR0aCA9IGdldFdpZHRoKHRlbXBDaGFyKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9jYWNoZVt0ZW1wQ2hhcl0gPSB7IHdpZHRoOiBtaW5XaWR0aCB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobWF4V2lkdGhXaXRoRWxsID4gbWluV2lkdGgpIHtcbiAgICAgICAgICAgICAgICB0ZW1wQXJyID0gdGV4dC5zdWJzdHIoMCwgc2xMaWIuZ2V0TmVhcmVzdEJyZWFrSW5kZXgodGV4dCwgbWF4V2lkdGhXaXRoRWxsLCB0aGlzKSkuc3BsaXQoJycpO1xuICAgICAgICAgICAgICAgIGkgPSB0ZW1wQXJyLmxlbmd0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG1pbldpZHRoID4gbWF4V2lkdGgpIHtcbiAgICAgICAgICAgICAgICBzbWFydExhYmVsLnRleHQgPSAnJztcbiAgICAgICAgICAgICAgICBzbWFydExhYmVsLndpZHRoID0gc21hcnRMYWJlbC5vcmlUZXh0V2lkdGggPVxuICAgICAgICAgICAgICAgICAgICBzbWFydExhYmVsLmhlaWdodCA9IHNtYXJ0TGFiZWwub3JpVGV4dEhlaWdodCA9IDA7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNtYXJ0TGFiZWw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChlbGxpcHNlc1N0cikge1xuICAgICAgICAgICAgICAgIG1heFdpZHRoV2l0aEVsbCA9IG1heFdpZHRoIC0gKDIgKiBkb3RXaWR0aCk7XG4gICAgICAgICAgICAgICAgaWYgKG1heFdpZHRoV2l0aEVsbCA+IG1pbldpZHRoKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsbGlwc2VzU3RyID0gJy4uJztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtYXhXaWR0aFdpdGhFbGwgPSBtYXhXaWR0aCAtIGRvdFdpZHRoO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWF4V2lkdGhXaXRoRWxsID4gbWluV2lkdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsbGlwc2VzU3RyID0gJy4nO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGhXaXRoRWxsID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsbGlwc2VzU3RyID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN0cldpZHRoID0gZ2V0V2lkdGgodGVtcEFyci5qb2luKCcnKSk7XG4gICAgICAgICAgICBzdHJIZWlnaHQgPSB0aGlzLl9saW5lSGVpZ2h0O1xuXG4gICAgICAgICAgICBpZiAobm9XcmFwKSB7XG4gICAgICAgICAgICAgICAgZm9yICg7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICB0ZW1wQ2hhciA9IHRlbXBBcnJbaV0gPSBvcmlUZXh0QXJyW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fY2FjaGVbdGVtcENoYXJdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5XaWR0aCA9IHRoaXMuX2NhY2hlW3RlbXBDaGFyXS53aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZ2V0T3JpU2l6ZUltcHJvdmVPYmogfHwgIShtaW5XaWR0aCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpU2l6ZUltcHJvdmVPYmouZGV0YWlsT2JqW3RlbXBDaGFyXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5XaWR0aCA9IGdldFdpZHRoKHRlbXBDaGFyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2NhY2hlW3RlbXBDaGFyXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogbWluV2lkdGhcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc3RyV2lkdGggKz0gbWluV2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdHJXaWR0aCA+IG1heFdpZHRoV2l0aEVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0cmltU3RyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJpbVN0ciA9IHRlbXBBcnIuc2xpY2UoMCwgLTEpLmpvaW4oJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0cldpZHRoID4gbWF4V2lkdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzbWFydExhYmVsLnRleHQgPSBmYXN0VHJpbSh0cmltU3RyKSArIGVsbGlwc2VzU3RyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNtYXJ0TGFiZWwudG9vbHRleHQgPSBzbWFydExhYmVsLm9yaVRleHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc21hcnRMYWJlbC53aWR0aCA9IGdldFdpZHRoKHNtYXJ0TGFiZWwudGV4dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc21hcnRMYWJlbC5oZWlnaHQgPSB0aGlzLl9saW5lSGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzbWFydExhYmVsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgc21hcnRMYWJlbC50ZXh0ID0gdGVtcEFyci5qb2luKCcnKTtcbiAgICAgICAgICAgICAgICBzbWFydExhYmVsLndpZHRoID0gc3RyV2lkdGg7XG4gICAgICAgICAgICAgICAgc21hcnRMYWJlbC5oZWlnaHQgPSB0aGlzLl9saW5lSGVpZ2h0O1xuICAgICAgICAgICAgICAgIHJldHVybiBzbWFydExhYmVsO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAoOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGVtcENoYXIgPSB0ZW1wQXJyW2ldID0gb3JpVGV4dEFycltpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRlbXBDaGFyID09PSAnICcgJiYgIWNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBDaGFyID0gJyZuYnNwOyc7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fY2FjaGVbdGVtcENoYXJdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5XaWR0aCA9IHRoaXMuX2NhY2hlW3RlbXBDaGFyXS53aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZ2V0T3JpU2l6ZUltcHJvdmVPYmogfHwgIShtaW5XaWR0aCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpU2l6ZUltcHJvdmVPYmouZGV0YWlsT2JqW3RlbXBDaGFyXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5XaWR0aCA9IGdldFdpZHRoKHRlbXBDaGFyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2NhY2hlW3RlbXBDaGFyXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogbWluV2lkdGhcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc3RyV2lkdGggKz0gbWluV2lkdGg7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0cldpZHRoID4gbWF4V2lkdGhXaXRoRWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRyaW1TdHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmltU3RyID0gdGVtcEFyci5zbGljZSgwLCAtMSkuam9pbignJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RyV2lkdGggPiBtYXhXaWR0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qKiBAdG9kbyB1c2UgcmVndWxhciBleHByZXNzaW9ucyBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RTcGFjZSA9IHRleHQuc3Vic3RyKDAsIHRlbXBBcnIubGVuZ3RoKS5sYXN0SW5kZXhPZignICcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3REYXNoID0gdGV4dC5zdWJzdHIoMCwgdGVtcEFyci5sZW5ndGgpLmxhc3RJbmRleE9mKCctJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RTcGFjZSA+IGxhc3RJbmRleEJyb2tlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJXaWR0aCA9IGdldFdpZHRoKHRlbXBBcnIuc2xpY2UobGFzdEluZGV4QnJva2VuICsgMSwgbGFzdFNwYWNlKS5qb2luKCcnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBBcnIuc3BsaWNlKGxhc3RTcGFjZSwgMSwgJzxici8+Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RJbmRleEJyb2tlbiA9IGxhc3RTcGFjZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q2hhckluZGV4ID0gbGFzdFNwYWNlICsgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxhc3REYXNoID4gbGFzdEluZGV4QnJva2VuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYXN0RGFzaCA9PT0gdGVtcEFyci5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJXaWR0aCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0V2lkdGgodGVtcEFyci5zbGljZShsYXN0SW5kZXhCcm9rZW4gKyAxLCBsYXN0U3BhY2UpLmpvaW4oJycpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBBcnIuc3BsaWNlKGxhc3REYXNoLCAxLCAnPGJyLz4tJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJXaWR0aCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0V2lkdGgodGVtcEFyci5zbGljZShsYXN0SW5kZXhCcm9rZW4gKyAxLCBsYXN0U3BhY2UpLmpvaW4oJycpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBBcnIuc3BsaWNlKGxhc3REYXNoLCAxLCAnLTxici8+Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdEluZGV4QnJva2VuID0gbGFzdERhc2g7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0NoYXJJbmRleCA9IGxhc3REYXNoICsgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wQXJyLnNwbGljZSgodGVtcEFyci5sZW5ndGggLSAxKSwgMSwgJzxici8+JyArIG9yaVRleHRBcnJbaV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0TGluZUJyZWFrID0gdGVtcEFyci5sZW5ndGggLSAyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJXaWR0aCA9IGdldFdpZHRoKHRlbXBBcnIuc2xpY2UobGFzdEluZGV4QnJva2VuICsgMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RMaW5lQnJlYWsgKyAxKS5qb2luKCcnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RJbmRleEJyb2tlbiA9IGxhc3RMaW5lQnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0NoYXJJbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0ckhlaWdodCArPSB0aGlzLl9saW5lSGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdHJIZWlnaHQgPiBtYXhIZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc21hcnRMYWJlbC50ZXh0ID0gZmFzdFRyaW0odHJpbVN0cikgKyBlbGxpcHNlc1N0cjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc21hcnRMYWJlbC50b29sdGV4dCA9IHNtYXJ0TGFiZWwub3JpVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIG1heCB3aWR0aCBhbW9uZyBhbGwgdGhlIGxpbmVzIHdpbGwgYmUgdGhlIHdpZHRoIG9mIHRoZSBzdHJpbmcuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNtYXJ0TGFiZWwud2lkdGggPSBtYXhXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc21hcnRMYWJlbC5oZWlnaHQgPSAoc3RySGVpZ2h0IC0gdGhpcy5fbGluZUhlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzbWFydExhYmVsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heFN0cldpZHRoID0gbWF4KG1heFN0cldpZHRoLCBzdHJXaWR0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyaW1TdHIgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZWFyZXN0Q2hhciA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzbExpYi5nZXROZWFyZXN0QnJlYWtJbmRleCh0ZXh0LnN1YnN0cihuZXdDaGFySW5kZXgpLCBtYXhXaWR0aFdpdGhFbGwsIHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJXaWR0aCA9IGdldFdpZHRoKHRleHQuc3Vic3RyKG5ld0NoYXJJbmRleCwgbmVhcmVzdENoYXIgfHwgMSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGVtcEFyci5sZW5ndGggPCBuZXdDaGFySW5kZXggKyBuZWFyZXN0Q2hhcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcEFyciA9IHRlbXBBcnIuY29uY2F0KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQuc3Vic3RyKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wQXJyLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q2hhckluZGV4ICsgbmVhcmVzdENoYXIgLSB0ZW1wQXJyLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkuc3BsaXQoJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaSA9IHRlbXBBcnIubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIG1heFN0cldpZHRoID0gbWF4KG1heFN0cldpZHRoLCBzdHJXaWR0aCk7XG5cbiAgICAgICAgICAgICAgICBzbWFydExhYmVsLnRleHQgPSB0ZW1wQXJyLmpvaW4oJycpO1xuICAgICAgICAgICAgICAgIHNtYXJ0TGFiZWwud2lkdGggPSBtYXhTdHJXaWR0aDtcbiAgICAgICAgICAgICAgICBzbWFydExhYmVsLmhlaWdodCA9IHN0ckhlaWdodDtcbiAgICAgICAgICAgICAgICByZXR1cm4gc21hcnRMYWJlbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRvb2xUZXh0ID0gdGV4dC5yZXBsYWNlKHNsTGliLnNwYW5BZGRpdGlvblJlZ3gsICckMicpO1xuICAgICAgICAgICAgdGV4dCA9IHRleHQucmVwbGFjZShzbExpYi5zcGFuQWRkaXRpb25SZWd4LCBzbExpYi5zcGFuQWRkaXRpb25SZXBsYWNlcik7XG4gICAgICAgICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKFxuICAgICAgICAgICAgICAgIC8oPGJyXFxzKlxcLypcXD4pL2csXG4gICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwiJyArIFtzbExpYi5jbGFzc05hbWVXaXRoVGFnLCAnICcsIHNsTGliLmNsYXNzTmFtZVdpdGhUYWdCUl0uam9pbignJykgKyAnXCI+JDE8L3NwYW4+J1xuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9IHRleHQ7XG5cbiAgICAgICAgICAgIHNwYW5BcnIgPSBjb250YWluZXJbZG9jdW1lbnRTdXBwb3J0LmNoaWxkUmV0cml2ZXJGbl0oZG9jdW1lbnRTdXBwb3J0LmNoaWxkUmV0cml2ZXJTdHJpbmcpO1xuXG4gICAgICAgICAgICBmb3IgKHggPSAwLCB5ID0gc3BhbkFyci5sZW5ndGg7IHggPCB5OyB4ICs9IDEpIHtcbiAgICAgICAgICAgICAgICBlbGVtID0gc3BhbkFyclt4XTtcbiAgICAgICAgICAgICAgICAvL2NoZWNoIHdoZXRoZXIgdGhpcyBzcGFuIGlzIHRlbXBvcmFyeSBpbnNlcnRlZCBzcGFuIGZyb20gaXQncyBjbGFzc1xuICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudFN1cHBvcnQubm9DbGFzc1Rlc3RpbmcgfHwgc2xMaWIuY2xhc3NOYW1lUmVnLnRlc3QoZWxlbS5jbGFzc05hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNociA9IGVsZW0uaW5uZXJIVE1MO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2hyICE9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNociA9PT0gJyAnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3BhY2VJbmRleCA9IGNoYXJhY3RlckFyci5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBjaHIgPT09ICctJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhc2hJbmRleCA9IGNoYXJhY3RlckFyci5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYXJhY3RlckFyci5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcGFjZUlkeDogc3BhY2VJbmRleCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXNoSWR4OiBkYXNoSW5kZXgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbTogZWxlbVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcmlUZXh0QXJyLnB1c2goY2hyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaSA9IDA7XG4gICAgICAgICAgICBsZW4gPSBjaGFyYWN0ZXJBcnIubGVuZ3RoO1xuICAgICAgICAgICAgbWluV2lkdGggPSBjaGFyYWN0ZXJBcnJbMF0uZWxlbS5vZmZzZXRXaWR0aDtcblxuICAgICAgICAgICAgaWYgKG1pbldpZHRoID4gbWF4V2lkdGgpIHtcbiAgICAgICAgICAgICAgICBzbWFydExhYmVsLnRleHQgPSAnJztcbiAgICAgICAgICAgICAgICBzbWFydExhYmVsLndpZHRoID0gc21hcnRMYWJlbC5vcmlUZXh0V2lkdGggPSBzbWFydExhYmVsLmhlaWdodCA9IHNtYXJ0TGFiZWwub3JpVGV4dEhlaWdodCA9IDA7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gc21hcnRMYWJlbDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWluV2lkdGggPiBtYXhXaWR0aFdpdGhFbGwgJiYgIXRoaXMuX3Nob3dOb0VsbGlwc2VzKSB7XG5cbiAgICAgICAgICAgICAgICBtYXhXaWR0aFdpdGhFbGwgPSBtYXhXaWR0aCAtICgyICogZG90V2lkdGgpO1xuICAgICAgICAgICAgICAgIGlmIChtYXhXaWR0aFdpdGhFbGwgPiBtaW5XaWR0aCkge1xuICAgICAgICAgICAgICAgICAgICBlbGxpcHNlc1N0ciA9ICcuLic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGhXaXRoRWxsID0gbWF4V2lkdGggLSBkb3RXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1heFdpZHRoV2l0aEVsbCA+IG1pbldpZHRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGxpcHNlc1N0ciA9ICcuJztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heFdpZHRoV2l0aEVsbCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGxpcHNlc1N0ciA9ICcnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpbml0aWFsTGVmdCA9IGNoYXJhY3RlckFyclswXS5lbGVtLm9mZnNldExlZnQ7XG4gICAgICAgICAgICBpbml0aWFsVG9wID0gY2hhcmFjdGVyQXJyWzBdLmVsZW0ub2Zmc2V0VG9wO1xuXG4gICAgICAgICAgICBpZiAobm9XcmFwKSB7XG4gICAgICAgICAgICAgICAgZm9yICg7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtID0gY2hhcmFjdGVyQXJyW2ldLmVsZW07XG4gICAgICAgICAgICAgICAgICAgIGVsZW1SaWdodE1vc3RQb2ludCA9IChlbGVtLm9mZnNldExlZnQgLSBpbml0aWFsTGVmdCkgKyBlbGVtLm9mZnNldFdpZHRoO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtUmlnaHRNb3N0UG9pbnQgPiBtYXhXaWR0aFdpdGhFbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVtb3ZlRnJvbUluZGV4Rm9yRWxsaXBzZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVGcm9tSW5kZXhGb3JFbGxpcHNlcyA9IGk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29udGFpbmVyLm9mZnNldFdpZHRoID4gbWF4V2lkdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVGcm9tSW5kZXggPSBpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGkgPSBsZW47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAoOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IGNoYXJhY3RlckFycltpXS5lbGVtO1xuICAgICAgICAgICAgICAgICAgICBlbGVtTG93ZXN0UG9pbnQgPSBlbGVtLm9mZnNldEhlaWdodCArIChlbGVtLm9mZnNldFRvcCAtIGluaXRpYWxUb3ApO1xuICAgICAgICAgICAgICAgICAgICBlbGVtUmlnaHRNb3N0UG9pbnQgPSAoZWxlbS5vZmZzZXRMZWZ0IC0gaW5pdGlhbExlZnQpICsgZWxlbS5vZmZzZXRXaWR0aDtcblxuICAgICAgICAgICAgICAgICAgICBsYXN0QlIgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtUmlnaHRNb3N0UG9pbnQgPiBtYXhXaWR0aFdpdGhFbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVtb3ZlRnJvbUluZGV4Rm9yRWxsaXBzZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVGcm9tSW5kZXhGb3JFbGxpcHNlcyA9IGk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbGVtUmlnaHRNb3N0UG9pbnQgPiBtYXhXaWR0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RTcGFjZSA9IGNoYXJhY3RlckFycltpXS5zcGFjZUlkeDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0RGFzaCA9IGNoYXJhY3RlckFycltpXS5kYXNoSWR4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYXN0U3BhY2UgPiBsYXN0SW5kZXhCcm9rZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhcmFjdGVyQXJyW2xhc3RTcGFjZV0uZWxlbS5pbm5lckhUTUwgPSAnPGJyLz4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0SW5kZXhCcm9rZW4gPSBsYXN0U3BhY2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChsYXN0RGFzaCA+IGxhc3RJbmRleEJyb2tlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobGFzdERhc2ggPT09IGkpIHsgLy8gaW4gY2FzZSB0aGUgb3ZlcmZsb3dpbmcgY2hhcmFjdGVyIGl0c2VsZiBpcyB0aGUgJy0nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFyYWN0ZXJBcnJbbGFzdERhc2hdLmVsZW0uaW5uZXJIVE1MID0gJzxici8+LSc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFyYWN0ZXJBcnJbbGFzdERhc2hdLmVsZW0uaW5uZXJIVE1MID0gJy08YnIvPic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdEluZGV4QnJva2VuID0gbGFzdERhc2g7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShsYXN0QlIgPSBkb2MuY3JlYXRlRWxlbWVudCgnYnInKSwgZWxlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9jaGVjayB3aGV0aGVyIHRoaXMgYnJlYWsgbWFkZSBjdXJyZW50IGVsZW1lbnQgb3V0c2lkZSB0aGUgYXJlYSBoZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKGVsZW0ub2Zmc2V0SGVpZ2h0ICsgZWxlbS5vZmZzZXRUb3ApID4gbWF4SGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vcmVtb3ZlIHRoZSBsYXN0bHkgaW5zZXJ0ZWQgbGluZSBicmVha1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobGFzdEJSKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0QlIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChsYXN0QlIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGxhc3RJbmRleEJyb2tlbiA9PT0gbGFzdERhc2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYXJhY3RlckFycltsYXN0RGFzaF0uZWxlbS5pbm5lckhUTUwgPSAnLSc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFyYWN0ZXJBcnJbbGFzdFNwYWNlXS5lbGVtLmlubmVySFRNTCA9ICcgJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVGcm9tSW5kZXggPSBpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2JyZWFrIHRoZSBsb29waW5nIGNvbmRpdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpID0gbGVuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUZyb21JbmRleEZvckVsbGlwc2VzID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY2hlY2sgd2hldGhlciB0aGlzIGJyZWFrIG1hZGUgY3VycmVudCBlbGVtZW50IG91dHNpZGUgdGhlIGFyZWEgaGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbUxvd2VzdFBvaW50ID4gbWF4SGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlRnJvbUluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpID0gbGVuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocmVtb3ZlRnJvbUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICAgICAgLy9zZXQgdGhlIHRyYW5jYXRlZCBwcm9wZXJ0eSBvZiB0aGUgc21hcnRsYWJlbFxuICAgICAgICAgICAgICAgIHNtYXJ0TGFiZWwuaXNUcnVuY2F0ZWQgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgLyoqIEB0b2RvIGlzIHRoaXMgcmVhbGx5IG5lZWRlZD8gKi9cbiAgICAgICAgICAgICAgICByZW1vdmVGcm9tSW5kZXhGb3JFbGxpcHNlcyA9IHJlbW92ZUZyb21JbmRleEZvckVsbGlwc2VzID9cbiAgICAgICAgICAgICAgICByZW1vdmVGcm9tSW5kZXhGb3JFbGxpcHNlcyA6IHJlbW92ZUZyb21JbmRleDtcblxuICAgICAgICAgICAgICAgIGZvciAoaSA9IGxlbiAtIDE7IGkgPj0gcmVtb3ZlRnJvbUluZGV4Rm9yRWxsaXBzZXM7IGkgLT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtID0gY2hhcmFjdGVyQXJyW2ldLmVsZW07XG4gICAgICAgICAgICAgICAgICAgIC8vY2hlY2ggd2hldGhlciB0aGlzIHNwYW4gaXMgdGVtcG9yYXJ5IGluc2VydGVkIHNwYW4gZnJvbSBpdCdzIGNsYXNzXG4gICAgICAgICAgICAgICAgICAgIGVsZW0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChlbGVtKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb3IgKDsgaSA+PSAwOyBpIC09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IGNoYXJhY3RlckFycltpXS5lbGVtO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2xMaWIuY2xhc3NOYW1lQnJSZWcudGVzdChlbGVtLmNsYXNzTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY2hlY2ggd2hldGhlciB0aGlzIHNwYW4gaXMgdGVtcG9yYXJ5IGluc2VydGVkIHNwYW4gZnJvbSBpdCdzIGNsYXNzXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWxlbSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpID0gMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9nZXQgdGhlIHNtYXJ0IHRleHRcbiAgICAgICAgICAgIHNtYXJ0TGFiZWwudGV4dCA9IGNvbnRhaW5lci5pbm5lckhUTUwucmVwbGFjZShzbExpYi5zcGFuUmVtb3ZhbFJlZ3gsICckMScpLnJlcGxhY2UoL1xcJmFtcFxcOy9nLCAnJicpO1xuICAgICAgICAgICAgaWYgKHNtYXJ0TGFiZWwuaXNUcnVuY2F0ZWQpIHtcbiAgICAgICAgICAgICAgICBzbWFydExhYmVsLnRleHQgKz0gZWxsaXBzZXNTdHI7XG4gICAgICAgICAgICAgICAgc21hcnRMYWJlbC50b29sdGV4dCA9IHRvb2xUZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgc21hcnRMYWJlbC5oZWlnaHQgPSBjb250YWluZXIub2Zmc2V0SGVpZ2h0O1xuICAgICAgICBzbWFydExhYmVsLndpZHRoID0gY29udGFpbmVyLm9mZnNldFdpZHRoO1xuXG4gICAgICAgIHJldHVybiBzbWFydExhYmVsO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgc21hcnRMYWJlbC5lcnJvciA9IG5ldyBFcnJvcignQm9keSBUYWcgTWlzc2luZyEnKTtcbiAgICAgICAgcmV0dXJuIHNtYXJ0TGFiZWw7XG4gICAgfVxufTtcblxuLypcbiAqIEdldCB0aGUgaGVpZ2h0IGFuZCB3aWR0aCBvZiBhIHRleHQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHRleHQgLSBUZXh0IHdob3NlIG1ldHJpY3MgdG8gYmUgbWVhc3VyZWRcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gT3B0aW9uYWwgZGV0YWlsZWRDYWxjdWxhdGlvbkZsYWcgLSB0aGlzIGZsYWcgaWYgc2V0IGl0IGNhbGN1bGF0ZXMgcGVyIGxldHRlciBwb3NpdGlvblxuICogICAgICAgICAgICAgICAgICAgICAgICAgIGluZm9ybWF0aW9uIGFuZCByZXR1cm5zIGl0LiBJZGVhbGx5IHlvdSBkb250IG5lZWQgaXQgdW5sZXNzIHlvdSB3YW50IHRvIHBvc3QgcHJvY2VzcyB0aGVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJpbmcuIEFuZCBpdHMgYW4gRVhQRU5TSVZFIE9QRVJBVElPTi5cbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IC0gSWYgZGV0YWlsZWRDYWxjdWxhdGlvbkZsYWcgaXMgc2V0IHRvIHRydWUgdGhlIHJldHVybmVkIG9iamVjdCB3b3VsZCBiZVxuICogICAgICAgICAgICAgICAgICB7XG4gKiAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCBvZiB0aGUgdGV4dFxuICogICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHdpZHRoIG9mIHRoZSB0ZXh0XG4gKiAgICAgICAgICAgICAgICAgICAgICBkZXRhaWxPYmo6IGRldGFpbCBjYWxjdWxhdGlvbiBvZiBsZXR0ZXJzIGluIHRoZSBmb3JtYXQge2xldHRlcm5hbWU6IHdpZHRofVxuICogICAgICAgICAgICAgICAgICB9XG4gKiAgICAgICAgICAgICAgICAgIElmIGRldGFpbGVkQ2FsY3VsYXRpb25GbGFnIGlzIHNldCB0byBmYWxzZSB0aGUgcmV0dXJuZWQgb2JqZWN0IHdvbnQgaGF2ZSB0aGUgZGV0YWlsT2JqIHByb3AuXG4gKi9cblNtYXJ0TGFiZWxNYW5hZ2VyLnByb3RvdHlwZS5nZXRPcmlTaXplID0gZnVuY3Rpb24gKHRleHQsIGRldGFpbGVkQ2FsY3VsYXRpb25GbGFnKSB7XG4gICAgaWYgKCF0aGlzLl9pbml0KSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgdGV4dEFycixcbiAgICAgICAgbGV0dGVyLFxuICAgICAgICBsU2l6ZSxcbiAgICAgICAgaSxcbiAgICAgICAgbCxcbiAgICAgICAgY3VtdWxhdGl2ZVNpemUgPSAwLFxuICAgICAgICBoZWlnaHQgPSAwLFxuICAgICAgICBpbmRpU2l6ZVN0b3JlID0geyB9O1xuXG4gICAgaWYgKCFkZXRhaWxlZENhbGN1bGF0aW9uRmxhZykge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2FsQ2hhckRpbVdpdGhDYWNoZSh0ZXh0KTtcbiAgICB9XG5cbiAgICAvLyBDYWxjdWxhdGUgdGhlIHdpZHRoIG9mIGV2ZXJ5IGxldHRlciB3aXRoIGFuIGFwcHJveGltYXRpb25cbiAgICB0ZXh0QXJyID0gdGV4dC5zcGxpdCgnJyk7XG4gICAgZm9yIChpID0gMCwgbCA9IHRleHRBcnIubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGxldHRlciA9IHRleHRBcnJbaV07XG4gICAgICAgIGxTaXplID0gdGhpcy5fY2FsQ2hhckRpbVdpdGhDYWNoZShsZXR0ZXIsIHRydWUsIHRleHRBcnIubGVuZ3RoKTtcbiAgICAgICAgaGVpZ2h0ID0gbWF4KGhlaWdodCwgbFNpemUuaGVpZ2h0KTtcbiAgICAgICAgY3VtdWxhdGl2ZVNpemUgKz0gbFNpemUud2lkdGg7XG4gICAgICAgIGluZGlTaXplU3RvcmVbbGV0dGVyXSA9IGxTaXplLndpZHRoO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHdpZHRoOiByb3VuZChjdW11bGF0aXZlU2l6ZSksXG4gICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICBkZXRhaWxPYmo6IGluZGlTaXplU3RvcmVcbiAgICB9O1xufTtcblxuLypcbiAqIERpc3Bvc2UgdGhlIGNvbnRhaW5lciBhbmQgb2JqZWN0IGFsbG9jYXRlZCBieSB0aGUgc21hcnRsYWJlbFxuICovXG5TbWFydExhYmVsTWFuYWdlci5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuX2luaXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdGhpcy5fY29udGFpbmVyTWFuYWdlciAmJiB0aGlzLl9jb250YWluZXJNYW5hZ2VyLmRpc3Bvc2UgJiYgdGhpcy5fY29udGFpbmVyTWFuYWdlci5kaXNwb3NlKCk7XG5cbiAgICBkZWxldGUgdGhpcy5fY29udGFpbmVyO1xuICAgIGRlbGV0ZSB0aGlzLl9jb250ZXh0O1xuICAgIGRlbGV0ZSB0aGlzLl9jYWNoZTtcbiAgICBkZWxldGUgdGhpcy5fY29udGFpbmVyTWFuYWdlcjtcbiAgICBkZWxldGUgdGhpcy5fY29udGFpbmVyT2JqO1xuICAgIGRlbGV0ZSB0aGlzLmlkO1xuICAgIGRlbGV0ZSB0aGlzLnN0eWxlO1xuICAgIGRlbGV0ZSB0aGlzLnBhcmVudENvbnRhaW5lcjtcbiAgICBkZWxldGUgdGhpcy5fc2hvd05vRWxsaXBzZXM7XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFNtYXJ0TGFiZWxNYW5hZ2VyOyJdfQ==
