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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvYWthc2hnb3N3YW1pL0Z1c2lvbkNoYXJ0cy9Db2RlYmFzZS9mdXNpb25jaGFydHMtc21hcnRsYWJlbC9zcmMvY29udGFpbmVyLW1hbmFnZXIuanMiLCIvVXNlcnMvYWthc2hnb3N3YW1pL0Z1c2lvbkNoYXJ0cy9Db2RlYmFzZS9mdXNpb25jaGFydHMtc21hcnRsYWJlbC9zcmMvbGliLmpzIiwiL1VzZXJzL2FrYXNoZ29zd2FtaS9GdXNpb25DaGFydHMvQ29kZWJhc2UvZnVzaW9uY2hhcnRzLXNtYXJ0bGFiZWwvc3JjL1NtYXJ0bGFiZWxNYW5hZ2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7OzttQkNBZ0IsT0FBTzs7OztBQUV2QixJQUFJLEtBQUssR0FBRyxpQkFBSSxJQUFJLENBQUMsT0FBTyxNQUFNLEtBQUssV0FBVyxHQUFHLE1BQU0sWUFBTyxDQUFDO0lBQy9ELEdBQUcsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVE7SUFDeEIsZUFBZSxHQUFHLEtBQUssQ0FBQyxrQkFBa0IsRUFBRTtJQUM1QyxtQkFBbUIsR0FBRyxlQUFlLENBQUMsUUFBUSxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUM7O0FBRTdELFNBQVMsZ0JBQWdCLENBQUUsZUFBZSxFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUU7QUFDdEUsUUFBSSxHQUFHLENBQUM7O0FBRVIsaUJBQWEsR0FBRyxhQUFhLEdBQUcsQ0FBQyxHQUFHLGFBQWEsR0FBRyxDQUFDLENBQUM7QUFDdEQsaUJBQWEsR0FBRyxhQUFhLEdBQUcsRUFBRSxHQUFHLGFBQWEsR0FBRyxFQUFFLENBQUM7O0FBRXhELFFBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO0FBQ25DLFFBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0FBQ2xCLFFBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ2pCLFFBQUks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QyxPQUFPLEdBQUcsWUFBWTtBQUM5QyxRQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRTtBQUNiLGVBQU8sSUFBSSxDQUFDO0tBQ2Y7O0FBRUQsUUFBSSxDQUFDLGlCQUFpQixJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxDQUFDOztBQUU3RixXQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7QUFDdkIsV0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO0FBQ3JCLFdBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUNuQixXQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztBQUM5QixXQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7QUFDMUIsV0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDO0FBQ2YsV0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQ2xCLFdBQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQztBQUM1QixXQUFPLElBQUksQ0FBQyxlQUFlLENBQUM7O0FBRTVCLFdBQU8sSUFBSSxDQUFDO0NBQ2YsQ0FBQzs7cUJBRWEsaUJBQWlCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCBsaWIgZnJvbSAnLi9saWInO1xuXG52YXIgc2xMaWIgPSBsaWIuaW5pdCh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDogdGhpcyksXG4gICAgZG9jID0gc2xMaWIud2luLmRvY3VtZW50LFxuICAgIGRvY3VtZW50U3VwcG9ydCA9IHNsTGliLmdldERvY3VtZW50U3VwcG9ydCgpLFxuICAgIFNWR19CQk9YX0NPUlJFQ1RJT04gPSBkb2N1bWVudFN1cHBvcnQuaXNXZWJLaXQgPyAwIDogNC41O1xuXG5mdW5jdGlvbiBDb250YWluZXJNYW5hZ2VyIChwYXJlbnRDb250YWluZXIsIGlzQnJvd3Nlckxlc3MsIG1heENvbnRhaW5lcnMpIHtcbiAgICB2YXIgc3ZnO1xuXG4gICAgbWF4Q29udGFpbmVycyA9IG1heENvbnRhaW5lcnMgPiA1ID8gbWF4Q29udGFpbmVycyA6IDU7XG4gICAgbWF4Q29udGFpbmVycyA9IG1heENvbnRhaW5lcnMgPCAyMCA/IG1heENvbnRhaW5lcnMgOiAyMDtcblxuICAgIHRoaXMubWF4Q29udGFpbmVycyA9IG1heENvbnRhaW5lcnM7XG4gICAgdGhpcy5maXJzdCA9IG51bGw7XG4gICAgdGhpcy5sYXN0ID0gbnVsbDtcbiAgICB0aGlzLmNvbnRhaW5lcnMgPSB7fTtcbiAgICB0aGlzLmxlbmd0aCA9IDA7XG4gICAgdGhpcy5yb290Tm9kZSA9IHBhcmVudENvbnRhaW5lcjtcblxuICAgIGlmIChpc0Jyb3dzZXJMZXNzKSB7XG4gICAgICAgIHN2ZyA9IGRvYy5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywnc3ZnJyk7XG4gICAgICAgIHN2Zy5zZXRBdHRyaWJ1dGVOUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCd4bGluaycsJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnKTtcbiAgICAgICAgc3ZnLnNldEF0dHJpYnV0ZU5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsJ2hlaWdodCcsJzAnKTtcbiAgICAgICAgc3ZnLnNldEF0dHJpYnV0ZU5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsJ3dpZHRoJywnMCcpO1xuICAgICAgICB0aGlzLnN2Z1Jvb3QgPSBzdmc7XG4gICAgICAgIHRoaXMucm9vdE5vZGUuYXBwZW5kQ2hpbGQoc3ZnKTtcbiAgICB9XG59XG5cbkNvbnRhaW5lck1hbmFnZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChzdHlsZSkge1xuICAgIHZhciBkaWZmLFxuICAgICAgICBrZXksXG4gICAgICAgIGNvbnRhaW5lck9iaixcbiAgICAgICAgY29udGFpbmVycyA9IHRoaXMuY29udGFpbmVycyxcbiAgICAgICAgbGVuID0gdGhpcy5sZW5ndGgsXG4gICAgICAgIG1heCA9IHRoaXMubWF4Q29udGFpbmVycyxcbiAgICAgICAga2V5U3RyID0gJyc7XG5cbiAgICBmb3IgKGtleSBpbiBzbExpYi5zdXBwb3J0ZWRTdHlsZSkge1xuICAgICAgICBpZiAoc3R5bGVba2V5XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBrZXlTdHIgKz0gc2xMaWIuc3VwcG9ydGVkU3R5bGVba2V5XSArICc6JyArIHN0eWxlW2tleV0gKyAnOyc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWtleVN0cikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKGNvbnRhaW5lck9iaiA9IGNvbnRhaW5lcnNba2V5U3RyXSkge1xuICAgICAgICBpZiAodGhpcy5maXJzdCAhPT0gY29udGFpbmVyT2JqKSB7XG4gICAgICAgICAgICBjb250YWluZXJPYmoucHJldiAmJiAoY29udGFpbmVyT2JqLnByZXYubmV4dCA9IGNvbnRhaW5lck9iai5uZXh0KTtcbiAgICAgICAgICAgIGNvbnRhaW5lck9iai5uZXh0ICYmIChjb250YWluZXJPYmoubmV4dC5wcmV2ID0gY29udGFpbmVyT2JqLnByZXYpO1xuICAgICAgICAgICAgY29udGFpbmVyT2JqLm5leHQgPSB0aGlzLmZpcnN0O1xuICAgICAgICAgICAgY29udGFpbmVyT2JqLm5leHQucHJldiA9IGNvbnRhaW5lck9iajtcbiAgICAgICAgICAgICh0aGlzLmxhc3QgPT09IGNvbnRhaW5lck9iaikgJiYgKHRoaXMubGFzdCA9IGNvbnRhaW5lck9iai5wcmV2KTtcbiAgICAgICAgICAgIGNvbnRhaW5lck9iai5wcmV2ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuZmlyc3QgPSBjb250YWluZXJPYmo7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAobGVuID49IG1heCkge1xuICAgICAgICAgICAgZGlmZiA9IChsZW4gLSBtYXgpICsgMTtcbiAgICAgICAgICAgIC8vICsxIGlzIHRvIHJlbW92ZSBhbiBleHRyYSBlbnRyeSB0byBtYWtlIHNwYWNlIGZvciB0aGUgbmV3IGNvbnRhaW5lciB0byBiZSBhZGRlZC5cbiAgICAgICAgICAgIHdoaWxlIChkaWZmLS0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUNvbnRhaW5lcih0aGlzLmxhc3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnRhaW5lck9iaiA9IHRoaXMuYWRkQ29udGFpbmVyKGtleVN0cik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbnRhaW5lck9iajtcbn07XG5cbkNvbnRhaW5lck1hbmFnZXIucHJvdG90eXBlLmFkZENvbnRhaW5lciA9IGZ1bmN0aW9uIChrZXlTdHIpIHtcbiAgICB2YXIgbm9kZSxcbiAgICAgICAgY29udGFpbmVyO1xuXG4gICAgdGhpcy5jb250YWluZXJzW2tleVN0cl0gPSBjb250YWluZXIgPSB7XG4gICAgICAgIG5leHQ6IG51bGwsXG4gICAgICAgIHByZXY6IG51bGwsXG4gICAgICAgIG5vZGU6IG51bGwsXG4gICAgICAgIGVsbGlwc2VzV2lkdGg6IDAsXG4gICAgICAgIGxpbmVIZWlnaHQ6IDAsXG4gICAgICAgIGRvdFdpZHRoOiAwLFxuICAgICAgICBhdmdDaGFyV2lkdGg6IDQsXG4gICAgICAgIGtleVN0cjoga2V5U3RyLFxuICAgICAgICBjaGFyQ2FjaGU6IHt9XG4gICAgfTtcblxuICAgIC8vIFNpbmNlIHRoZSBjb250YWluZXIgb2JqZWN0cyBhcmUgYXJyYW5nZWQgZnJvbSBtb3N0IHJlY2VudCB0byBsZWFzdCByZWNlbnQgb3JkZXIsIHdlIG5lZWQgdG8gYWRkIHRoZSBuZXdcbiAgICAvLyBvYmplY3QgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgbGlzdC5cbiAgICBjb250YWluZXIubmV4dCA9IHRoaXMuZmlyc3Q7XG4gICAgY29udGFpbmVyLm5leHQgJiYgKGNvbnRhaW5lci5uZXh0LnByZXYgPSBjb250YWluZXIpO1xuICAgIHRoaXMuZmlyc3QgPSBjb250YWluZXI7XG4gICAgaWYgKCF0aGlzLmxhc3QpIHtcbiAgICAgICAgKHRoaXMubGFzdCA9IGNvbnRhaW5lcik7XG4gICAgfVxuICAgIHRoaXMubGVuZ3RoICs9IDE7XG5cbiAgICBub2RlID0gY29udGFpbmVyLm5vZGUgPSBkb2MuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5yb290Tm9kZS5hcHBlbmRDaGlsZChub2RlKTtcblxuICAgIGlmIChkb2N1bWVudFN1cHBvcnQuaXNJRSAmJiAhZG9jdW1lbnRTdXBwb3J0Lmhhc1NWRykge1xuICAgICAgICBub2RlLnN0eWxlLnNldEF0dHJpYnV0ZSgnY3NzVGV4dCcsIGtleVN0cik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBub2RlLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBrZXlTdHIpO1xuICAgIH1cblxuICAgIG5vZGUuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgbm9kZS5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAncHJlc2VudGF0aW9uJyk7XG4gICAgbm9kZS5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1ibG9jayc7XG5cbiAgICBub2RlLmlubmVySFRNTCA9IHNsTGliLnRlc3RTdHJBdmc7IC8vIEEgdGVzdCBzdHJpbmcuXG4gICAgY29udGFpbmVyLmxpbmVIZWlnaHQgPSBub2RlLm9mZnNldEhlaWdodDtcbiAgICBjb250YWluZXIuYXZnQ2hhcldpZHRoID0gKG5vZGUub2Zmc2V0V2lkdGggLyAzKTtcblxuICAgIGlmIChkb2N1bWVudFN1cHBvcnQuaXNCcm93c2VyTGVzcykge1xuICAgICAgICBub2RlID0gY29udGFpbmVyLnN2Z1RleHQgPSBkb2MuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsICd0ZXh0Jyk7XG4gICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKCdzdHlsZScsIGtleVN0cik7XG4gICAgICAgIHRoaXMuc3ZnUm9vdC5hcHBlbmRDaGlsZChub2RlKTtcblxuICAgICAgICBub2RlLnRleHRDb250ZW50ID0gc2xMaWIudGVzdFN0ckF2ZzsgLy8gQSB0ZXN0IHN0cmluZy5cbiAgICAgICAgY29udGFpbmVyLmxpbmVIZWlnaHQgPSBub2RlLmdldEJCb3goKS5oZWlnaHQ7XG4gICAgICAgIGNvbnRhaW5lci5hdmdDaGFyV2lkdGggPSAoKG5vZGUuZ2V0QkJveCgpLndpZHRoIC0gU1ZHX0JCT1hfQ09SUkVDVElPTikgLyAzKTtcblxuICAgICAgICBub2RlLnRleHRDb250ZW50ID0gJy4uLic7XG4gICAgICAgIGNvbnRhaW5lci5lbGxpcHNlc1dpZHRoID0gbm9kZS5nZXRCQm94KCkud2lkdGggLSBTVkdfQkJPWF9DT1JSRUNUSU9OO1xuICAgICAgICBub2RlLnRleHRDb250ZW50ID0gJy4nO1xuICAgICAgICBjb250YWluZXIuZG90V2lkdGggPSBub2RlLmdldEJCb3goKS53aWR0aCAtIFNWR19CQk9YX0NPUlJFQ1RJT047XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbm9kZS5pbm5lckhUTUwgPSAnLi4uJztcbiAgICAgICAgY29udGFpbmVyLmVsbGlwc2VzV2lkdGggPSBub2RlLm9mZnNldFdpZHRoO1xuICAgICAgICBub2RlLmlubmVySFRNTCA9ICcuJztcbiAgICAgICAgY29udGFpbmVyLmRvdFdpZHRoID0gbm9kZS5vZmZzZXRXaWR0aDtcbiAgICAgICAgbm9kZS5pbm5lckhUTUwgPSAnJztcbiAgICB9XG5cbiAgICByZXR1cm4gY29udGFpbmVyO1xufTtcblxuQ29udGFpbmVyTWFuYWdlci5wcm90b3R5cGUucmVtb3ZlQ29udGFpbmVyID0gZnVuY3Rpb24gKGNPYmopIHtcbiAgICB2YXIga2V5U3RyID0gY09iai5rZXlTdHI7XG5cbiAgICBpZiAoIWtleVN0ciB8fCAhdGhpcy5sZW5ndGggfHwgIWNPYmopIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmxlbmd0aCAtPSAxO1xuXG4gICAgY09iai5wcmV2ICYmIChjT2JqLnByZXYubmV4dCA9IGNPYmoubmV4dCk7XG4gICAgY09iai5uZXh0ICYmIChjT2JqLm5leHQucHJldiA9IGNPYmoucHJldik7XG4gICAgKHRoaXMuZmlyc3QgPT09IGNPYmopICYmICh0aGlzLmZpcnN0ID0gY09iai5uZXh0KTtcbiAgICAodGhpcy5sYXN0ID09PSBjT2JqKSAmJiAodGhpcy5sYXN0ID0gY09iai5wcmV2KTtcblxuICAgIGNPYmoubm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGNPYmoubm9kZSk7XG4gICAgXG4gICAgZGVsZXRlIHRoaXMuY29udGFpbmVyc1trZXlTdHJdO1xufTtcblxuQ29udGFpbmVyTWFuYWdlci5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIga2V5LFxuICAgICAgICBjb250YWluZXJzID0gdGhpcy5jb250YWluZXJzO1xuXG4gICAgdGhpcy5tYXhDb250YWluZXJzID0gbnVsbDtcbiAgICBmb3IgKGtleSBpbiBjb250YWluZXJzKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlQ29udGFpbmVyKGNvbnRhaW5lcnNba2V5XSk7XG4gICAgfVxuXG4gICAgdGhpcy5yb290Tm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMucm9vdE5vZGUpO1xuXG4gICAgdGhpcy5yb290Tm9kZSA9IG51bGw7XG4gICAgdGhpcy5maXJzdCA9IG51bGw7XG4gICAgdGhpcy5sYXN0ID0gbnVsbDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udGFpbmVyTWFuYWdlcjsiLCJ2YXIgbGliID0ge1xuXHRpbml0OiBmdW5jdGlvbiAod2luKSB7XG5cdFx0dmFyIGRvYyA9IHdpbi5kb2N1bWVudCxcbiAgICAgICAgXHRuYXYgPSB3aW4ubmF2aWdhdG9yLFxuICAgICAgICBcdHVzZXJBZ2VudCA9IG5hdi51c2VyQWdlbnQsXG4gICAgICAgIFx0RElWID0gJ0RJVicsXG4gICAgICAgIFx0Y2VpbCA9IE1hdGguY2VpbCxcbiAgICAgICAgXHRmbG9vciA9IE1hdGguZmxvb3IsXG4gICAgICAgIFx0Y29udGFpbmVySW5zdGFuY2VDb3VudCA9IDAsXG4gICAgICAgIFx0Y2xzTmFtZVNwYWNlID0gJ2Z1c2lvbmNoYXJ0cy1zbWFydGxhYmVsLScsXG4gICAgICAgIFx0Y29udGFpbmVyQ2xhc3MgPSBjbHNOYW1lU3BhY2UgKyAnY29udGFpbmVyJyxcbiAgICAgICAgXHRjbGFzc05hbWVXaXRoVGFnID0gY2xzTmFtZVNwYWNlICsgJ3RhZycsXG4gICAgICAgIFx0Y2xhc3NOYW1lV2l0aFRhZ0JSID0gY2xzTmFtZVNwYWNlICsgJ2JyJztcblxuXHRcdGxpYiA9IHtcblx0XHRcdHdpbjogd2luLFxuXG5cdFx0XHRjb250YWluZXJDbGFzczogY29udGFpbmVyQ2xhc3MsXG5cblx0XHRcdGNsYXNzTmFtZVdpdGhUYWc6IGNsYXNzTmFtZVdpdGhUYWcsXG5cblx0XHRcdGNsYXNzTmFtZVdpdGhUYWdCUjogY2xhc3NOYW1lV2l0aFRhZ0JSLFxuXHRcdFx0XG5cdFx0XHRtYXhEZWZhdWx0Q2FjaGVMaW1pdDogNTAwLFxuXG5cdFx0XHRjbGFzc05hbWVSZWc6IG5ldyBSZWdFeHAoJ1xcYicgKyBjbGFzc05hbWVXaXRoVGFnICsgJ1xcYicpLFxuXHRcdFx0XG5cdFx0XHRjbGFzc05hbWVCclJlZzogbmV3IFJlZ0V4cCgnXFxiJyArIGNsYXNzTmFtZVdpdGhUYWdCUiArICdcXGInKSxcblxuXHRcdFx0c3BhbkFkZGl0aW9uUmVneDogLyg8W148XFw+XSs/XFw+KXwoJig/OlthLXpdK3wjWzAtOV0rKTt8LikvaWcsXG5cdFx0XHRcblx0XHRcdHNwYW5BZGRpdGlvblJlcGxhY2VyOiAnJDE8c3BhbiBjbGFzcz1cIicrIGNsYXNzTmFtZVdpdGhUYWcgKyAnXCI+JDI8L3NwYW4+JyxcblxuXHRcdFx0c3BhblJlbW92YWxSZWd4OiBuZXcgUmVnRXhwKCdcXFxcPHNwYW5bXlxcXFw+XSs/JysgY2xhc3NOYW1lV2l0aFRhZyArJ1teXFxcXD5dezAsfVxcXFw+KC4qPylcXFxcPFxcXFwvc3BhblxcXFw+JywgJ2lnJyksXG5cblx0XHRcdHhtbFRhZ1JlZ0V4OiBuZXcgUmVnRXhwKCc8W14+XVtePF0qW14+XSs+JywgJ2knKSxcblxuXHRcdFx0bHRndFJlZ2V4OiAvJmx0O3wmZ3Q7L2csXG4gICAgICAgIFx0XG4gICAgICAgIFx0YnJSZXBsYWNlUmVnZXg6IC88YnJcXC8+L2lnLFxuXG4gICAgICAgIFx0dGVzdFN0ckF2ZzogJ1dnSScsXG5cbiAgICAgICAgXHQvLyBUaGlzIHN0eWxlIGlzIGFwcGxpZWQgb3ZlciB0aGUgcGFyZW50IHNtYXJ0bGFiZWwgY29udGFpbmVyLiBUaGUgY29udGFpbmVyIGlzIGtlcHQgaGlkZGVuIGZyb20gdGhlIHZpZXdwb3J0XG5cdFx0XHRwYXJlbnRDb250YWluZXJTdHlsZToge1xuXHRcdFx0ICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuXHRcdFx0ICAgIHRvcDogJy05OTk5ZW0nLFxuXHRcdFx0ICAgIHdoaXRlU3BhY2U6ICdub3dyYXAnLFxuXHRcdFx0ICAgIHBhZGRpbmc6ICcwcHgnLFxuXHRcdFx0ICAgIHdpZHRoOiAnMXB4Jyxcblx0XHRcdCAgICBoZWlnaHQ6ICcxcHgnLFxuXHRcdFx0ICAgIG92ZXJmbG93OiAnaGlkZGVuJ1xuXHRcdFx0fSxcblxuXHRcdFx0Ly8gQWxsIHRoZSBzdHlsZSB3aGljaCBtaWdodCBhZmZlY3QgdGhlIHRleHQgbWV0cmljc1xuXHRcdFx0c3VwcG9ydGVkU3R5bGU6IHtcblx0XHRcdCAgICBmb250OiAnZm9udCcsXG5cdFx0XHQgICAgZm9udEZhbWlseTogJ2ZvbnQtZmFtaWx5Jyxcblx0XHRcdCAgICAnZm9udC1mYW1pbHknOiAnZm9udC1mYW1pbHknLFxuXHRcdFx0ICAgIGZvbnRXZWlnaHQ6ICdmb250LXdlaWdodCcsXG5cdFx0XHQgICAgJ2ZvbnQtd2VpZ2h0JzogJ2ZvbnQtd2VpZ2h0Jyxcblx0XHRcdCAgICBmb250U2l6ZTogJ2ZvbnQtc2l6ZScsXG5cdFx0XHQgICAgJ2ZvbnQtc2l6ZSc6ICdmb250LXNpemUnLFxuXHRcdFx0ICAgIGxpbmVIZWlnaHQ6ICdsaW5lLWhlaWdodCcsXG5cdFx0XHQgICAgJ2xpbmUtaGVpZ2h0JzogJ2xpbmUtaGVpZ2h0Jyxcblx0XHRcdCAgICBmb250U3R5bGU6ICdmb250LXN0eWxlJyxcblx0XHRcdCAgICAnZm9udC1zdHlsZSc6ICdmb250LXN0eWxlJ1xuXHRcdFx0fSxcblxuXHRcdFx0Ly8gR2V0IHRoZSBzdXBwb3J0IGxpc3QgZm9yIGh0bWwgdGhlIGRvY3VtZW50IHdoZXJlIHRoZSB0ZXh0IGNhbGN1dGlvbiBpcyB0byBiZSBkb25lLlxuXHRcdFx0Z2V0RG9jdW1lbnRTdXBwb3J0OiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHZhciBjaGlsZFJldHJpdmVyRm4sXG5cdFx0XHRcdCAgICBjaGlsZFJldHJpdmVyU3RyaW5nLFxuXHRcdFx0XHQgICAgbm9DbGFzc1Rlc3Rpbmc7XG5cblx0XHRcdFx0aWYgKGRvYy5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKSB7XG5cdFx0XHRcdCAgICBjaGlsZFJldHJpdmVyRm4gPSAnZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSc7XG5cdFx0XHRcdCAgICBjaGlsZFJldHJpdmVyU3RyaW5nID0gY2xhc3NOYW1lV2l0aFRhZztcblx0XHRcdFx0ICAgIG5vQ2xhc3NUZXN0aW5nID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0ICAgIGNoaWxkUmV0cml2ZXJGbiA9ICdnZXRFbGVtZW50c0J5VGFnTmFtZSc7XG5cdFx0XHRcdCAgICBjaGlsZFJldHJpdmVyU3RyaW5nID0gJ3NwYW4nO1xuXHRcdFx0XHQgICAgbm9DbGFzc1Rlc3RpbmcgPSBmYWxzZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdCAgICBpc0lFOiAvbXNpZS9pLnRlc3QodXNlckFnZW50KSAmJiAhd2luLm9wZXJhLFxuXHRcdFx0XHQgICAgaGFzU1ZHOiBCb29sZWFuKHdpbi5TVkdBbmdsZSB8fCBkb2MuaW1wbGVtZW50YXRpb24uaGFzRmVhdHVyZShcblx0XHRcdFx0ICAgICAgICAnaHR0cDovL3d3dy53My5vcmcvVFIvU1ZHMTEvZmVhdHVyZSNCYXNpY1N0cnVjdHVyZScsICcxLjEnKSksXG5cdFx0XHRcdCAgICBpc0hlYWRMZXNzOiBuZXcgUmVnRXhwKCcgSHRtbFVuaXQnKS50ZXN0KHVzZXJBZ2VudCksXG5cdFx0XHRcdCAgICBpc1dlYktpdDogbmV3IFJlZ0V4cCgnIEFwcGxlV2ViS2l0LycpLnRlc3QodXNlckFnZW50KSxcblx0XHRcdFx0ICAgIGNoaWxkUmV0cml2ZXJGbjogY2hpbGRSZXRyaXZlckZuLFxuXHRcdFx0XHQgICAgY2hpbGRSZXRyaXZlclN0cmluZzogY2hpbGRSZXRyaXZlclN0cmluZyxcblx0XHRcdFx0ICAgIG5vQ2xhc3NUZXN0aW5nOiBub0NsYXNzVGVzdGluZ1xuXHRcdFx0XHR9O1xuXHRcdFx0fSxcblxuXHRcdFx0Lypcblx0XHRcdCAqIENyZWF0ZSBhIGh0bWwgZGl2IGVsZW1lbnQgYW5kIGF0dGFjaCBpdCB3aXRoIGEgcGFyZW50LiBBbGwgdGhlIHN1YnNlcXVlbnQgb3BlcmF0aW9ucyBhcmUgcGVyZm9ybWVkXG5cdFx0XHQgKiBieSB1cGRpbmcgdGhpcyBkb20gdHJlZSBvbmx5LlxuXHRcdFx0ICpcblx0XHRcdCAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IC0gVGhlIGh0bWwgZWxlbWVudCB3aGVyZSB0aGUgbmV3bHkgY3JlYXRlZCBkaXYgaXMgdG8gYmUgYXR0YWNoZWQuIElmIG5vdCBwYXNzZWQsXG5cdFx0XHQgKiAgICAgICAgICAgICAgICAgICAgICB0aGUgbmV3IGRpdiBpcyBhcHBlbmRlZCBvbiB0aGUgYm9keS5cblx0XHRcdCAqL1xuXHRcdFx0Y3JlYXRlQ29udGFpbmVyOiBmdW5jdGlvbiAoY29udGFpbmVyUGFyZW50KSB7XG5cdFx0XHQgICAgdmFyIGJvZHksXG5cdFx0XHQgICAgICAgIGNvbnRhaW5lcjtcblxuXHRcdFx0ICAgIGlmIChjb250YWluZXJQYXJlbnQgJiYgKGNvbnRhaW5lclBhcmVudC5vZmZzZXRXaWR0aCB8fCBjb250YWluZXJQYXJlbnQub2Zmc2V0SGVpZ2h0KSkge1xuXHRcdFx0ICAgICAgICBpZiAoY29udGFpbmVyUGFyZW50LmFwcGVuZENoaWxkKSB7XG5cdFx0XHQgICAgICAgICAgICBjb250YWluZXJQYXJlbnQuYXBwZW5kQ2hpbGQoY29udGFpbmVyID0gZG9jLmNyZWF0ZUVsZW1lbnQoRElWKSk7XG5cdFx0XHQgICAgICAgICAgICBjb250YWluZXIuY2xhc3NOYW1lID0gY29udGFpbmVyQ2xhc3M7XG5cdFx0XHQgICAgICAgICAgICBjb250YWluZXIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG5cdFx0XHQgICAgICAgICAgICBjb250YWluZXIuc2V0QXR0cmlidXRlKCdyb2xlJywgJ3ByZXNlbnRhdGlvbicpO1xuXHRcdFx0ICAgICAgICAgICAgcmV0dXJuIGNvbnRhaW5lcjtcblx0XHRcdCAgICAgICAgfVxuXHRcdFx0ICAgIH1cblx0XHRcdCAgICBlbHNlIHtcblx0XHRcdCAgICAgICAgYm9keSA9IGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdO1xuXG5cdFx0XHQgICAgICAgIGlmIChib2R5ICYmIGJvZHkuYXBwZW5kQ2hpbGQpIHtcblx0XHRcdCAgICAgICAgICAgIGNvbnRhaW5lciA9IGRvYy5jcmVhdGVFbGVtZW50KERJVik7XG5cdFx0XHQgICAgICAgICAgICBjb250YWluZXIuY2xhc3NOYW1lID0gY29udGFpbmVyQ2xhc3M7XG5cdFx0XHQgICAgICAgICAgICBjb250YWluZXIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG5cdFx0XHQgICAgICAgICAgICBjb250YWluZXIuc2V0QXR0cmlidXRlKCdyb2xlJywgJ3ByZXNlbnRhdGlvbicpO1xuXHRcdFx0ICAgICAgICAgICAgY29udGFpbmVySW5zdGFuY2VDb3VudCArPSAxO1xuXHRcdFx0ICAgICAgICAgICAgYm9keS5hcHBlbmRDaGlsZChjb250YWluZXIpO1xuXHRcdFx0ICAgICAgICAgICAgcmV0dXJuIGNvbnRhaW5lcjtcblx0XHRcdCAgICAgICAgfVxuXHRcdFx0ICAgIH1cblx0XHRcdH0sXG5cblx0XHRcdC8vIEZpbmRzIGEgYXBwcm94aW1hdGUgcG9zaXRpb24gd2hlcmUgdGhlIHRleHQgaXMgdG8gYmUgYnJva2VuXG5cdFx0XHRnZXROZWFyZXN0QnJlYWtJbmRleDogZnVuY3Rpb24gICh0ZXh0LCBtYXhXaWR0aCwgc2wpIHtcblx0XHRcdCAgICBpZiAoIXRleHQgfHwgIXRleHQubGVuZ3RoKSB7XG5cdFx0XHQgICAgICAgIHJldHVybiAwO1xuXHRcdFx0ICAgIH1cblxuXHRcdFx0ICAgIHZhciBkaWZmZXJlbmNlLFxuXHRcdFx0ICAgICAgICBnZXRXaWR0aCA9IHNsLl9nZXRXaWR0aEZuKCksXG5cdFx0XHQgICAgICAgIGNoYXJMZW4gPSAwLFxuXHRcdFx0ICAgICAgICBpbmNyZW1lbnQgPSAwLFxuXHRcdFx0ICAgICAgICBvcmlXaWR0aCA9IGdldFdpZHRoKHRleHQpLFxuXHRcdFx0ICAgICAgICBhdmdXaWR0aCA9IG9yaVdpZHRoIC8gdGV4dC5sZW5ndGg7XG5cblx0XHRcdCAgICBkaWZmZXJlbmNlID0gbWF4V2lkdGg7XG5cdFx0XHQgICAgY2hhckxlbiA9IGNlaWwobWF4V2lkdGggLyBhdmdXaWR0aCk7XG5cblx0XHRcdCAgICBpZiAob3JpV2lkdGggPCBtYXhXaWR0aCkge1xuXHRcdFx0ICAgICAgICByZXR1cm4gKHRleHQubGVuZ3RoIC0gMSk7XG5cdFx0XHQgICAgfVxuXG5cdFx0XHQgICAgaWYgKGNoYXJMZW4gPiB0ZXh0Lmxlbmd0aCkge1xuXHRcdFx0ICAgICAgICBkaWZmZXJlbmNlID0gbWF4V2lkdGggLSBvcmlXaWR0aDtcblx0XHRcdCAgICAgICAgY2hhckxlbiA9IHRleHQubGVuZ3RoO1xuXHRcdFx0ICAgIH1cblxuXHRcdFx0ICAgIHdoaWxlIChkaWZmZXJlbmNlID4gMCkge1xuXHRcdFx0ICAgICAgICBkaWZmZXJlbmNlID0gbWF4V2lkdGggLSBnZXRXaWR0aCh0ZXh0LnN1YnN0cigwLCBjaGFyTGVuKSk7XG5cdFx0XHQgICAgICAgIGluY3JlbWVudCA9IGZsb29yKGRpZmZlcmVuY2UgLyBhdmdXaWR0aCk7XG5cdFx0XHQgICAgICAgIGlmIChpbmNyZW1lbnQpIHtcblx0XHRcdCAgICAgICAgICAgIGNoYXJMZW4gKz0gaW5jcmVtZW50O1xuXHRcdFx0ICAgICAgICB9IGVsc2Uge1xuXHRcdFx0ICAgICAgICAgICAgcmV0dXJuIGNoYXJMZW47XG5cdFx0XHQgICAgICAgIH1cblx0XHRcdCAgICB9XG5cblx0XHRcdCAgICB3aGlsZSAoZGlmZmVyZW5jZSA8IDApIHtcblx0XHRcdCAgICAgICAgZGlmZmVyZW5jZSA9IG1heFdpZHRoIC0gZ2V0V2lkdGgodGV4dC5zdWJzdHIoMCwgY2hhckxlbikpO1xuXHRcdFx0ICAgICAgICBpbmNyZW1lbnQgPSBmbG9vcihkaWZmZXJlbmNlIC8gYXZnV2lkdGgpO1xuXHRcdFx0ICAgICAgICBpZiAoaW5jcmVtZW50KSB7XG5cdFx0XHQgICAgICAgICAgICBjaGFyTGVuICs9IGluY3JlbWVudDtcblx0XHRcdCAgICAgICAgfSBlbHNlIHtcblx0XHRcdCAgICAgICAgICAgIHJldHVybiBjaGFyTGVuO1xuXHRcdFx0ICAgICAgICB9XG5cdFx0XHQgICAgfVxuXHRcdFx0ICAgIHJldHVybiBjaGFyTGVuO1xuXHRcdFx0fSxcblxuXHRcdFx0Lypcblx0XHRcdCAqIERldGVybWluZSBsaW5laGVpZ2h0IG9mIGEgdGV4dCBmb3IgYSBnaXZlbiBzdHlsZS4gSXQgYWRkcyBwcm9wZXJ5IGxpbmVIZWlnaHQgdG8gdGhlIHN0eWxlIHBhc3NlZFxuXHRcdFx0ICpcblx0XHRcdCAqIEBwYXJhbSB7T2JqZWN0fSAtIFRoZSBzdHlsZSBiYXNlZCBvbiB3aGljaCB0aGUgdGV4dCdzIG1ldHJpYyBuZWVkcyB0byBiZSBjYWxjdWxhdGVkLiBUaGUgY2FsY3VsYXRpb24gaGFwcGVuc1xuXHRcdFx0ICogICAgICAgICAgICAgICAgICBiYXNlZCBvbiBmb250U2l6ZSBwcm9wZXJ0eSwgaWYgaXRzIG5vdCBwcmVzZW50IGEgZGVmYXVsdCBmb250IHNpemUgaXMgYXNzdW1lZC5cblx0XHRcdCAqXG5cdFx0XHQgKiBAcmV0dXJuIHtPYmplY3R9IC0gVGhlIHN0eWxlIHRoYXQgd2FzIHBhc3NlZCB3aXRoIGxpbmVIZWlnaHQgYXMgYSBuYW1lZCBwcm9wZXJ5IHNldCBvbiB0aGUgb2JqZWN0LlxuXHRcdFx0ICovXG5cdFx0XHRzZXRMaW5lSGVpZ2h0OiBmdW5jdGlvbiAgKHN0eWxlT2JqKSB7XG5cdFx0ICAgICAgICB2YXIgZlNpemUgPSBzdHlsZU9iai5mb250U2l6ZSA9IChzdHlsZU9iai5mb250U2l6ZSB8fCAnMTJweCcpO1xuXHRcdCAgICAgICAgc3R5bGVPYmoubGluZUhlaWdodCA9IHN0eWxlT2JqLmxpbmVIZWlnaHQgfHwgc3R5bGVPYmpbJ2xpbmUtaGVpZ2h0J10gfHwgKChwYXJzZUludChmU2l6ZSwgMTApICogMS4yKSArICdweCcpO1xuXHRcdCAgICAgICAgcmV0dXJuIHN0eWxlT2JqO1xuXHRcdCAgICB9XG5cdFx0fTtcblxuXHRcdHJldHVybiBsaWI7XG5cdH1cbn07XG5cblxuZXhwb3J0IGRlZmF1bHQgbGliOyIsImltcG9ydCBsaWIgZnJvbSAnLi9saWInO1xuaW1wb3J0IENvbnRhaW5lck1hbmFnZXIgZnJvbSAnLi9jb250YWluZXItbWFuYWdlcic7XG5cbnZhciBzbExpYiA9IGxpYi5pbml0KHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB0aGlzKSxcbiAgICBkb2MgPSBzbExpYi53aW4uZG9jdW1lbnQsXG4gICAgTSA9IHNsTGliLndpbi5NYXRoLFxuICAgIG1heCA9IE0ubWF4LFxuICAgIHJvdW5kID0gTS5yb3VuZCxcbiAgICBCTEFOSyA9ICcnLFxuICAgIGh0bWxTcGxDaGFyU3BhY2UgPSB7ICcgJzogJyZuYnNwOycgfSxcbiAgICBkb2N1bWVudFN1cHBvcnQgPSBzbExpYi5nZXREb2N1bWVudFN1cHBvcnQoKSxcbiAgICBTVkdfQkJPWF9DT1JSRUNUSU9OID0gZG9jdW1lbnRTdXBwb3J0LmlzV2ViS2l0ID8gMCA6IDQuNTtcblxuLypcbiAqIENyZWF0ZSBuZXcgaW5zdGFuY2Ugb2YgU21hcnRMYWJlbE1hbmFnZXIuXG4gKlxuICogU21hcnRMYWJlbE1hbmFnZXIgY29udHJvbHMgdGhlIGxpZmV0aW1lIG9mIHRoZSBleGVjdXRpb24gc3BhY2Ugd2hlcmUgdGhlIHRleHQncyBtZXRyaWNzIHdpbGwgYmUgY2FsY3VsYXRlZC5cbiAqIFRoaXMgdGFrZXMgYSBzdHJpbmcgZm9yIGEgZ2l2ZW4gc3R5bGUgYW5kIHJldHVybnMgdGhlIGhlaWdodCwgd2lkdGguXG4gKiBJZiBhIGJvdW5kIGJveCBpcyBkZWZpbmVkIGl0IHdyYXBzIHRoZSB0ZXh0IGFuZCByZXR1cm5zIHRoZSB3cmFwcGVkIGhlaWdodCBhbmQgd2lkdGguXG4gKiBJdCBhbGxvd3MgdG8gYXBwZW5kIGVsbGlwc2lzIGF0IHRoZSBlbmQgaWYgdGhlIHRleHQgaXMgdHJ1bmNhdGVkLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nIHwgTnVtYmVyfSBpZCAtIElkIG9mIHRoZSBpbnN0YW5jZS4gSWYgdGhlIHNhbWUgaWQgaXMgcGFzc2VkLCBpdCBkaXNwb3NlcyB0aGUgb2xkIGluc3RhbmNlIGFuZFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYXZlIHRoZSBuZXcgb25lO1xuICogQHBhcmFtIHtTdHJpbmcgfCBIVE1MRWxlbWVudH0gY29udGFpbmVyIC0gVGhlIGlkIG9yIHRoZSBpbnN0YW5jZSBvZiB0aGUgY29udGFpbmVyIHdoZXJlIHRoZSBpbnRlcm1lZGlhdGUgZG9tXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnRzIGFyZSB0byBiZSBhdHRhY2hlZC4gSWYgbm90IHBhc3NlZCwgaXQgYXBwZW5kcyBpbiBkaXZcbiAqXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHVzZUVsbGlwc2VzIC0gVGhpcyBkZWNpZGVzIGlmIGEgZWxsaXBzZXMgdG8gYmUgYXBwZW5kZWQgaWYgdGhlIHRleHQgaXMgdHJ1bmNhdGVkLlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBDb250cm9sIG9wdGlvbnNcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heENhY2hlTGltaXQ6IE5vIG9mIGxldHRlciB0byBiZSBjYWNoZWQuIERlZmF1bHQ6IDUwMC5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gU21hcnRMYWJlbE1hbmFnZXIoaWQsIGNvbnRhaW5lciwgdXNlRWxsaXBzZXMsIG9wdGlvbnMpIHtcbiAgICB2YXIgd3JhcHBlcixcbiAgICAgICAgcHJvcCxcbiAgICAgICAgbWF4LFxuICAgICAgICBwcmV2SW5zdGFuY2UsXG4gICAgICAgIGlzQnJvd3Nlckxlc3MgPSBmYWxzZSxcbiAgICAgICAgc3RvcmUgPSBTbWFydExhYmVsTWFuYWdlci5zdG9yZTtcblxuICAgIGlmICh0eXBlb2YgaWQgPT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBpZCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChwcmV2SW5zdGFuY2UgPSBzdG9yZVtpZF0pIHtcbiAgICAgICAgcHJldkluc3RhbmNlLmRpc3Bvc2UoKTtcbiAgICB9XG5cbiAgICBzdG9yZVtpZF0gPSB0aGlzO1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIG9wdGlvbnMubWF4Q2FjaGVMaW1pdCA9IGlzRmluaXRlKG1heCA9IG9wdGlvbnMubWF4Q2FjaGVMaW1pdCkgPyBtYXggOiBzbExpYi5tYXhEZWZhdWx0Q2FjaGVMaW1pdDtcblxuICAgIGlmICh0eXBlb2YgY29udGFpbmVyID09PSAnc3RyaW5nJykge1xuICAgICAgICBjb250YWluZXIgPSBkb2MuZ2V0RWxlbWVudEJ5SWQoY29udGFpbmVyKTtcbiAgICB9XG5cbiAgICB3cmFwcGVyID0gc2xMaWIuY3JlYXRlQ29udGFpbmVyKGNvbnRhaW5lcik7XG4gICAgd3JhcHBlci5pbm5lckhUTUwgPSBzbExpYi50ZXN0U3RyQXZnO1xuXG4gICAgaWYgKGRvY3VtZW50U3VwcG9ydC5pc0hlYWRMZXNzIHx8ICghZG9jdW1lbnRTdXBwb3J0LmlzSUUgJiYgIXdyYXBwZXIub2Zmc2V0SGVpZ2h0ICYmICF3cmFwcGVyLm9mZnNldFdpZHRoKSkge1xuICAgICAgICBpc0Jyb3dzZXJMZXNzID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB3cmFwcGVyLmlubmVySFRNTCA9ICcnO1xuICAgIGZvciAocHJvcCBpbiBzbExpYi5wYXJlbnRDb250YWluZXJTdHlsZSkge1xuICAgICAgICB3cmFwcGVyLnN0eWxlW3Byb3BdID0gc2xMaWIucGFyZW50Q29udGFpbmVyU3R5bGVbcHJvcF07XG4gICAgfVxuXG4gICAgdGhpcy5pZCA9IGlkO1xuICAgIHRoaXMucGFyZW50Q29udGFpbmVyID0gd3JhcHBlcjtcblxuICAgIHRoaXMuX2NvbnRhaW5lck1hbmFnZXIgPSBuZXcgQ29udGFpbmVyTWFuYWdlcih3cmFwcGVyLCBpc0Jyb3dzZXJMZXNzLCAxMCk7XG4gICAgdGhpcy5fc2hvd05vRWxsaXBzZXMgPSAhdXNlRWxsaXBzZXM7XG4gICAgdGhpcy5faW5pdCA9IHRydWU7XG4gICAgdGhpcy5zdHlsZSA9IHt9O1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cbiAgICB0aGlzLnNldFN0eWxlKCk7XG59XG5cbi8qXG4gKiBnZXRTbWFydFRleHQgcmV0dXJucyB0aGUgdGV4dCBzZXBhcmF0ZWQgYnkgPGJyLz4gd2hlbmV2ZXIgYSBicmVhayBpcyBuZWNlc3NhcnkuIFRoaXMgaXMgdG8gcmVjZ29uaXplIG9uZVxuICogZ2VuZXJhbGl6ZWQgZm9ybWF0IGluZGVwZW5kZW50IG9mIHRoZSBpbXBsZW1lbnRhdGlvbiAoY2FudmFzIGJhc2VkIHNvbHV0aW9uLCBzdmcgYmFzZWQgc29sdXRpb24pLiBUaGlzIG1ldGhvZFxuICogY29udmVydHMgdGhlIG91dHB1dCBvZiBnZXRTbWFydFRleHQoKS50ZXh0IHRvIGFycmF5IG9mIGxpbmVzIGlmIHRoZSB0ZXh0IGlzIHdyYXBwZWQuIEl0IHNldHMgYSBuYW1lZCBwcm9wZXJ0eVxuICogYGxpbmVzYCBvbiB0aGUgb2JqZWN0IHBhc3NlZCBhcyBwYXJhbWV0ZXIuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHNtYXJ0bGFiZWwgLSB0aGUgb2JqZWN0IHJldHVybmVkIGJ5IGdldFNtYXJ0VGV4dCBiYXNlZCBvbiB3aGljaCBsaW5lIGFyciB3aGljaCB0byBiZSBmb3JtZWQuXG4gKlxuICogQHJldHVybiB7T2JqZWN0fSAtIFRoZSBzYW1lIG9iamVjdCB3aGljaCB3YXMgcGFzc2VkIGluIHRoZSBhcmd1bWVudHMuIEFsc28gYSBuYW1lZCBwcm9wZXJ0eSBgbGluZXNgIGlzIHNldC5cbiAqL1xuU21hcnRMYWJlbE1hbmFnZXIudGV4dFRvTGluZXMgPSBmdW5jdGlvbiAoc21hcnRsYWJlbCkge1xuICAgIHNtYXJ0bGFiZWwgPSBzbWFydGxhYmVsIHx8IHt9O1xuXG4gICAgaWYgKCFzbWFydGxhYmVsLnRleHQpIHtcbiAgICAgICAgc21hcnRsYWJlbC50ZXh0ID0gJyc7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc21hcnRsYWJlbC50ZXh0ICE9PSAnc3RyaW5nJykge1xuICAgICAgICBzbWFydGxhYmVsLnRleHQgPSBzbWFydGxhYmVsLnRleHQudG9TdHJpbmcoKTtcbiAgICB9XG5cbiAgICBzbWFydGxhYmVsLmxpbmVzID0gc21hcnRsYWJlbC50ZXh0LnNwbGl0KC9cXG58PGJyXFxzKj9cXC8/Pi9pZyk7XG4gICAgcmV0dXJuIHNtYXJ0bGFiZWw7XG59O1xuXG4vLyBTYXZlcyBhbGwgdGhlIGluc3RhbmNlIGNyZWF0ZWQgc28gZmFyXG5TbWFydExhYmVsTWFuYWdlci5zdG9yZSA9IHt9O1xuXG4vLyBDYWxjdWxhdGVzIHNwYWNlIHRha2VuIGJ5IGEgY2hhcmFjdGVyIHdpdGggYW4gYXBwcm94aW1hdGlvbiB2YWx1ZSB3aGljaCBpcyBjYWxjdWxhdGVkIGJ5IHJlcGVhdGluZyB0aGVcbi8vIGNoYXJhY3RlciBieSBzdHJpbmcgbGVuZ3RoIHRpbWVzLlxuU21hcnRMYWJlbE1hbmFnZXIucHJvdG90eXBlLl9jYWxDaGFyRGltV2l0aENhY2hlID0gZnVuY3Rpb24gKHRleHQsIGNhbGN1bGF0ZURpZmZlcmVuY2UsIGxlbmd0aCkge1xuICAgIGlmICghdGhpcy5faW5pdCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIHNpemUsXG4gICAgICAgIGNzQXJyLFxuICAgICAgICB0dyxcbiAgICAgICAgdHdpLFxuICAgICAgICBjYWNoZWRTdHlsZSxcbiAgICAgICAgYXN5bW1ldHJpY0RpZmZlcmVuY2UsXG4gICAgICAgIG1heEFkdmFuY2VkQ2FjaGVMaW1pdCA9IHRoaXMub3B0aW9ucy5tYXhDYWNoZUxpbWl0LFxuICAgICAgICBjb250YWluZXIgPSB0aGlzLl9jb250YWluZXIsXG4gICAgICAgIHN0eWxlID0gdGhpcy5zdHlsZSB8fCB7fSxcbiAgICAgICAgY2FjaGUgPSB0aGlzLl9hZHZhbmNlZENhY2hlIHx8ICh0aGlzLl9hZHZhbmNlZENhY2hlID0ge30pLFxuICAgICAgICBhZHZhbmNlZENhY2hlS2V5ID0gdGhpcy5fYWR2YW5jZWRDYWNoZUtleSB8fCAodGhpcy5fYWR2YW5jZWRDYWNoZUtleSA9IFtdKSxcbiAgICAgICAgY2FjaGVOYW1lID0gdGV4dCArIChzdHlsZS5mb250U2l6ZSB8fCBCTEFOSykgKyAoc3R5bGUuZm9udEZhbWlseSB8fCBCTEFOSykgKyAoc3R5bGUuZm9udFdlaWdodCB8fCBCTEFOSykgK1xuICAgICAgICAgICAoc3R5bGUuZm9udFN0eWxlIHx8IEJMQU5LKSxcbiAgICAgICBjYWNoZUluaXROYW1lID0gdGV4dCArICdpbml0JyArIChzdHlsZS5mb250U2l6ZSB8fCBCTEFOSykgKyAoc3R5bGUuZm9udEZhbWlseSB8fCBCTEFOSykgK1xuICAgICAgICAgICAoc3R5bGUuZm9udFdlaWdodCB8fCBCTEFOSykgKyAoc3R5bGUuZm9udFN0eWxlIHx8IEJMQU5LKTtcblxuICAgIGh0bWxTcGxDaGFyU3BhY2VbdGV4dF0gJiYgKHRleHQgPSBodG1sU3BsQ2hhclNwYWNlW3RleHRdKTtcblxuICAgIGlmICghY2FsY3VsYXRlRGlmZmVyZW5jZSkge1xuICAgICAgICBhc3ltbWV0cmljRGlmZmVyZW5jZSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKChhc3ltbWV0cmljRGlmZmVyZW5jZSA9IGNhY2hlW2NhY2hlSW5pdE5hbWVdKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gdGV4dC5yZXBlYXQgPyB0ZXh0LnJlcGVhdChsZW5ndGgpIDogQXJyYXkobGVuZ3RoICsgMSkuam9pbih0ZXh0KTsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG4gICAgICAgICAgICB0dyA9IGNvbnRhaW5lci5vZmZzZXRXaWR0aDtcblxuICAgICAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9IHRleHQ7XG4gICAgICAgICAgICB0d2kgPSBjb250YWluZXIub2Zmc2V0V2lkdGg7XG5cbiAgICAgICAgICAgIGFzeW1tZXRyaWNEaWZmZXJlbmNlID0gY2FjaGVbY2FjaGVJbml0TmFtZV0gPSAodHcgLSBsZW5ndGggKiB0d2kpIC8gKGxlbmd0aCArIDEpO1xuICAgICAgICAgICAgYWR2YW5jZWRDYWNoZUtleS5wdXNoKGNhY2hlSW5pdE5hbWUpO1xuICAgICAgICAgICAgaWYgKGFkdmFuY2VkQ2FjaGVLZXkubGVuZ3RoID4gbWF4QWR2YW5jZWRDYWNoZUxpbWl0KSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGNhY2hlW2FkdmFuY2VkQ2FjaGVLZXkuc2hpZnQoKV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY2FjaGVkU3R5bGUgPSBjYWNoZVtjYWNoZU5hbWVdKSB7XG4gICAgICAgIGNzQXJyID0gY2FjaGVkU3R5bGUuc3BsaXQoJywnKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdpZHRoOiBwYXJzZUZsb2F0KGNzQXJyWzBdLCAxMCksXG4gICAgICAgICAgICBoZWlnaHQ6IHBhcnNlRmxvYXQoY3NBcnJbMV0sIDEwKVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSB0ZXh0O1xuXG4gICAgc2l6ZSA9IHtcbiAgICAgICAgaGVpZ2h0OiBjb250YWluZXIub2Zmc2V0SGVpZ2h0LFxuICAgICAgICB3aWR0aDogY29udGFpbmVyLm9mZnNldFdpZHRoICsgYXN5bW1ldHJpY0RpZmZlcmVuY2VcbiAgICB9O1xuXG4gICAgY2FjaGVbY2FjaGVOYW1lXSA9IHNpemUud2lkdGggKyAnLCcgKyBzaXplLmhlaWdodDtcbiAgICBhZHZhbmNlZENhY2hlS2V5LnB1c2goY2FjaGVOYW1lKTtcbiAgICBpZiAoYWR2YW5jZWRDYWNoZUtleS5sZW5ndGggPiBtYXhBZHZhbmNlZENhY2hlTGltaXQpIHtcbiAgICAgICAgZGVsZXRlIGNhY2hlW2FkdmFuY2VkQ2FjaGVLZXkuc2hpZnQoKV07XG4gICAgfVxuXG4gICAgcmV0dXJuIHNpemU7XG59O1xuXG4vLyBQcm92aWRlIGZ1bmN0aW9uIHRvIGNhbGN1bGF0ZSB0aGUgaGVpZ2h0IGFuZCB3aWR0aCBiYXNlZCBvbiB0aGUgZW52aXJvbm1lbnQgYW5kIGF2YWlsYWJsZSBzdXBwb3J0IGZyb20gZG9tLlxuU21hcnRMYWJlbE1hbmFnZXIucHJvdG90eXBlLl9nZXRXaWR0aEZuID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBjb250T2JqID0gdGhpcy5fY29udGFpbmVyT2JqLFxuICAgICAgICBjb250YWluZXIgPSB0aGlzLl9jb250YWluZXIsXG4gICAgICAgIHN2Z1RleHQgPSBjb250T2JqLnN2Z1RleHQ7XG5cbiAgICBpZiAoc3ZnVGV4dCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHN0cikge1xuICAgICAgICAgICAgdmFyIGJib3gsXG4gICAgICAgICAgICAgICAgd2lkdGg7XG5cbiAgICAgICAgICAgIHN2Z1RleHQudGV4dENvbnRlbnQgPSBzdHI7XG4gICAgICAgICAgICBiYm94ID0gc3ZnVGV4dC5nZXRCQm94KCk7XG4gICAgICAgICAgICB3aWR0aCA9IChiYm94LndpZHRoIC0gU1ZHX0JCT1hfQ09SUkVDVElPTik7XG4gICAgICAgICAgICBpZiAod2lkdGggPCAxKSB7XG4gICAgICAgICAgICAgICAgd2lkdGggPSBiYm94LndpZHRoO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gd2lkdGg7XG4gICAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSBzdHI7XG4gICAgICAgICAgICByZXR1cm4gY29udGFpbmVyLm9mZnNldFdpZHRoO1xuICAgICAgICB9O1xuICAgIH1cbn07XG5cbi8qXG4gKiBTZXRzIHRoZSBzdHlsZSBiYXNlZCBvbiB3aGljaCB0aGUgdGV4dCdzIG1ldHJpY3MgdG8gYmUgY2FsY3VsYXRlZC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gc3R5bGUgLSBUaGUgc3R5bGUgb2JqZWN0IHdoaWNoIGFmZmVjdHMgdGhlIHRleHQgc2l6ZVxuICogICAgICAgICAgICAgICAgICAgICAge1xuICogICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplIC8gJ2ZvbnQtc2l6ZScgOiBNVVNUIEJFIEZPTExPV0VEIEJZIFBYICgxMHB4LCAxMXB4KVxuICogICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRGYW1pbHkgLyAnZm9udC1mYW1pbHknXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFdlaWdodCAvICdmb250LXdlaWdodCdcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICBmb250U3R5bGUgLyAnZm9udC1zdHlsZSdcbiAqICAgICAgICAgICAgICAgICAgICAgIH1cbiAqXG4gKiBAcmV0dXJuIHtTbWFydExhYmVsTWFuYWdlcn0gLSBDdXJyZW50IGluc3RhbmNlIG9mIFNtYXJ0TGFiZWxNYW5hZ2VyXG4gKi9cblNtYXJ0TGFiZWxNYW5hZ2VyLnByb3RvdHlwZS5zZXRTdHlsZSA9IGZ1bmN0aW9uIChzdHlsZSkge1xuICAgIGlmICghdGhpcy5faW5pdCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICB2YXIgc0NvbnQ7XG5cbiAgICBpZiAoc3R5bGUgPT09IHRoaXMuc3R5bGUgJiYgIXRoaXMuX3N0eWxlTm90U2V0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXN0eWxlKSB7XG4gICAgICAgIHN0eWxlID0gdGhpcy5zdHlsZTtcbiAgICB9XG5cbiAgICBzbExpYi5zZXRMaW5lSGVpZ2h0KHN0eWxlKTtcbiAgICB0aGlzLnN0eWxlID0gc3R5bGU7XG5cbiAgICB0aGlzLl9jb250YWluZXJPYmogPSBzQ29udCA9IHRoaXMuX2NvbnRhaW5lck1hbmFnZXIuZ2V0KHN0eWxlKTtcblxuICAgIGlmICh0aGlzLl9jb250YWluZXJPYmopIHtcbiAgICAgICAgdGhpcy5fY29udGFpbmVyID0gc0NvbnQubm9kZTtcbiAgICAgICAgdGhpcy5fY29udGV4dCA9IHNDb250LmNvbnRleHQ7XG4gICAgICAgIHRoaXMuX2NhY2hlID0gc0NvbnQuY2hhckNhY2hlO1xuICAgICAgICB0aGlzLl9saW5lSGVpZ2h0ID0gc0NvbnQubGluZUhlaWdodDtcbiAgICAgICAgdGhpcy5fc3R5bGVOb3RTZXQgPSBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9zdHlsZU5vdFNldCA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKlxuICogRGVjaWRlcyB3aGV0aGVyIGVsbGlwc2VzIHRvIGJlIHNob3duIGlmIHRoZSBub2RlIGlzIHRydW5jYXRlZFxuICpcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gdXNlRWxsaXBzZXMgLSBkZWNpZGVzIGlmIGEgZWxsaXBzZXMgdG8gYmUgYXBwZW5kZWQgaWYgdGhlIHRleHQgaXMgdHJ1bmNhdGVkLiBEZWZhdWx0OiBmYWxzZVxuICpcbiAqIEByZXR1cm4ge1NtYXJ0TGFiZWxNYW5hZ2VyfSAtIEN1cnJlbnQgaW5zdGFuY2Ugb2YgU21hcnRMYWJlbE1hbmFnZXJcbiAqL1xuU21hcnRMYWJlbE1hbmFnZXIucHJvdG90eXBlLnVzZUVsbGlwc2VzT25PdmVyZmxvdyA9IGZ1bmN0aW9uICh1c2VFbGxpcHNlcykge1xuICAgIGlmICghdGhpcy5faW5pdCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgdGhpcy5fc2hvd05vRWxsaXBzZXMgPSAhdXNlRWxsaXBzZXM7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKlxuICogR2V0IHdyYXBwZWQgb3IgdHJ1bmNhdGVkIHRleHQgaWYgYSBib3VuZCBib3ggaXMgZGVmaW5lZCBhcm91bmQgaXQuIFRoZSByZXN1bHQgdGV4dCB3b3VsZCBiZSBzZXBhcmF0ZWQgYnkgPGJyLz5cbiAqIGlmIHdyYXBwZWRcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdGV4dCAtIHRoZSBzdWJqZWN0IHRleHRcbiAqIEBwYXJhbSB7TnVtYmVyfSBtYXhXaWR0aCAtIHdpZHRoIGluIHB4IG9mIHRoZSB0aGUgYm91bmQgYm94XG4gKiBAcGFyYW0ge051bWJlcn0gbWF4SGVpZ2h0IC0gaGVpZ2h0IGluIHB4IG9mIHRoZSB0aGUgYm91bmQgYm94XG4gKiBAcGFyYW0ge0Jvb2xlYW59IG5vV3JhcCAtIHdoZXRoZXIgdGhlIHRleHQgdG8gYmUgd3JhcHBlZC4gRGVmYXVsdCBmYWxzZS5cbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IC0gVGhlIG1ldHJpY3Mgb2YgdGhlIHRleHQgYm91bmRlZCBieSB0aGUgYm94XG4gKiAgICAgICAgICAgICAgICAgIHtcbiAqICAgICAgICAgICAgICAgICAgICAgIGhlaWdodCA6IGhlaWdodCBvZiB0aGUgd3JhcHBlZCB0ZXh0XG4gKiAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IHdpZHRoIG9mIHRoZSB3cmFwcGVkIHRleHRcbiAqICAgICAgICAgICAgICAgICAgICAgIGlzVHJ1bmNhdGVkIDogd2hldGhlciB0aGUgdGV4dCBpcyB0cnVuY2F0ZWRcbiAqICAgICAgICAgICAgICAgICAgICAgIG1heEhlaWdodCA6IE1heGltdW0gaGVpZ2h0IGdpdmVuXG4gKiAgICAgICAgICAgICAgICAgICAgICBtYXhXaWR0aCA6IE1heGltdW0gd2lkdGggZ2l2ZW5cbiAqICAgICAgICAgICAgICAgICAgICAgIG9yaVRleHQgOiBPcmlnaW5hbCB0ZXh0IHNlbnRcbiAqICAgICAgICAgICAgICAgICAgICAgIG9yaVRleHRIZWlnaHQgOiBPcmlnaW5hbCB0ZXh0IGhlaWdodFxuICogICAgICAgICAgICAgICAgICAgICAgb3JpVGV4dFdpZHRoIDogT3JpZ2luYWwgdGV4dCB3aWR0aFxuICogICAgICAgICAgICAgICAgICAgICAgdGV4dCA6IFNNQVJUIFRFWFRcbiAqICAgICAgICAgICAgICAgICAgfVxuICovXG5TbWFydExhYmVsTWFuYWdlci5wcm90b3R5cGUuZ2V0U21hcnRUZXh0ID0gZnVuY3Rpb24gKHRleHQsIG1heFdpZHRoLCBtYXhIZWlnaHQsIG5vV3JhcCkge1xuICAgIGlmICghdGhpcy5faW5pdCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHRleHQgPT09IHVuZGVmaW5lZCB8fCB0ZXh0ID09PSBudWxsKSB7XG4gICAgICAgIHRleHQgPSAnJztcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB0ZXh0ICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0ZXh0ID0gdGV4dC50b1N0cmluZygpO1xuICAgIH1cblxuICAgIHZhciBsZW4sXG4gICAgICAgIHRyaW1TdHIsXG4gICAgICAgIHRlbXBBcnIsXG4gICAgICAgIHRtcFRleHQsXG4gICAgICAgIG1heFdpZHRoV2l0aEVsbCxcbiAgICAgICAgdG9vbFRleHQsXG4gICAgICAgIG9yaVdpZHRoLFxuICAgICAgICBvcmlIZWlnaHQsXG4gICAgICAgIG5ld0NoYXJJbmRleCxcbiAgICAgICAgbmVhcmVzdENoYXIsXG4gICAgICAgIHRlbXBDaGFyLFxuICAgICAgICBnZXRXaWR0aCxcbiAgICAgICAgaW5pdGlhbExlZnQsXG4gICAgICAgIGluaXRpYWxUb3AsXG4gICAgICAgIGdldE9yaVNpemVJbXByb3ZlT2JqLFxuICAgICAgICBzcGFuQXJyLFxuICAgICAgICB4LFxuICAgICAgICB5LFxuICAgICAgICBtaW5XaWR0aCxcbiAgICAgICAgZWxlbSxcbiAgICAgICAgY2hyLFxuICAgICAgICBlbGVtUmlnaHRNb3N0UG9pbnQsXG4gICAgICAgIGVsZW1Mb3dlc3RQb2ludCxcbiAgICAgICAgbGFzdEJSLFxuICAgICAgICByZW1vdmVGcm9tSW5kZXgsXG4gICAgICAgIHJlbW92ZUZyb21JbmRleEZvckVsbGlwc2VzLFxuICAgICAgICBoYXNIVE1MVGFnID0gZmFsc2UsXG4gICAgICAgIG1heFN0cldpZHRoID0gMCxcbiAgICAgICAgbGFzdERhc2ggPSAtMSxcbiAgICAgICAgbGFzdFNwYWNlID0gLTEsXG4gICAgICAgIGxhc3RJbmRleEJyb2tlbiA9IC0xLFxuICAgICAgICBzdHJXaWR0aCA9IDAsXG4gICAgICAgIHN0ckhlaWdodCA9IDAsXG4gICAgICAgIG9yaVRleHRBcnIgPSBbXSxcbiAgICAgICAgaSA9IDAsXG4gICAgICAgIGVsbGlwc2VzU3RyID0gKHRoaXMuX3Nob3dOb0VsbGlwc2VzID8gJycgOiAnLi4uJyksXG4gICAgICAgIGxpbmVIZWlnaHQgPSB0aGlzLl9saW5lSGVpZ2h0LFxuICAgICAgICBjb250ZXh0ID0gdGhpcy5fY29udGV4dCxcbiAgICAgICAgY29udGFpbmVyID0gdGhpcy5fY29udGFpbmVyLFxuICAgICAgICBzQ29udCA9IHRoaXMuX2NvbnRhaW5lck9iaixcbiAgICAgICAgZWxsaXBzZXNXaWR0aCA9IHNDb250LmVsbGlwc2VzV2lkdGgsXG4gICAgICAgIGRvdFdpZHRoID0gIHNDb250LmRvdFdpZHRoLFxuICAgICAgICBjaGFyYWN0ZXJBcnIgPSBbXSxcbiAgICAgICAgZGFzaEluZGV4ID0gLTEsXG4gICAgICAgIHNwYWNlSW5kZXggPSAtMSxcbiAgICAgICAgbGFzdExpbmVCcmVhayA9IC0xLFxuICAgICAgICBmYXN0VHJpbSA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9eXFxzXFxzKi8sICcnKTtcbiAgICAgICAgICAgIHZhciB3cyA9IC9cXHMvLCBpID0gc3RyLmxlbmd0aDtcbiAgICAgICAgICAgIHdoaWxlICh3cy50ZXN0KHN0ci5jaGFyQXQoaSAtPSAxKSkpIHsgLyoganNoaW50IG5vZW1wdHk6ZmFsc2UgKi8gfVxuICAgICAgICAgICAgcmV0dXJuIHN0ci5zbGljZSgwLCBpICsgMSk7XG4gICAgICAgIH0sXG4gICAgICAgIHNtYXJ0TGFiZWwgPSB7XG4gICAgICAgICAgICB0ZXh0IDogdGV4dCxcbiAgICAgICAgICAgIG1heFdpZHRoIDogbWF4V2lkdGgsXG4gICAgICAgICAgICBtYXhIZWlnaHQgOiBtYXhIZWlnaHQsXG4gICAgICAgICAgICB3aWR0aCA6IG51bGwsXG4gICAgICAgICAgICBoZWlnaHQgOiBudWxsLFxuICAgICAgICAgICAgb3JpVGV4dFdpZHRoIDogbnVsbCxcbiAgICAgICAgICAgIG9yaVRleHRIZWlnaHQgOiBudWxsLFxuICAgICAgICAgICAgb3JpVGV4dCA6IHRleHQsXG4gICAgICAgICAgICBpc1RydW5jYXRlZCA6IGZhbHNlXG4gICAgICAgIH07XG5cbiAgICBnZXRXaWR0aCA9IHRoaXMuX2dldFdpZHRoRm4oKTtcblxuICAgIC8vIEluIHNvbWUgYnJvd3NlcnMsIG9mZnNldGhlaWdodCBvZiBhIHNpbmdsZS1saW5lIHRleHQgaXMgZ2V0dGluZyBsaXR0bGUgKDEgcHgpIGhlaWdoZXIgdmFsdWUgb2YgdGhlXG4gICAgLy8gbGluZWhlaWdodC4gQXMgYSByZXN1bHQsIHNtYXJ0TGFiZWwgaXMgdW5hYmxlIHRvIHJldHVybiBzaW5nbGUtbGluZSB0ZXh0LlxuICAgIC8vIFRvIGZpeCB0aGlzLCBpbmNyZWFzZSB0aGUgbWF4SGVpZ2h0IGEgbGl0dGxlIGFtb3VudC4gSGVuY2UgbWF4SGVpZ2h0ID0gIGxpbmVIZWlnaHQgKiAxLjJcbiAgICBpZiAobWF4SGVpZ2h0ID09PSBsaW5lSGVpZ2h0KSB7XG4gICAgICAgIG1heEhlaWdodCAqPSAxLjI7XG4gICAgfVxuXG5cbiAgICBpZiAoY29udGFpbmVyKSB7XG4gICAgICAgIGlmICghZG9jdW1lbnRTdXBwb3J0LmlzQnJvd3Nlckxlc3MpIHtcbiAgICAgICAgICAgIGhhc0hUTUxUYWcgPSBzbExpYi54bWxUYWdSZWdFeC50ZXN0KHRleHQpO1xuICAgICAgICAgICAgaWYgKCFoYXNIVE1MVGFnKSB7XG4gICAgICAgICAgICAgICAgLy8gRHVlIHRvIHN1cHBvcnQgb2YgPCw+IGZvciB4bWwgd2UgY29udmVydCAmbHQ7LCAmZ3Q7IHRvIDwsPiByZXNwZWN0aXZlbHkgc28gdG8gZ2V0IHRoZSBjb3JyZWN0XG4gICAgICAgICAgICAgICAgLy8gd2lkdGggaXQgaXMgcmVxdWlyZWQgdG8gY29udmVydCB0aGUgc2FtZSBiZWZvcmUgY2FsY3VsYXRpb24gZm9yIHRoZSBuZXcgaW1wcm92ZSB2ZXJzaW9uIG9mIHRoZVxuICAgICAgICAgICAgICAgIC8vIGdldCB0ZXh0IHdpZHRoLlxuICAgICAgICAgICAgICAgIHRtcFRleHQgPSB0ZXh0LnJlcGxhY2Uoc2xMaWIubHRndFJlZ2V4LCBmdW5jdGlvbiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoID09PSAnJmx0OycgPyAnPCcgOiAnPic7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZ2V0T3JpU2l6ZUltcHJvdmVPYmogPSB0aGlzLmdldE9yaVNpemUodG1wVGV4dCwgdHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICBzbWFydExhYmVsLm9yaVRleHRXaWR0aCA9IG9yaVdpZHRoID0gZ2V0T3JpU2l6ZUltcHJvdmVPYmoud2lkdGg7XG4gICAgICAgICAgICAgICAgc21hcnRMYWJlbC5vcmlUZXh0SGVpZ2h0ID0gb3JpSGVpZ2h0ID0gZ2V0T3JpU2l6ZUltcHJvdmVPYmouaGVpZ2h0O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gdGV4dDtcbiAgICAgICAgICAgICAgICBzbWFydExhYmVsLm9yaVRleHRXaWR0aCA9IG9yaVdpZHRoID0gY29udGFpbmVyLm9mZnNldFdpZHRoO1xuICAgICAgICAgICAgICAgIHNtYXJ0TGFiZWwub3JpVGV4dEhlaWdodCA9IG9yaUhlaWdodCA9IGNvbnRhaW5lci5vZmZzZXRIZWlnaHQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChvcmlIZWlnaHQgPD0gbWF4SGVpZ2h0ICYmIG9yaVdpZHRoIDw9IG1heFdpZHRoKSB7XG4gICAgICAgICAgICAgICAgc21hcnRMYWJlbC53aWR0aCA9IHNtYXJ0TGFiZWwub3JpVGV4dFdpZHRoID0gb3JpV2lkdGg7XG4gICAgICAgICAgICAgICAgc21hcnRMYWJlbC5oZWlnaHQgPSBzbWFydExhYmVsLm9yaVRleHRIZWlnaHQgPSBvcmlIZWlnaHQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNtYXJ0TGFiZWw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChsaW5lSGVpZ2h0ID4gbWF4SGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgc21hcnRMYWJlbC50ZXh0ID0gJyc7XG4gICAgICAgICAgICAgICAgc21hcnRMYWJlbC53aWR0aCA9IHNtYXJ0TGFiZWwub3JpVGV4dFdpZHRoID0gMDtcbiAgICAgICAgICAgICAgICBzbWFydExhYmVsLmhlaWdodCA9IHNtYXJ0TGFiZWwub3JpVGV4dEhlaWdodCA9IDA7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNtYXJ0TGFiZWw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYWxjdWxhdGUgd2lkdGggd2l0aCBlbGxpcHNlc1xuICAgICAgICB0ZXh0ID0gZmFzdFRyaW0odGV4dCkucmVwbGFjZSgvKFxccyspL2csICcgJyk7XG4gICAgICAgIG1heFdpZHRoV2l0aEVsbCA9IHRoaXMuX3Nob3dOb0VsbGlwc2VzID8gbWF4V2lkdGggOiAobWF4V2lkdGggLSBlbGxpcHNlc1dpZHRoKTtcblxuICAgICAgICBpZiAoIWhhc0hUTUxUYWcpIHtcbiAgICAgICAgICAgIG9yaVRleHRBcnIgPSB0ZXh0LnNwbGl0KCcnKTtcbiAgICAgICAgICAgIGxlbiA9IG9yaVRleHRBcnIubGVuZ3RoO1xuICAgICAgICAgICAgdHJpbVN0ciA9ICcnLCB0ZW1wQXJyID0gW107XG4gICAgICAgICAgICB0ZW1wQ2hhciA9IG9yaVRleHRBcnJbMF07XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9jYWNoZVt0ZW1wQ2hhcl0pIHtcbiAgICAgICAgICAgICAgICBtaW5XaWR0aCA9IHRoaXMuX2NhY2hlW3RlbXBDaGFyXS53aWR0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG1pbldpZHRoID0gZ2V0V2lkdGgodGVtcENoYXIpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2NhY2hlW3RlbXBDaGFyXSA9IHsgd2lkdGg6IG1pbldpZHRoIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChtYXhXaWR0aFdpdGhFbGwgPiBtaW5XaWR0aCkge1xuICAgICAgICAgICAgICAgIHRlbXBBcnIgPSB0ZXh0LnN1YnN0cigwLCBzbExpYi5nZXROZWFyZXN0QnJlYWtJbmRleCh0ZXh0LCBtYXhXaWR0aFdpdGhFbGwsIHRoaXMpKS5zcGxpdCgnJyk7XG4gICAgICAgICAgICAgICAgaSA9IHRlbXBBcnIubGVuZ3RoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobWluV2lkdGggPiBtYXhXaWR0aCkge1xuICAgICAgICAgICAgICAgIHNtYXJ0TGFiZWwudGV4dCA9ICcnO1xuICAgICAgICAgICAgICAgIHNtYXJ0TGFiZWwud2lkdGggPSBzbWFydExhYmVsLm9yaVRleHRXaWR0aCA9XG4gICAgICAgICAgICAgICAgICAgIHNtYXJ0TGFiZWwuaGVpZ2h0ID0gc21hcnRMYWJlbC5vcmlUZXh0SGVpZ2h0ID0gMDtcbiAgICAgICAgICAgICAgICByZXR1cm4gc21hcnRMYWJlbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGVsbGlwc2VzU3RyKSB7XG4gICAgICAgICAgICAgICAgbWF4V2lkdGhXaXRoRWxsID0gbWF4V2lkdGggLSAoMiAqIGRvdFdpZHRoKTtcbiAgICAgICAgICAgICAgICBpZiAobWF4V2lkdGhXaXRoRWxsID4gbWluV2lkdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxsaXBzZXNTdHIgPSAnLi4nO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG1heFdpZHRoV2l0aEVsbCA9IG1heFdpZHRoIC0gZG90V2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXhXaWR0aFdpdGhFbGwgPiBtaW5XaWR0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxsaXBzZXNTdHIgPSAnLic7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhXaWR0aFdpdGhFbGwgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxsaXBzZXNTdHIgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3RyV2lkdGggPSBnZXRXaWR0aCh0ZW1wQXJyLmpvaW4oJycpKTtcbiAgICAgICAgICAgIHN0ckhlaWdodCA9IHRoaXMuX2xpbmVIZWlnaHQ7XG5cbiAgICAgICAgICAgIGlmIChub1dyYXApIHtcbiAgICAgICAgICAgICAgICBmb3IgKDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBDaGFyID0gdGVtcEFycltpXSA9IG9yaVRleHRBcnJbaV07XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9jYWNoZVt0ZW1wQ2hhcl0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbldpZHRoID0gdGhpcy5fY2FjaGVbdGVtcENoYXJdLndpZHRoO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFnZXRPcmlTaXplSW1wcm92ZU9iaiB8fCAhKG1pbldpZHRoID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlTaXplSW1wcm92ZU9iai5kZXRhaWxPYmpbdGVtcENoYXJdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbldpZHRoID0gZ2V0V2lkdGgodGVtcENoYXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2FjaGVbdGVtcENoYXJdID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiBtaW5XaWR0aFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzdHJXaWR0aCArPSBtaW5XaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0cldpZHRoID4gbWF4V2lkdGhXaXRoRWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRyaW1TdHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmltU3RyID0gdGVtcEFyci5zbGljZSgwLCAtMSkuam9pbignJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RyV2lkdGggPiBtYXhXaWR0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNtYXJ0TGFiZWwudGV4dCA9IGZhc3RUcmltKHRyaW1TdHIpICsgZWxsaXBzZXNTdHI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc21hcnRMYWJlbC50b29sdGV4dCA9IHNtYXJ0TGFiZWwub3JpVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzbWFydExhYmVsLndpZHRoID0gZ2V0V2lkdGgoc21hcnRMYWJlbC50ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzbWFydExhYmVsLmhlaWdodCA9IHRoaXMuX2xpbmVIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNtYXJ0TGFiZWw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzbWFydExhYmVsLnRleHQgPSB0ZW1wQXJyLmpvaW4oJycpO1xuICAgICAgICAgICAgICAgIHNtYXJ0TGFiZWwud2lkdGggPSBzdHJXaWR0aDtcbiAgICAgICAgICAgICAgICBzbWFydExhYmVsLmhlaWdodCA9IHRoaXMuX2xpbmVIZWlnaHQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNtYXJ0TGFiZWw7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yICg7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICB0ZW1wQ2hhciA9IHRlbXBBcnJbaV0gPSBvcmlUZXh0QXJyW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGVtcENoYXIgPT09ICcgJyAmJiAhY29udGV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcENoYXIgPSAnJm5ic3A7JztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9jYWNoZVt0ZW1wQ2hhcl0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbldpZHRoID0gdGhpcy5fY2FjaGVbdGVtcENoYXJdLndpZHRoO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFnZXRPcmlTaXplSW1wcm92ZU9iaiB8fCAhKG1pbldpZHRoID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlTaXplSW1wcm92ZU9iai5kZXRhaWxPYmpbdGVtcENoYXJdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbldpZHRoID0gZ2V0V2lkdGgodGVtcENoYXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2FjaGVbdGVtcENoYXJdID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiBtaW5XaWR0aFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzdHJXaWR0aCArPSBtaW5XaWR0aDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoc3RyV2lkdGggPiBtYXhXaWR0aFdpdGhFbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdHJpbVN0cikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyaW1TdHIgPSB0ZW1wQXJyLnNsaWNlKDAsIC0xKS5qb2luKCcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdHJXaWR0aCA+IG1heFdpZHRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyoqIEB0b2RvIHVzZSByZWd1bGFyIGV4cHJlc3Npb25zIGZvciBiZXR0ZXIgcGVyZm9ybWFuY2UuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFNwYWNlID0gdGV4dC5zdWJzdHIoMCwgdGVtcEFyci5sZW5ndGgpLmxhc3RJbmRleE9mKCcgJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdERhc2ggPSB0ZXh0LnN1YnN0cigwLCB0ZW1wQXJyLmxlbmd0aCkubGFzdEluZGV4T2YoJy0nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobGFzdFNwYWNlID4gbGFzdEluZGV4QnJva2VuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cldpZHRoID0gZ2V0V2lkdGgodGVtcEFyci5zbGljZShsYXN0SW5kZXhCcm9rZW4gKyAxLCBsYXN0U3BhY2UpLmpvaW4oJycpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcEFyci5zcGxpY2UobGFzdFNwYWNlLCAxLCAnPGJyLz4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdEluZGV4QnJva2VuID0gbGFzdFNwYWNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdDaGFySW5kZXggPSBsYXN0U3BhY2UgKyAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobGFzdERhc2ggPiBsYXN0SW5kZXhCcm9rZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3REYXNoID09PSB0ZW1wQXJyLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cldpZHRoID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRXaWR0aCh0ZW1wQXJyLnNsaWNlKGxhc3RJbmRleEJyb2tlbiArIDEsIGxhc3RTcGFjZSkuam9pbignJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcEFyci5zcGxpY2UobGFzdERhc2gsIDEsICc8YnIvPi0nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cldpZHRoID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRXaWR0aCh0ZW1wQXJyLnNsaWNlKGxhc3RJbmRleEJyb2tlbiArIDEsIGxhc3RTcGFjZSkuam9pbignJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcEFyci5zcGxpY2UobGFzdERhc2gsIDEsICctPGJyLz4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0SW5kZXhCcm9rZW4gPSBsYXN0RGFzaDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q2hhckluZGV4ID0gbGFzdERhc2ggKyAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBBcnIuc3BsaWNlKCh0ZW1wQXJyLmxlbmd0aCAtIDEpLCAxLCAnPGJyLz4nICsgb3JpVGV4dEFycltpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RMaW5lQnJlYWsgPSB0ZW1wQXJyLmxlbmd0aCAtIDI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cldpZHRoID0gZ2V0V2lkdGgodGVtcEFyci5zbGljZShsYXN0SW5kZXhCcm9rZW4gKyAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdExpbmVCcmVhayArIDEpLmpvaW4oJycpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdEluZGV4QnJva2VuID0gbGFzdExpbmVCcmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q2hhckluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RySGVpZ2h0ICs9IHRoaXMuX2xpbmVIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0ckhlaWdodCA+IG1heEhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzbWFydExhYmVsLnRleHQgPSBmYXN0VHJpbSh0cmltU3RyKSArIGVsbGlwc2VzU3RyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzbWFydExhYmVsLnRvb2x0ZXh0ID0gc21hcnRMYWJlbC5vcmlUZXh0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgbWF4IHdpZHRoIGFtb25nIGFsbCB0aGUgbGluZXMgd2lsbCBiZSB0aGUgd2lkdGggb2YgdGhlIHN0cmluZy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc21hcnRMYWJlbC53aWR0aCA9IG1heFdpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzbWFydExhYmVsLmhlaWdodCA9IChzdHJIZWlnaHQgLSB0aGlzLl9saW5lSGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNtYXJ0TGFiZWw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4U3RyV2lkdGggPSBtYXgobWF4U3RyV2lkdGgsIHN0cldpZHRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJpbVN0ciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5lYXJlc3RDaGFyID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNsTGliLmdldE5lYXJlc3RCcmVha0luZGV4KHRleHQuc3Vic3RyKG5ld0NoYXJJbmRleCksIG1heFdpZHRoV2l0aEVsbCwgdGhpcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cldpZHRoID0gZ2V0V2lkdGgodGV4dC5zdWJzdHIobmV3Q2hhckluZGV4LCBuZWFyZXN0Q2hhciB8fCAxKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0ZW1wQXJyLmxlbmd0aCA8IG5ld0NoYXJJbmRleCArIG5lYXJlc3RDaGFyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wQXJyID0gdGVtcEFyci5jb25jYXQoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dC5zdWJzdHIoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBBcnIubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdDaGFySW5kZXggKyBuZWFyZXN0Q2hhciAtIHRlbXBBcnIubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKS5zcGxpdCgnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpID0gdGVtcEFyci5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbWF4U3RyV2lkdGggPSBtYXgobWF4U3RyV2lkdGgsIHN0cldpZHRoKTtcblxuICAgICAgICAgICAgICAgIHNtYXJ0TGFiZWwudGV4dCA9IHRlbXBBcnIuam9pbignJyk7XG4gICAgICAgICAgICAgICAgc21hcnRMYWJlbC53aWR0aCA9IG1heFN0cldpZHRoO1xuICAgICAgICAgICAgICAgIHNtYXJ0TGFiZWwuaGVpZ2h0ID0gc3RySGVpZ2h0O1xuICAgICAgICAgICAgICAgIHJldHVybiBzbWFydExhYmVsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdG9vbFRleHQgPSB0ZXh0LnJlcGxhY2Uoc2xMaWIuc3BhbkFkZGl0aW9uUmVneCwgJyQyJyk7XG4gICAgICAgICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKHNsTGliLnNwYW5BZGRpdGlvblJlZ3gsIHNsTGliLnNwYW5BZGRpdGlvblJlcGxhY2VyKTtcbiAgICAgICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoXG4gICAgICAgICAgICAgICAgLyg8YnJcXHMqXFwvKlxcPikvZyxcbiAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCInICsgW3NsTGliLmNsYXNzTmFtZVdpdGhUYWcsICcgJywgc2xMaWIuY2xhc3NOYW1lV2l0aFRhZ0JSXS5qb2luKCcnKSArICdcIj4kMTwvc3Bhbj4nXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gdGV4dDtcblxuICAgICAgICAgICAgc3BhbkFyciA9IGNvbnRhaW5lcltkb2N1bWVudFN1cHBvcnQuY2hpbGRSZXRyaXZlckZuXShkb2N1bWVudFN1cHBvcnQuY2hpbGRSZXRyaXZlclN0cmluZyk7XG5cbiAgICAgICAgICAgIGZvciAoeCA9IDAsIHkgPSBzcGFuQXJyLmxlbmd0aDsgeCA8IHk7IHggKz0gMSkge1xuICAgICAgICAgICAgICAgIGVsZW0gPSBzcGFuQXJyW3hdO1xuICAgICAgICAgICAgICAgIC8vY2hlY2ggd2hldGhlciB0aGlzIHNwYW4gaXMgdGVtcG9yYXJ5IGluc2VydGVkIHNwYW4gZnJvbSBpdCdzIGNsYXNzXG4gICAgICAgICAgICAgICAgaWYgKGRvY3VtZW50U3VwcG9ydC5ub0NsYXNzVGVzdGluZyB8fCBzbExpYi5jbGFzc05hbWVSZWcudGVzdChlbGVtLmNsYXNzTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hyID0gZWxlbS5pbm5lckhUTUw7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaHIgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2hyID09PSAnICcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcGFjZUluZGV4ID0gY2hhcmFjdGVyQXJyLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIGNociA9PT0gJy0nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGFzaEluZGV4ID0gY2hhcmFjdGVyQXJyLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgY2hhcmFjdGVyQXJyLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwYWNlSWR4OiBzcGFjZUluZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhc2hJZHg6IGRhc2hJbmRleCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtOiBlbGVtXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9yaVRleHRBcnIucHVzaChjaHIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpID0gMDtcbiAgICAgICAgICAgIGxlbiA9IGNoYXJhY3RlckFyci5sZW5ndGg7XG4gICAgICAgICAgICBtaW5XaWR0aCA9IGNoYXJhY3RlckFyclswXS5lbGVtLm9mZnNldFdpZHRoO1xuXG4gICAgICAgICAgICBpZiAobWluV2lkdGggPiBtYXhXaWR0aCkge1xuICAgICAgICAgICAgICAgIHNtYXJ0TGFiZWwudGV4dCA9ICcnO1xuICAgICAgICAgICAgICAgIHNtYXJ0TGFiZWwud2lkdGggPSBzbWFydExhYmVsLm9yaVRleHRXaWR0aCA9IHNtYXJ0TGFiZWwuaGVpZ2h0ID0gc21hcnRMYWJlbC5vcmlUZXh0SGVpZ2h0ID0gMDtcblxuICAgICAgICAgICAgICAgIHJldHVybiBzbWFydExhYmVsO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChtaW5XaWR0aCA+IG1heFdpZHRoV2l0aEVsbCAmJiAhdGhpcy5fc2hvd05vRWxsaXBzZXMpIHtcblxuICAgICAgICAgICAgICAgIG1heFdpZHRoV2l0aEVsbCA9IG1heFdpZHRoIC0gKDIgKiBkb3RXaWR0aCk7XG4gICAgICAgICAgICAgICAgaWYgKG1heFdpZHRoV2l0aEVsbCA+IG1pbldpZHRoKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsbGlwc2VzU3RyID0gJy4uJztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtYXhXaWR0aFdpdGhFbGwgPSBtYXhXaWR0aCAtIGRvdFdpZHRoO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWF4V2lkdGhXaXRoRWxsID4gbWluV2lkdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsbGlwc2VzU3RyID0gJy4nO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGhXaXRoRWxsID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsbGlwc2VzU3RyID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGluaXRpYWxMZWZ0ID0gY2hhcmFjdGVyQXJyWzBdLmVsZW0ub2Zmc2V0TGVmdDtcbiAgICAgICAgICAgIGluaXRpYWxUb3AgPSBjaGFyYWN0ZXJBcnJbMF0uZWxlbS5vZmZzZXRUb3A7XG5cbiAgICAgICAgICAgIGlmIChub1dyYXApIHtcbiAgICAgICAgICAgICAgICBmb3IgKDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0gPSBjaGFyYWN0ZXJBcnJbaV0uZWxlbTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbVJpZ2h0TW9zdFBvaW50ID0gKGVsZW0ub2Zmc2V0TGVmdCAtIGluaXRpYWxMZWZ0KSArIGVsZW0ub2Zmc2V0V2lkdGg7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1SaWdodE1vc3RQb2ludCA+IG1heFdpZHRoV2l0aEVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZW1vdmVGcm9tSW5kZXhGb3JFbGxpcHNlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUZyb21JbmRleEZvckVsbGlwc2VzID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb250YWluZXIub2Zmc2V0V2lkdGggPiBtYXhXaWR0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUZyb21JbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaSA9IGxlbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yICg7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtID0gY2hhcmFjdGVyQXJyW2ldLmVsZW07XG4gICAgICAgICAgICAgICAgICAgIGVsZW1Mb3dlc3RQb2ludCA9IGVsZW0ub2Zmc2V0SGVpZ2h0ICsgKGVsZW0ub2Zmc2V0VG9wIC0gaW5pdGlhbFRvcCk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1SaWdodE1vc3RQb2ludCA9IChlbGVtLm9mZnNldExlZnQgLSBpbml0aWFsTGVmdCkgKyBlbGVtLm9mZnNldFdpZHRoO1xuXG4gICAgICAgICAgICAgICAgICAgIGxhc3RCUiA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1SaWdodE1vc3RQb2ludCA+IG1heFdpZHRoV2l0aEVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZW1vdmVGcm9tSW5kZXhGb3JFbGxpcHNlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUZyb21JbmRleEZvckVsbGlwc2VzID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1SaWdodE1vc3RQb2ludCA+IG1heFdpZHRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFNwYWNlID0gY2hhcmFjdGVyQXJyW2ldLnNwYWNlSWR4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3REYXNoID0gY2hhcmFjdGVyQXJyW2ldLmRhc2hJZHg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RTcGFjZSA+IGxhc3RJbmRleEJyb2tlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFyYWN0ZXJBcnJbbGFzdFNwYWNlXS5lbGVtLmlubmVySFRNTCA9ICc8YnIvPic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RJbmRleEJyb2tlbiA9IGxhc3RTcGFjZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxhc3REYXNoID4gbGFzdEluZGV4QnJva2VuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYXN0RGFzaCA9PT0gaSkgeyAvLyBpbiBjYXNlIHRoZSBvdmVyZmxvd2luZyBjaGFyYWN0ZXIgaXRzZWxmIGlzIHRoZSAnLSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYXJhY3RlckFycltsYXN0RGFzaF0uZWxlbS5pbm5lckhUTUwgPSAnPGJyLz4tJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYXJhY3RlckFycltsYXN0RGFzaF0uZWxlbS5pbm5lckhUTUwgPSAnLTxici8+JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0SW5kZXhCcm9rZW4gPSBsYXN0RGFzaDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGxhc3RCUiA9IGRvYy5jcmVhdGVFbGVtZW50KCdicicpLCBlbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NoZWNrIHdoZXRoZXIgdGhpcyBicmVhayBtYWRlIGN1cnJlbnQgZWxlbWVudCBvdXRzaWRlIHRoZSBhcmVhIGhlaWdodFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoZWxlbS5vZmZzZXRIZWlnaHQgKyBlbGVtLm9mZnNldFRvcCkgPiBtYXhIZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9yZW1vdmUgdGhlIGxhc3RseSBpbnNlcnRlZCBsaW5lIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYXN0QlIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RCUi5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGxhc3RCUik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobGFzdEluZGV4QnJva2VuID09PSBsYXN0RGFzaCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhcmFjdGVyQXJyW2xhc3REYXNoXS5lbGVtLmlubmVySFRNTCA9ICctJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYXJhY3RlckFycltsYXN0U3BhY2VdLmVsZW0uaW5uZXJIVE1MID0gJyAnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUZyb21JbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vYnJlYWsgdGhlIGxvb3BpbmcgY29uZGl0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGkgPSBsZW47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlRnJvbUluZGV4Rm9yRWxsaXBzZXMgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9jaGVjayB3aGV0aGVyIHRoaXMgYnJlYWsgbWFkZSBjdXJyZW50IGVsZW1lbnQgb3V0c2lkZSB0aGUgYXJlYSBoZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbGVtTG93ZXN0UG9pbnQgPiBtYXhIZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVGcm9tSW5kZXggPSBpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGkgPSBsZW47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyZW1vdmVGcm9tSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgICAgICAvL3NldCB0aGUgdHJhbmNhdGVkIHByb3BlcnR5IG9mIHRoZSBzbWFydGxhYmVsXG4gICAgICAgICAgICAgICAgc21hcnRMYWJlbC5pc1RydW5jYXRlZCA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAvKiogQHRvZG8gaXMgdGhpcyByZWFsbHkgbmVlZGVkPyAqL1xuICAgICAgICAgICAgICAgIHJlbW92ZUZyb21JbmRleEZvckVsbGlwc2VzID0gcmVtb3ZlRnJvbUluZGV4Rm9yRWxsaXBzZXMgP1xuICAgICAgICAgICAgICAgIHJlbW92ZUZyb21JbmRleEZvckVsbGlwc2VzIDogcmVtb3ZlRnJvbUluZGV4O1xuXG4gICAgICAgICAgICAgICAgZm9yIChpID0gbGVuIC0gMTsgaSA+PSByZW1vdmVGcm9tSW5kZXhGb3JFbGxpcHNlczsgaSAtPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0gPSBjaGFyYWN0ZXJBcnJbaV0uZWxlbTtcbiAgICAgICAgICAgICAgICAgICAgLy9jaGVjaCB3aGV0aGVyIHRoaXMgc3BhbiBpcyB0ZW1wb3JhcnkgaW5zZXJ0ZWQgc3BhbiBmcm9tIGl0J3MgY2xhc3NcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGVsZW0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZvciAoOyBpID49IDA7IGkgLT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtID0gY2hhcmFjdGVyQXJyW2ldLmVsZW07XG4gICAgICAgICAgICAgICAgICAgIGlmIChzbExpYi5jbGFzc05hbWVCclJlZy50ZXN0KGVsZW0uY2xhc3NOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9jaGVjaCB3aGV0aGVyIHRoaXMgc3BhbiBpcyB0ZW1wb3JhcnkgaW5zZXJ0ZWQgc3BhbiBmcm9tIGl0J3MgY2xhc3NcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChlbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGkgPSAwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL2dldCB0aGUgc21hcnQgdGV4dFxuICAgICAgICAgICAgc21hcnRMYWJlbC50ZXh0ID0gY29udGFpbmVyLmlubmVySFRNTC5yZXBsYWNlKHNsTGliLnNwYW5SZW1vdmFsUmVneCwgJyQxJykucmVwbGFjZSgvXFwmYW1wXFw7L2csICcmJyk7XG4gICAgICAgICAgICBpZiAoc21hcnRMYWJlbC5pc1RydW5jYXRlZCkge1xuICAgICAgICAgICAgICAgIHNtYXJ0TGFiZWwudGV4dCArPSBlbGxpcHNlc1N0cjtcbiAgICAgICAgICAgICAgICBzbWFydExhYmVsLnRvb2x0ZXh0ID0gdG9vbFRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBzbWFydExhYmVsLmhlaWdodCA9IGNvbnRhaW5lci5vZmZzZXRIZWlnaHQ7XG4gICAgICAgIHNtYXJ0TGFiZWwud2lkdGggPSBjb250YWluZXIub2Zmc2V0V2lkdGg7XG5cbiAgICAgICAgcmV0dXJuIHNtYXJ0TGFiZWw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBzbWFydExhYmVsLmVycm9yID0gbmV3IEVycm9yKCdCb2R5IFRhZyBNaXNzaW5nIScpO1xuICAgICAgICByZXR1cm4gc21hcnRMYWJlbDtcbiAgICB9XG59O1xuXG4vKlxuICogR2V0IHRoZSBoZWlnaHQgYW5kIHdpZHRoIG9mIGEgdGV4dC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdGV4dCAtIFRleHQgd2hvc2UgbWV0cmljcyB0byBiZSBtZWFzdXJlZFxuICogQHBhcmFtIHtCb29sZWFufSBPcHRpb25hbCBkZXRhaWxlZENhbGN1bGF0aW9uRmxhZyAtIHRoaXMgZmxhZyBpZiBzZXQgaXQgY2FsY3VsYXRlcyBwZXIgbGV0dGVyIHBvc2l0aW9uXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mb3JtYXRpb24gYW5kIHJldHVybnMgaXQuIElkZWFsbHkgeW91IGRvbnQgbmVlZCBpdCB1bmxlc3MgeW91IHdhbnQgdG8gcG9zdCBwcm9jZXNzIHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgIHN0cmluZy4gQW5kIGl0cyBhbiBFWFBFTlNJVkUgT1BFUkFUSU9OLlxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gLSBJZiBkZXRhaWxlZENhbGN1bGF0aW9uRmxhZyBpcyBzZXQgdG8gdHJ1ZSB0aGUgcmV0dXJuZWQgb2JqZWN0IHdvdWxkIGJlXG4gKiAgICAgICAgICAgICAgICAgIHtcbiAqICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0IG9mIHRoZSB0ZXh0XG4gKiAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogd2lkdGggb2YgdGhlIHRleHRcbiAqICAgICAgICAgICAgICAgICAgICAgIGRldGFpbE9iajogZGV0YWlsIGNhbGN1bGF0aW9uIG9mIGxldHRlcnMgaW4gdGhlIGZvcm1hdCB7bGV0dGVybmFtZTogd2lkdGh9XG4gKiAgICAgICAgICAgICAgICAgIH1cbiAqICAgICAgICAgICAgICAgICAgSWYgZGV0YWlsZWRDYWxjdWxhdGlvbkZsYWcgaXMgc2V0IHRvIGZhbHNlIHRoZSByZXR1cm5lZCBvYmplY3Qgd29udCBoYXZlIHRoZSBkZXRhaWxPYmogcHJvcC5cbiAqL1xuU21hcnRMYWJlbE1hbmFnZXIucHJvdG90eXBlLmdldE9yaVNpemUgPSBmdW5jdGlvbiAodGV4dCwgZGV0YWlsZWRDYWxjdWxhdGlvbkZsYWcpIHtcbiAgICBpZiAoIXRoaXMuX2luaXQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHZhciB0ZXh0QXJyLFxuICAgICAgICBsZXR0ZXIsXG4gICAgICAgIGxTaXplLFxuICAgICAgICBpLFxuICAgICAgICBsLFxuICAgICAgICBjdW11bGF0aXZlU2l6ZSA9IDAsXG4gICAgICAgIGhlaWdodCA9IDAsXG4gICAgICAgIGluZGlTaXplU3RvcmUgPSB7IH07XG5cbiAgICBpZiAoIWRldGFpbGVkQ2FsY3VsYXRpb25GbGFnKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jYWxDaGFyRGltV2l0aENhY2hlKHRleHQpO1xuICAgIH1cblxuICAgIC8vIENhbGN1bGF0ZSB0aGUgd2lkdGggb2YgZXZlcnkgbGV0dGVyIHdpdGggYW4gYXBwcm94aW1hdGlvblxuICAgIHRleHRBcnIgPSB0ZXh0LnNwbGl0KCcnKTtcbiAgICBmb3IgKGkgPSAwLCBsID0gdGV4dEFyci5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgbGV0dGVyID0gdGV4dEFycltpXTtcbiAgICAgICAgbFNpemUgPSB0aGlzLl9jYWxDaGFyRGltV2l0aENhY2hlKGxldHRlciwgdHJ1ZSwgdGV4dEFyci5sZW5ndGgpO1xuICAgICAgICBoZWlnaHQgPSBtYXgoaGVpZ2h0LCBsU2l6ZS5oZWlnaHQpO1xuICAgICAgICBjdW11bGF0aXZlU2l6ZSArPSBsU2l6ZS53aWR0aDtcbiAgICAgICAgaW5kaVNpemVTdG9yZVtsZXR0ZXJdID0gbFNpemUud2lkdGg7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgd2lkdGg6IHJvdW5kKGN1bXVsYXRpdmVTaXplKSxcbiAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgIGRldGFpbE9iajogaW5kaVNpemVTdG9yZVxuICAgIH07XG59O1xuXG4vKlxuICogRGlzcG9zZSB0aGUgY29udGFpbmVyIGFuZCBvYmplY3QgYWxsb2NhdGVkIGJ5IHRoZSBzbWFydGxhYmVsXG4gKi9cblNtYXJ0TGFiZWxNYW5hZ2VyLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5faW5pdCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICB0aGlzLl9jb250YWluZXJNYW5hZ2VyICYmIHRoaXMuX2NvbnRhaW5lck1hbmFnZXIuZGlzcG9zZSAmJiB0aGlzLl9jb250YWluZXJNYW5hZ2VyLmRpc3Bvc2UoKTtcblxuICAgIGRlbGV0ZSB0aGlzLl9jb250YWluZXI7XG4gICAgZGVsZXRlIHRoaXMuX2NvbnRleHQ7XG4gICAgZGVsZXRlIHRoaXMuX2NhY2hlO1xuICAgIGRlbGV0ZSB0aGlzLl9jb250YWluZXJNYW5hZ2VyO1xuICAgIGRlbGV0ZSB0aGlzLl9jb250YWluZXJPYmo7XG4gICAgZGVsZXRlIHRoaXMuaWQ7XG4gICAgZGVsZXRlIHRoaXMuc3R5bGU7XG4gICAgZGVsZXRlIHRoaXMucGFyZW50Q29udGFpbmVyO1xuICAgIGRlbGV0ZSB0aGlzLl9zaG93Tm9FbGxpcHNlcztcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgU21hcnRMYWJlbE1hbmFnZXI7Il19
