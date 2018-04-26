(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.SmartlabelManager = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
 * @constrcutor
 * SmartLabelManager controls the lifetime of the execution space where the text's metrics will be calculated.
 * This takes a string for a given style and returns the height, width.
 * If a bound box is defined it wraps the text and returns the wrapped height and width.
 * It allows to append ellipsis at the end if the text is truncated.
 *
 * @param {String | HTMLElement} container - The id or the instance of the container where the intermediate dom
 *                              elements are to be attached. If not passed, it appends in div
 *
 * @param {Boolean} useEllipses - This decides if a ellipses to be appended if the text is truncated.
 * @param {Object} options - Control options
 *                          {
 *                              maxCacheLimit: No of letter to be cached. Default: 500.
 *                          }
 */
function SmartLabelManager(container, useEllipses, options) {
    var wrapper,
        prop,
        max,
        isBrowserLess = false,
        canvas = window.document.createElement('canvas');

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

    this.parentContainer = wrapper;

    // Get a context of canvas
    this.ctx = canvas && canvas.getContext && canvas.getContext('2d');
    this._getDimention = this.ctx ? slLib._getDimentionUsingCanvas : slLib._getDimentionUsingDiv;

    this._containerManager = new _containerManager2['default'](wrapper, isBrowserLess, 10);
    this._showNoEllipses = !useEllipses;
    this._init = true;
    this.style = {};
    this.oldStyle = 1;
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

// Calculates space taken by a character with an approximation value which is calculated by repeating the
// character by string length times.
SmartLabelManager.prototype._calCharDimWithCache = function (text, calculateDifference, length) {
    if (text === undefined) text = '';

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
        style = this.style || {},
        cache,
        advancedCacheKey,
        cacheName,
        cacheInitName;

    cache = this._advancedCache = this._advancedCache || (this._advancedCache = {}), advancedCacheKey = this._advancedCacheKey || (this._advancedCacheKey = []), cacheName = text + (style.fontSize || BLANK) + (style.fontFamily || BLANK) + (style.fontWeight || BLANK) + (style.fontStyle || BLANK), cacheInitName = text + 'init' + (style.fontSize || BLANK) + (style.fontFamily || BLANK) + (style.fontWeight || BLANK) + (style.fontStyle || BLANK);

    !this.ctx && htmlSplCharSpace[text] && (text = htmlSplCharSpace[text]);

    if (!calculateDifference) {
        asymmetricDifference = 0;
    } else {
        if ((asymmetricDifference = cache[cacheInitName]) === undefined) {
            tw = this._getDimention(text.repeat ? text.repeat(length) : Array(length + 1).join(text)).width;

            twi = this._getDimention(text).width;

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

    size = this._getDimention(text);
    size.width += asymmetricDifference;

    cache[cacheName] = size.width + ',' + size.height;
    advancedCacheKey.push(cacheName);
    if (advancedCacheKey.length > maxAdvancedCacheLimit) {
        delete cache[advancedCacheKey.shift()];
    }

    return size;
};

// Provide function to calculate the height and width based on the environment and available support from dom.
SmartLabelManager.prototype._getWidthFn = function () {
    var sl = this,
        contObj = sl._containerObj,
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
            return sl._getDimention(str).width;
        };
    }
};

/**
 * Sets font property of canvas context based on which the width of text is calculated.
 * 
 * @param {any} style style configuration which affects the text size
 *                      {
 *                          fontSize / 'font-size' : MUST BE FOLLOWED BY PX (10px, 11px)
 *                          fontFamily / 'font-family'
 *                          fontWeight / 'font-weight'
 *                          fontStyle / 'font-style'
 *                      }
 */
SmartLabelManager.prototype._setStyleOfCanvas = function () {
    if (this.style === this.oldStyle) {
        return;
    }

    var sl = this,
        style = sl.style,
        sCont,
        fontStyle = style.fontStyle || style['font-style'] || 'normal',
        fontVariant = style.fontVariant || style['font-variant'] || 'normal',
        fontWeight = style.fontWeight || style['font-weight'] || 'normal',
        fontSize = style.fontSize || style['font-size'] || '12px',
        fontFamily = style.fontFamily || style['font-family'] || 'Verdana,sans';

    fontSize += fontSize.indexOf('px') === -1 ? 'px' : '';
    sl.ctx.font = fontStyle + ' ' + fontVariant + ' ' + fontWeight + ' ' + fontSize + ' ' + fontFamily;

    sCont = this._containerObj = this._containerManager.get(style);

    if (this._containerObj) {
        this._container = sCont.node;
        this._context = sCont.context;
        this._cache = sCont.charCache;
        this._lineHeight = sCont.lineHeight;
        this._styleNotSet = false;
    } else {
        this._styleNotSet = true;
    }
    sCont.ellipsesWidth = sl.ctx.measureText('...').width;
    sCont.dotWidth = sl.ctx.measureText('.').width;
    sCont.lineHeight = this._lineHeight = sCont.lineHeight || slLib._getCleanHeight(style.lineHeight);
    this.oldStyle = style;
};

SmartLabelManager.prototype._setStyleOfDiv = function () {
    var sCont,
        style = this.style;

    this._containerObj = sCont = this._containerManager.get(style);
    !sCont.node && this._containerManager._makeDivNode(this._containerObj);

    if (this._containerObj) {
        this._container = sCont.node;
        this._context = sCont.context;
        this._cache = sCont.charCache;
        this._lineHeight = sCont.lineHeight;
        this._styleNotSet = false;
    } else {
        this._styleNotSet = true;
    }
};

SmartLabelManager.prototype._updateStyle = function (requireDiv) {
    return requireDiv || !this.ctx ? this._setStyleOfDiv() : this._setStyleOfCanvas();
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
    if (style) {
        this.style = style;
        slLib.setLineHeight(style);
    }
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
        lineHeight,
        context,
        container,
        sCont,
        ellipsesWidth,
        dotWidth,
        canvas = this.ctx,
        characterArr = [],
        dashIndex = -1,
        spaceIndex = -1,
        lastLineBreak = -1,
        hasOnlyBrTag,
        dimentionObj,
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

    hasHTMLTag = slLib.xmlTagRegEx.test(text);
    hasOnlyBrTag = slLib._hasOnlyBRTag(text);

    this._updateStyle(hasHTMLTag && !hasOnlyBrTag);

    lineHeight = this._lineHeight;
    context = this._context;
    container = this._container;
    sCont = this._containerObj;
    ellipsesWidth = sCont.ellipsesWidth;
    dotWidth = sCont.dotWidth;

    getWidth = this._getWidthFn();

    // In some browsers, offsetheight of a single-line text is getting little (1 px) heigher value of the
    // lineheight. As a result, smartLabel is unable to return single-line text.
    // To fix this, increase the maxHeight a little amount. Hence maxHeight =  lineHeight * 1.2
    if (maxHeight === lineHeight) {
        maxHeight *= 1.2;
    }

    if (canvas || container) {
        if (!documentSupport.isBrowserLess) {

            if (!hasHTMLTag) {
                // Due to support of <,> for xml we convert &lt;, &gt; to <,> respectively so to get the correct
                // width it is required to convert the same before calculation for the new improve version of the
                // get text width.
                tmpText = text.replace(slLib.ltgtRegex, function (match) {
                    return match === '&lt;' ? '<' : '>';
                });
                getOriSizeImproveObj = this.getOriSize(tmpText, true, {
                    hasHTMLTag: hasHTMLTag,
                    hasOnlyBrTag: hasOnlyBrTag,
                    cleanText: true
                });

                smartLabel.oriTextWidth = oriWidth = getOriSizeImproveObj.width;
                smartLabel.oriTextHeight = oriHeight = getOriSizeImproveObj.height;
            } else if (hasOnlyBrTag) {
                text = text.replace(slLib.brRegex, '<br />');
                dimentionObj = slLib._getDimentionOfMultiLineText(text, this);
                smartLabel.oriTextWidth = oriWidth = dimentionObj.width;
                smartLabel.oriTextHeight = oriHeight = dimentionObj.height;
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

        // Checks if any html tag is present. This if block is executed for all normal texts and
        // all texts containing only <br /> tag.
        if (!hasHTMLTag || hasOnlyBrTag) {
            // Gets splitted array
            oriTextArr = slLib._getTextArray(text);
            len = oriTextArr.length;
            trimStr = '', tempArr = [];
            tempChar = oriTextArr[0];

            if (this._cache[tempChar]) {
                minWidth = this._cache[tempChar].width;
            } else {
                minWidth = getWidth(tempChar);
                this._cache[tempChar] = { width: minWidth };
            }

            if (maxWidthWithEll > minWidth && !hasOnlyBrTag) {
                tempArr = text.substr(0, slLib.getNearestBreakIndex(text, maxWidthWithEll, this)).split('');
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

            i = tempArr.length;
            strWidth = getWidth(tempArr.join(''));
            strHeight = this._lineHeight;

            if (noWrap) {
                for (; i < len; i += 1) {
                    tempChar = tempArr[i] = oriTextArr[i];

                    // In case of <br>, reset width to 0 and increase line height
                    if (tempArr[i] === '<br />') {
                        strHeight += this._lineHeight;
                        lastIndexBroken = i;

                        maxStrWidth = max(maxStrWidth, strWidth);
                        strWidth = 0;
                        trimStr = null;
                        continue;
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
                            smartLabel.text = fastTrim(trimStr) + ellipsesStr;
                            smartLabel.tooltext = smartLabel.oriText;
                            smartLabel.width = max(maxStrWidth, strWidth);
                            smartLabel.height = strHeight;
                            return smartLabel;
                        }
                    }
                }

                smartLabel.text = tempArr.join('');
                smartLabel.width = max(maxStrWidth, strWidth);
                smartLabel.height = strHeight;
                return smartLabel;
            } else {
                for (; i < len; i += 1) {
                    tempChar = tempArr[i] = oriTextArr[i];
                    if (tempChar === ' ' && !context) {
                        tempChar = this.ctx ? ' ' : '&nbsp;';
                    }

                    // In case of <br>, reset width to 0 and increase line height
                    if (tempArr[i] === '<br />') {
                        strHeight += this._lineHeight;
                        lastIndexBroken = i;
                        maxStrWidth = max(maxStrWidth, strWidth);
                        strWidth = 0;
                        trimStr = null;
                        continue;
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
                            lastSpace = slLib._findLastIndex(oriTextArr.slice(0, tempArr.length), ' ');
                            lastDash = slLib._findLastIndex(oriTextArr.slice(0, tempArr.length), '-');
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
                                if (!hasOnlyBrTag) {
                                    nearestChar = slLib.getNearestBreakIndex(text.substr(newCharIndex), maxWidthWithEll, this);
                                    strWidth = getWidth(text.substr(newCharIndex, nearestChar || 1));
                                    if (tempArr.length < newCharIndex + nearestChar) {
                                        tempArr = tempArr.concat(text.substr(tempArr.length, newCharIndex + nearestChar - tempArr.length).split(''));
                                        i = tempArr.length - 1;
                                    }
                                } else {
                                    strWidth = 0;
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
SmartLabelManager.prototype.getOriSize = function () {
    var text = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
    var detailedCalculationFlag = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];
    var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

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
        container,
        indiSizeStore = {},
        hasHTMLTag = config.hasHTMLTag,
        hasOnlyBrTag = config.hasOnlyBrTag;

    typeof hasHTMLTag === 'undefined' && (hasHTMLTag = slLib.xmlTagRegEx.test(text));
    typeof hasOnlyBrTag === 'undefined' && (hasOnlyBrTag = slLib._hasOnlyBRTag(text));

    if (!config.cleanText) {
        text = text.replace(slLib.ltgtRegex, function (match) {
            return match === '&lt;' ? '<' : '>';
        });
    }
    this._updateStyle(hasHTMLTag && !hasOnlyBrTag);
    container = this._container;
    // If text has br tag, return the width and height with proper calculations
    if (hasOnlyBrTag) {
        return slLib._getDimentionOfMultiLineText(text, this);
    }

    // When text is normal text
    if (!detailedCalculationFlag) {
        return this._calCharDimWithCache(text);
    }

    // text contains html tags other than br
    if (hasHTMLTag) {
        container.innerHTML = text;
        return {
            width: container.offsetWidth,
            height: container.offsetHeight
        };
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

},{"./container-manager":2,"./lib":3}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

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

ContainerManager.prototype._makeDivNode = function (container, keyStr) {
    var node;

    if (!container.node) {
        container.node = doc.createElement('div');
        this.rootNode.appendChild(container.node);
    }
    node = container.node;

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
        if (!container.svgText) {
            container.svgText = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
            this.svgRoot.appendChild(node);
        }
        node = container.svgText;
        node.setAttribute('style', keyStr);

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
};
ContainerManager.prototype.addContainer = function (keyStr) {
    var container;

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

    cObj.node && cObj.node.parentNode.removeChild(cObj.node);

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

exports['default'] = ContainerManager;
module.exports = exports['default'];

},{"./lib":3}],3:[function(require,module,exports){
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
		    clsNameSpace = 'fusioncharts-smartlabel-',
		    containerClass = clsNameSpace + 'container',
		    classNameWithTag = clsNameSpace + 'tag',
		    classNameWithTagBR = clsNameSpace + 'br';

		lib = {
			win: win,

			containerClass: containerClass,

			classNameWithTag: classNameWithTag,

			classNameWithTagBR: classNameWithTagBR,

			maxDefaultCacheLimit: 1000,

			classNameReg: new RegExp('\b' + classNameWithTag + '\b'),

			classNameBrReg: new RegExp('\b' + classNameWithTagBR + '\b'),

			spanAdditionRegx: /(<[^<\>]+?\>)|(&(?:[a-z]+|#[0-9]+);|.)/ig,

			spanAdditionReplacer: '$1<span class="' + classNameWithTag + '">$2</span>',

			spanRemovalRegx: new RegExp('\\<span[^\\>]+?' + classNameWithTag + '[^\\>]{0,}\\>(.*?)\\<\\/span\\>', 'ig'),

			xmlTagRegEx: new RegExp('<[^>][^<]*[^>]+>', 'i'),

			brRegex: new RegExp('({br[ ]*})|(<br[ ]*>)|(<br[ ]*\/>)|(<BR[ ]*\/>)|(<br\\>)', 'g'),

			ltgtRegex: /&lt;|&gt;/g,

			htmlSpecialEntityRegex: /&amp;|&quot;|&lt;|&gt;/g,

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
			},

			/**
    * Returns the clean height by removing 'px' if present.
    */
			_getCleanHeight: function _getCleanHeight(height) {
				// Remove 'px' from  height and convert it to number
				height = height.replace(/px/g, '');
				return Number(height);
			},
			/**
    * Div is used for calculation of text dimention in all non-canvas browsers. It sets the text as
    * innerHTML of the div and uses it's offsetWidth and offsetHeight as width and height respectively
    *
    * @param {string} text - text, whose measurements are to be calculated
    * 
    * @returns {Object} - dimension of text
    */
			_getDimentionUsingDiv: function _getDimentionUsingDiv() {
				var text = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

				var container = this._container;

				// In case text is an array, convert it to string.
				if (text instanceof Array) {
					text = text.join('');
				}
				container.innerHTML = text;
				return {
					width: container.offsetWidth,
					height: container.offsetHeight
				};
			},

			/**
    * Returns the height and width of a text using the canvas.measureText API.
    * Used for calculating width in browsers supporting html canvas.
    * In case canvas is not present, <div> is used for calculation as a fallback solution
    * 
    * @param {any} text -  text. Can be array or string.
    * 
    * @return {Object} - width and height.
    */
			_getDimentionUsingCanvas: function _getDimentionUsingCanvas() {
				var text = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

				var sl = this,
				    ctx = sl.ctx,
				    style = sl.style,
				    height = lib._getCleanHeight(style.lineHeight);

				// In case text is string, remove <br /> from it.
				if (!(text instanceof Array)) {
					text = text.replace(/<br \/>/g, '');
				} else {
					// Else if it an array, convert it to string and remove <br />
					text = text.join('');
					text = text.replace(/<br \/>/g, '');
				}

				return {
					width: ctx.measureText(text).width,
					height: height
				};
			},

			/**
    * Checks if text contains any <br /> tag. If yes, it returns all the indexes of it.
    * Else, it returns undefined.
    * 
    * @param {string} input -  text which is to be examined for <br /> tag
    * 
    * @returns {any} - Array containing index of occurance of <br />, else undefined.
    */
			_hasOnlyBRTag: function _hasOnlyBRTag() {
				var input = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

				var i,
				    len,
				    text = input.replace(lib.brRegex, '<br />'),
				    brTagArray = text.split('<br />'),
				    brTagArrayLen = brTagArray.length,
				    index = [];

				// Check for other tags
				for (i = 0; i < brTagArrayLen; i++) {
					if (lib.xmlTagRegEx.test(brTagArray[i])) {
						return false;
					}
				}

				// Finds position of all br tag
				for (i = 0, len = text.length; i < len; i++) {
					if (text[i] === '<') {
						if (text.substr(i, Math.min(6, len - i)) === '<br />') {
							index.push(i);
						} else {
							return false;
						}
					}
				}

				if (index.length === 0) {
					return false;
				} else return index;
			},

			/**
    * For a text containing <br /> it returns the height and width of the text
    * 
    */
			_getDimentionOfMultiLineText: function _getDimentionOfMultiLineText(text, sl) {
				if (text === undefined) text = '';

				var i,
				    len,
				    textAr = lib._getTextArray(text),
				    width = 0,
				    maxWidth = 0,
				    getWidth = sl._getWidthFn(),
				    height = lib._getCleanHeight(sl.style.lineHeight),
				    textHeight = height,
				    textWidth,
				    indiSizeStore = {};

				for (i = 0, len = textAr.length; i < len; i++) {
					if (textAr[i] === '<br />') {
						// In case of <br />, reset width to 0, since it will be new line now.
						// Also, increase the line height.
						maxWidth = Math.max(maxWidth, width);
						width = 0;
						textHeight += height;
					} else {
						// Else, calculate the width of the line.
						textWidth = getWidth(textAr[i]);
						width += textWidth;
						indiSizeStore[textAr[i]] = textWidth;
					}
				}

				maxWidth = Math.max(maxWidth, width);
				return {
					height: textHeight,
					width: maxWidth,
					detailObj: indiSizeStore
				};
			},

			/**
    * Splits text into array and returns. Special functionality is, it treats <br /> as a single character
    */
			_getTextArray: function _getTextArray() {
				var text = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

				var i,
				    j,
				    len,
				    tempLen,
				    brText,
				    tempText,
				    finaltextAr = [];

				// Split using <br />
				brText = text.split('<br />');
				len = brText.length;

				for (i = 0; i < len; i++) {
					tempText = brText[i].split('');
					tempLen = tempText.length;

					// for each array retrieved by spliting using <br /> push elements to finalArray.
					for (j = 0; j < tempLen; j++) {
						finaltextAr.push(tempText[j]);
					}

					// Check if tempText is not the last text. IF true, add <br /> to the final Array.
					if (i !== len - 1) {
						finaltextAr.push('<br />');
					}
				}

				return finaltextAr;
			},

			/**
    * Returns the last occurance of item in a array
    */
			_findLastIndex: function _findLastIndex(array, item) {
				if (array === undefined) array = [];

				var i,
				    len = array.length;

				for (i = len - 1; i >= 0; i--) {
					if (array[i] === item) {
						return i;
					}
				}

				return -1;
			}
		};

		return lib;
	}
};

exports['default'] = lib;
module.exports = exports['default'];

},{}]},{},[1])(1)
});
