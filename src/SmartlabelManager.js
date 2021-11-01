import lib from './lib';
import ContainerManager from './container-manager';

var slLib = lib.init(window),
    doc = slLib.win.document,
    M = slLib.win.Math,
    max = M.max,
    round = M.round,
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

    if (documentSupport.isHeadLess || (!documentSupport.isIE && !wrapper.offsetHeight && !wrapper.offsetWidth)) {
        isBrowserLess = true;
    }

    wrapper.innerHTML = '';
    for (prop in slLib.parentContainerStyle) {
        wrapper.style[prop] = slLib.parentContainerStyle[prop];
    }

    this.parentContainer = wrapper;

    // Get a context of canvas
    this.ctx = canvas && canvas.getContext && canvas.getContext('2d');

    this._containerManager = new ContainerManager(wrapper, isBrowserLess, 10);
    this._showNoEllipses = !useEllipses;
    this._init = true;
    this.style = {};
    this.oldStyle = {};
    this.options = options;

    this.setStyle();
}
function getAbbrTagIndices(abbrRegex, abbrEndRegex, text, tagText, endtagText) {
    var tagindices = [],
    result,
    dummyNode,
    testAbbr,
    endtagindices = [];
    while ( (result = abbrRegex.exec(text)) ) {
            dummyNode = document.createElement('p');
            testAbbr = result[0] + 'Dummy</abbr>';
            dummyNode.innerHTML = testAbbr;
        tagindices.push({tagName:result[0],index:result.index,title:dummyNode.childNodes[0].title ? dummyNode.childNodes[0].title : '', endTagName: endtagText});
    }
    while ( (result = abbrEndRegex.exec(text)) ) {
        endtagindices.push({tagName:endtagText,index:result.index});
    }

    return({
        tag: tagindices,
        endtag: endtagindices
    })
}
function getStyles(el) {  ///Get Styles as an array of objects
    var output = {};

    if (!el || !el.style || !el.style.cssText) {
        return output;
    }

    var camelize = function camelize(str) {
        return str.replace (/(?:^|[-])(\w)/g, function (a, c) {
            c = a.substr(0, 1) === '-' ? c.toUpperCase () : c;
            return c ? c : '';
        });
    }

    var style = el.style.cssText.split(';');

    for (var i = 0; i < style.length; ++i) {
        var rule = style[i].trim();

        if (rule) {
            var ruleParts = rule.split(':');
            var key = camelize(ruleParts[0].trim());
            output[key] = ruleParts[1].trim();
        }
    }

    return output;
}
function getSpanTagIndices(spanRegex, spanEndRegex, text, tagText, endtagText) {
    var tagindices = [],
    result,
    dummyNode,
    testAbbr,
    styleObj,
    endtagindices = [];
    while ( (result = spanRegex.exec(text)) ) {
            dummyNode = document.createElement('p');
            testAbbr = result[0] + 'Dummy</span>';
            dummyNode.innerHTML = testAbbr;
            styleObj = getStyles(dummyNode.childNodes[0]);
            tagindices.push({tagName:result[0],index:result.index,style: styleObj ? styleObj : '', endTagName: endtagText});
    }
    while ( (result = spanEndRegex.exec(text)) ) {
        endtagindices.push({tagName:endtagText,index:result.index});
    }

    return({
        tag: tagindices,
        endtag: endtagindices
    })
}
function getAnchorTagIndices(anchorRegex, anchorEndRegex, text, tagText, endtagText) {
    var tagindices = [],
    result,
    dummyNode,
    testAbbr,
    endtagindices = [];
    while ( (result = anchorRegex.exec(text)) ) {
            dummyNode = document.createElement('p');
            testAbbr = result[0] + '</a>';
            dummyNode.innerHTML = testAbbr;
        tagindices.push({tagName:result[0],index:result.index,href:dummyNode.childNodes[0].href ? dummyNode.childNodes[0].href: '',target:dummyNode.childNodes[0].target ? dummyNode.childNodes[0].target:'',hreflang: dummyNode.childNodes[0].hreflang?dummyNode.childNodes[0].hreflang:'',referrerpolicy: dummyNode.childNodes[0].referrerpolicy ? dummyNode.childNodes[0].referrerpolicy: '',rel:dummyNode.childNodes[0].rel ? dummyNode.childNodes[0].rel : '', endTagName: endtagText});
    }
    while ( (result = anchorEndRegex.exec(text)) ) {
        endtagindices.push({tagName:endtagText,index:result.index});
    }

    return({
        tag: tagindices,
        endtag: endtagindices
    })
}
function getTagIndices(tagRegex, endTagRegex, text, tagText, endtagText) {
    var tagindices = [],
     result,
     endtagindices = [];
     if(tagRegex) {
     while ( (result = tagRegex.exec(text)) ) {
         tagindices.push({tagName:tagText,index:result.index, endTagName: endtagText});
     }
    }
    if(endTagRegex) {
     while ( (result = endTagRegex.exec(text)) ) {
         endtagindices.push({tagName:endtagText,index:result.index});
     }
    }
     return({
         tag: tagindices,
         endtag: endtagindices
     })
 }
function sortTags(u, b, em, strike,sub, sup, abbr, a, sp, str, it, del, s, br) {
    var i,j,
        tagArr = [u, b, em, strike, sub, sup, abbr, a, sp, str, it, del, s, br],
        res = [];
    for (j = 0;j< tagArr.length; j++) {
        for (var key in tagArr[j]) {
            if(tagArr[j][key].length) {
                for(i = 0;i<tagArr[j][key].length;i++) {
                    res.push(tagArr[j][key][i]);
                }
            }
        }
    }
    res = res.sort(function(a, b) {
        return(a.index - b.index)
    })
    return res;
}
function getSortedBRTagIndices(text) {
    var  brRegex = /<br\s*\/?>/g,
         brTagIndices = getTagIndices(brRegex, undefined, text, '<br />', ''),
         sortedIndices = sortTags({}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, brTagIndices);
         return sortedIndices;
}
function getSortedTagIndices(text) {
    var underlineRegex = /<u>/g,
                    underlineEndRegex = /<\/u>/g,
                    boldRegex = /<b>/g,
                    boldEndRegex = /<\/b>/g,
                    strongRegex = /<strong>/g,
                    strongEndRegex = /<\/strong>/g,
                    emphasisRegex = /<em>/g,
                    emphasisEndRegex = /<\/em>/g,
                    italicRegex = /<i>/g,
                    italicEndRegex = /<\/i>/g,
                    delRegex = /<del>/g,
                    delEndRegex = /<\/del>/g,
                    sRegex = /<s>/g,
                    sEndRegex = /<\/s>/g,
                    strikeRegex = /<strike>/g,
                    strikeEndRegex = /<\/strike>/g,
                    subscriptRegex = /<sub>/g,
                    subscriptEndRegex = /<\/sub>/g,
                    superscriptRegex = /<sup>/g,
                    superscriptEndRegex = /<\/sup>/g,
                    abbrRegex = /<abbr[\s]+([^>]+)>/g,
                    abbrEndRegex = /<\/abbr>/g,
                    spanRegex = /<span[\s]+([^>]+)>/g,
                    spanEndRegex = /<\/span>/g,
                    anchorRegex = /<a[\s]+([^>]+)>/g,
                    anchorEndRegex = /<\/a>/g,
                    brRegex = /<br\s*\/?>/g,
                    underlinetagIndices = getTagIndices(underlineRegex, underlineEndRegex, text, '<u>', '</u>'),
                    boldtagIndices = getTagIndices(boldRegex, boldEndRegex, text, '<b>', '</b>'),
                    emtagIndices = getTagIndices(emphasisRegex, emphasisEndRegex, text, '<em>', '</em>'),
                    strikeTagIndices = getTagIndices(strikeRegex, strikeEndRegex, text, '<strike>', '</strike>'),
                    subscriptTagIndices = getTagIndices(subscriptRegex, subscriptEndRegex, text, '<sub>', '</sub>'),
                    superscriptTagIndices = getTagIndices(superscriptRegex, superscriptEndRegex, text, '<sup>', '</sup>'),
                    abbrTagIndices = getAbbrTagIndices(abbrRegex, abbrEndRegex, text, '<abbr>', '</abbr>'),
                    anchorTagIndices = getAnchorTagIndices(anchorRegex, anchorEndRegex, text, '<a>', '</a>'),
                    spanTagIndices = getSpanTagIndices(spanRegex, spanEndRegex, text, '<span>', '</span>'),
                    strongTagIndices = getTagIndices(strongRegex, strongEndRegex, text, '<strong>', '</strong>'),
                    italicTagIndices = getTagIndices(italicRegex, italicEndRegex, text, '<i>', '</i>'),
                    delTagIndices = getTagIndices(delRegex, delEndRegex, text, '<del>', '</del>'),
                    sTagIndices = getTagIndices(sRegex, sEndRegex, text, '<s>', '</s>'),
                    brTagIndices = getTagIndices(brRegex, undefined, text, '<br />', ''),
                    sortedIndices = sortTags(underlinetagIndices, boldtagIndices, emtagIndices, strikeTagIndices, subscriptTagIndices, superscriptTagIndices, abbrTagIndices, anchorTagIndices, spanTagIndices, strongTagIndices, italicTagIndices, delTagIndices, sTagIndices, brTagIndices);
                    return sortedIndices;
}
function spliceSlice(str, index, count, add) {
    // We cannot pass negative indexes directly to the 2nd slicing operation.
    if (index < 0) {
      index = str.length + index;
      if (index < 0) {
        index = 0;
      }
    }
  
    return str.slice(0, index) + (add || "") + str.slice(index + count);
  }
function getResolvedTags(text, tagIndices, brTagIndex, charOffset) {
    var i,startPtr, endPtr,
        resultText = text,
        newBrIndex = brTagIndex.index,
        beforeTagindex = brTagIndex.index,
        afterTagindex = brTagIndex.index + 6;
    if(!tagIndices.length) {
        return {text : text, charOffset: charOffset};
    }
    startPtr = 0;
    endPtr = tagIndices.length - 1;
    if(tagIndices[startPtr].endTagName) {
        afterTagindex = beforeTagindex + tagIndices[startPtr].endTagName.length + 6;
    }
    while(startPtr <= endPtr) {
        if(tagIndices[startPtr].endTagName) {
            if(startPtr === endPtr) {
                resultText = spliceSlice(resultText, beforeTagindex, 0, tagIndices[startPtr].endTagName);
                resultText = spliceSlice(resultText, afterTagindex, 0, tagIndices[startPtr].tagName);
                //resultText = spliceSlice(resultText, beforeTagindex + tagIndices[startPtr].endTagName.length + 6, 0, tagIndices[startPtr].tagName);
                newBrIndex = newBrIndex + tagIndices[startPtr].endTagName.length;
                beforeTagindex = newBrIndex - tagIndices[startPtr].endTagName.length;
                afterTagindex = ((newBrIndex + tagIndices[startPtr].endTagName.length + 6)+tagIndices[startPtr].tagName.length);
                charOffset += tagIndices[startPtr].endTagName.length;
                charOffset += tagIndices[startPtr].tagName.length;
                startPtr ++;
                endPtr --;
            } else if(tagIndices[startPtr].endTagName !== tagIndices[endPtr].tagName) {

                for (i = startPtr; i <= endPtr ;i++) {
                    if(tagIndices[i + 1]) {
                        if(tagIndices[startPtr].endTagName === tagIndices[i + 1].tagName) {
                            startPtr = i + 2;
                            break;
                        }
                    }
                }
                if(i > endPtr) {
                    resultText = spliceSlice(resultText, beforeTagindex, 0, tagIndices[startPtr].endTagName);
                    //var myIndx = beforeTagindex + tagIndices[startPtr].endTagName.length
                    resultText = spliceSlice(resultText, (beforeTagindex + tagIndices[startPtr].endTagName.length + 6), 0, tagIndices[startPtr].tagName);
                    newBrIndex = newBrIndex + tagIndices[startPtr].endTagName.length;
                    beforeTagindex = beforeTagindex + tagIndices[startPtr].endTagName.length;
                    afterTagindex = ((newBrIndex + tagIndices[startPtr].endTagName.length + 6)+tagIndices[startPtr].tagName.length);
                    charOffset += tagIndices[startPtr].endTagName.length;
                    charOffset += tagIndices[startPtr].tagName.length;
                    startPtr++;
                }
            } else {
                startPtr++;
                endPtr--;
            }
        } else {
            startPtr++;
            endPtr--;
        }
    }
    return {text: resultText, charOffset: charOffset, newBrIndex : newBrIndex};
}
function resolveTags(text) {
    var brTagIndices = getSortedBRTagIndices(text),
    i,
    charOffset = 0,
    resultObj = {},
    tagIndex,
    textSnippet,
    startIndex = 0,
    tagIndices;
    if(!text) {
        return '';
    }
    if(!brTagIndices.length) {
        return text;
    }
    tagIndex = brTagIndices[0].index;
    for(i = 0;i < brTagIndices.length; i++) {
        if(resultObj.charOffset && resultObj.charOffset > 0) {
            tagIndex = brTagIndices[i].index + resultObj.charOffset;
            brTagIndices[i].index = tagIndex;
            //startIndex = startIndex + resultObj.charOffset;
        }
        else {
            tagIndex = brTagIndices[i].index;
        }
        textSnippet = text.substring(startIndex, tagIndex);
        tagIndices = getSortedTagIndices(textSnippet);
        charOffset = resultObj.charOffset ? resultObj.charOffset : charOffset;
        resultObj = getResolvedTags(text, tagIndices, brTagIndices[i], charOffset);
        if(resultObj.newBrIndex) {
            startIndex = resultObj.newBrIndex + 6;
        }
        text = resultObj.text;
    }
    return text;
}
function resolveSingleLineText(text, tagIndices) {
    var i,
        startPtr = 0,
        resultText = text,
        endPtr = tagIndices.length - 1,
        strEnd = text.length;
    if(!tagIndices.length) {
        return text;
    }
    while(startPtr <= endPtr) {
        if(tagIndices[startPtr].endTagName) {
        if (startPtr === endPtr) {
                resultText = spliceSlice(resultText, strEnd, 0, tagIndices[startPtr].endTagName);
                startPtr ++;
                endPtr --;
        } else if(tagIndices[startPtr].endTagName !== tagIndices[endPtr].tagName) {

            for (i = startPtr; i <= endPtr ;i++) {
                if(tagIndices[i + 1]) {
                    if(tagIndices[startPtr].endTagName === tagIndices[i + 1].tagName) {
                        startPtr = i + 2;
                        break;
                    }
                }
            }
            if(i > endPtr) {
                resultText = spliceSlice(resultText, strEnd, 0, tagIndices[startPtr].endTagName);
                startPtr++;
            }
        } else {
            startPtr++;
            endPtr--;
        }
    } else {
        startPtr++;
        endPtr--;
    }
    }
    return resultText;
}
function mergeTags(_oriText, _tempText) {
    var oriText = _oriText,
        tempText = _tempText,
        resultText = '',
        tagIndices,
        dummyText = '',
        i = 0,
        oriPtr,tempPtr;
        if(oriText === tempText) {
            return oriText;
        } else if(oriText === '' && tempText !== '') {
            return tempText;
        } else if(tempText === '' && oriText !== '') {
            return oriText;
        }
        oriPtr = 0;
        tempPtr = 0;
        while(oriPtr < oriText.length) {
            if(oriText[oriPtr] && !tempText[tempPtr]) {
                resultText += oriText.substring(oriPtr, oriText.length);
                break;
            } else if(tempText[tempPtr] && !oriText[oriPtr]){
                resultText += tempText.substring(tempPtr, tempText.length);
                break;
            } else {
                if(oriText[oriPtr] === tempText[tempPtr]) {
                    if(oriText[oriPtr] === '<') {
                        dummyText = oriText[oriPtr];
                        i = oriPtr + 1;
                        while(i < oriText.length) {
                            if(oriText[i] === '>') {
                                dummyText += oriText[i];
                                break;
                            }
                            dummyText += oriText[i];
                            i++;
                        }
                        if(i >= oriText.length) {
                            resultText += oriText[oriPtr];
                            oriPtr++;
                            tempPtr++;
                        } else {
                            tagIndices = getSortedTagIndices(dummyText);
                            if(tagIndices && tagIndices.length) {
                                resultText += dummyText;
                                oriPtr += dummyText.length;
                            } else {
                                resultText += dummyText;
                                oriPtr += dummyText.length;
                                tempPtr += dummyText.length;
                            }
                        }
                    } else {
                        resultText += oriText[oriPtr];
                        oriPtr++;
                        tempPtr++;
                    }
                } else {
                    if(oriText[oriPtr] === '<') {
                        dummyText = oriText[oriPtr];
                        i = oriPtr + 1;
                        while(i < oriText.length) {
                            if(oriText[i] === '>') {
                                dummyText += oriText[i];
                                break;
                            }
                            dummyText += oriText[i];
                            i++;
                        }
                        if(i >= oriText.length) {
                            resultText += oriText[oriPtr];
                            oriPtr++;
                            tempPtr++;
                        } else {
                            tagIndices = getSortedTagIndices(dummyText);
                            if(tagIndices && tagIndices.length) {
                                resultText += dummyText;
                                oriPtr += dummyText.length;
                            } else {
                                resultText += dummyText;
                                oriPtr += dummyText.length;
                                tempPtr += dummyText.length;
                            }
                        }
                    } else if(tempText[tempPtr] === '<') {
                        dummyText = tempText[tempPtr];
                        i = tempPtr + 1;
                        while(i < tempText.length) {
                            if(tempText[i] === '>') {
                                dummyText += tempText[i];
                                break;
                            }
                            dummyText += tempText[i];
                            i++;
                        }
                        if(i >= tempText.length) {
                            resultText += tempText[tempPtr];
                            oriPtr++;
                            tempPtr++;
                        } else {
                            tagIndices = getSortedTagIndices(dummyText);
                            if(tagIndices && tagIndices.length) {
                                resultText += dummyText;
                                tempPtr += dummyText.length;
                            } else {
                                resultText += dummyText;
                                oriPtr += dummyText.length;
                                tempPtr += dummyText.length;
                            }
                        }
                    } else if(oriText[oriPtr] === ' ') {
                        oriPtr++;
                    } else if(tempText[tempPtr] === ' ') {
                        tempPtr++;
                    }
                }
            }   
        }
        return resultText;
}
function doMergeTextWithTags(oriText, tempText) {
    var resultText = oriText,
        tagIndices = getSortedTagIndices(oriText),
        brTagIndices = getSortedBRTagIndices(tempText),
        oribrTagIndices = getSortedBRTagIndices(oriText),
        j,
        keyIndex,
        dummyText = tempText,
        i,
        count = 0;
        if(oriText === tempText) {
            return oriText;
        }
        if(oribrTagIndices.length) {
            for(i = 0;i< oribrTagIndices.length;i++) {
                count = 0;
                    j = oribrTagIndices[i].index;
                    while(oriText[j]!=='>') {
                        count++;
                        j++;
                    }
                    oriText = spliceSlice(oriText, oribrTagIndices[i].index, count+1, '');
                    if(oribrTagIndices[i + 1]) {
                        keyIndex = i + 1;
                        oribrTagIndices[i + 1].index -= keyIndex * (count + 1);
                    }
                //tempOritxt = resolveOriBrTags(oriText, oribrTagIndices[i]);
            }
            if(brTagIndices.length) {
                for(i = 0;i< brTagIndices.length;i++) {
                    count = 0;
                        j = brTagIndices[i].index;
                        while(dummyText[j]!=='>') {
                            count++;
                            j++;
                        }
                        dummyText = spliceSlice(dummyText, brTagIndices[i].index, count+1, '<br />')
                        if(brTagIndices[i + 1]) {
                            keyIndex = i + 1;
                            brTagIndices[i + 1].index -= keyIndex * (count + 1);
                            brTagIndices[i + 1].index += keyIndex * 6;
                        }
                    //tempOritxt = resolveOriBrTags(oriText, oribrTagIndices[i]);
                }
            }
            tempText = dummyText;
            resultText = oriText;
            tagIndices = getSortedTagIndices(oriText);
            brTagIndices = getSortedBRTagIndices(tempText);   
        }
        if(!tagIndices.length) {
            return tempText;
        } else if(!brTagIndices.length) {
            return resolveSingleLineText(oriText, tagIndices);  ///Todo sanitise this to include end tags and check for br from user
        } else {
            resultText = mergeTags(oriText, tempText);
            resultText = resolveTags(resultText);
        }
        return resultText;
    
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
SmartLabelManager.prototype._calCharDimWithCache = function (text = '', calculateDifference, length) {
    if (!this._init) {
        return false;
    }

    var size,
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

        cache = this._advancedCache = this._advancedCache || (this._advancedCache = {});
        advancedCacheKey = this._advancedCacheKey || (this._advancedCacheKey = []);
        cacheName = text + style.fontSize + style.fontFamily + style.fontWeight + style.fontStyle;
        cacheInitName = text + 'init' + style.fontSize + style.fontFamily +
           style.fontWeight + style.fontStyle;

    if (!this.ctx && htmlSplCharSpace[text]) {
        text = htmlSplCharSpace[text];
    }

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
        return {
            width: cachedStyle.width,
            height: cachedStyle.height
        };
    }

    size = this._getDimention(text);
    size.width += asymmetricDifference;

    cache[cacheName] = {
        width: size.width,
        height: size.height
    };
    advancedCacheKey.push(cacheName);
    if (advancedCacheKey.length > maxAdvancedCacheLimit) {
        delete cache[advancedCacheKey.shift()];
    }

    return size;
};

SmartLabelManager.prototype._getDimention = function (text) {
    if (this.requireDiv || !this.ctx) {
        return slLib._getDimentionUsingDiv(text, this);
    } else {
        return slLib._getDimentionUsingCanvas(text, this);
    }
};
// Provide function to calculate the height and width based on the environment and available support from dom.
SmartLabelManager.prototype._getWidthFn = function () {
    var sl = this,
        contObj = sl._containerObj,
        svgText = contObj.svgText;

    if (svgText) {
        return function (str) {
            var bbox,
                width;

            svgText.textContent = str;
            bbox = svgText.getBBox();
            width = (bbox.width - SVG_BBOX_CORRECTION);
            if (width < 1) {
                width = bbox.width;
            }

            return width;
        };
    } else {
        return function (str) {
            if (sl.requireDiv || !sl.ctx) {
                return slLib._getDimentionUsingDiv(str, sl).width;
            } else {
                return slLib._getDimentionUsingCanvas(str, sl).width;
            }
        };
    }
};

/**
 * Checks if two style object contains the same properties from the following list
 * - font-size
 * - font-family
 * - font-style
 * - font-weight
 * - font-variant
 */
SmartLabelManager.prototype._isSameStyle = function () {
    var sl = this,
        oldStyle = sl.oldStyle || {},
        style = sl.style;

    if (
        (style.fontSize !== oldStyle.fontSize) ||
        (style.fontFamily !== oldStyle.fontFamily) ||
        (style.fontStyle !== oldStyle.fontStyle) ||
        (style.fontWeight !== oldStyle.fontWeight) ||
        (style.fontVariant !== oldStyle.fontVariant)
    ) {
        return false;
    }
    return true;
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
    if (this._isSameStyle()) {
        return;
    }

    var sl = this,
        style = sl.style,
        hashString,
        sCont,
        fontStyle = style.fontStyle,
        fontVariant = style.fontVariant,
        fontWeight = style.fontWeight,
        fontSize = style.fontSize,
        fontFamily = style.fontFamily;

    fontSize += fontSize.indexOf('px') === -1 ? 'px' : '';
    hashString = fontStyle + ' ' + fontVariant + ' ' + fontWeight + ' ' + fontSize + ' ' + fontFamily;

    sl.ctx.font = hashString;
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
    sCont.ellipsesWidth = sl._calCharDimWithCache('...', false).width;
    sCont.dotWidth = sl._calCharDimWithCache('.', false).width;
    sCont.lineHeight = this._lineHeight = sCont.lineHeight || slLib._getCleanHeight(style.lineHeight);
    this.oldStyle = style;
};

SmartLabelManager.prototype._setStyleOfDiv = function () {
    var sCont,
        style = this.style;

    this._containerObj = sCont = this._containerManager.get(style);
    if (!sCont.node) {
        this._containerManager._makeDivNode(this._containerObj);
    }

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

SmartLabelManager.prototype._updateStyle = function () {
    return (this.requireDiv || !this.ctx) ? this._setStyleOfDiv() : this._setStyleOfCanvas();
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
    this.style = slLib.parseStyle(style);
    slLib.setLineHeight(this.style);

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
SmartLabelManager.prototype.getSmartText = function (text, maxWidth, maxHeight, noWrap, options = {}) {
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
        resolvedText = '',
        i = 0,
        originalText,
        ellipsesStr = (this._showNoEllipses ? '' : '...'),
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
        fastTrim = function (str) {
            str = str.replace(/^\s\s*/, '');
            var ws = /\s/, i = str.length;
            while (ws.test(str.charAt(i -= 1))) { /* jshint noempty:false */ }
            return str.slice(0, i + 1);
        },
        smartLabel = {
            text : text,
            maxWidth : maxWidth,
            maxHeight : maxHeight,
            width : null,
            height : null,
            oriTextWidth : null,
            oriTextHeight : null,
            oriText : text,
            isTruncated : false
        };

    hasHTMLTag = options.hasHTMLTag !== undefined ? options.hasHTMLTag : (slLib.xmlTagRegEx.test(text) || slLib.nbspRegex.test(text));
    hasOnlyBrTag = slLib._hasOnlyBRTag(text);

    this.requireDiv = (hasHTMLTag && !hasOnlyBrTag);
    this._updateStyle();

    lineHeight = this._lineHeight;
    context = this._context;
    container = this._container;
    sCont = this._containerObj;
    ellipsesWidth = sCont.ellipsesWidth;
    dotWidth = sCont.dotWidth;

    toolText = text.replace(slLib.spanAdditionRegx, '$2');
    getWidth = this._getWidthFn();

    // In some browsers, offsetheight of a single-line text is getting little (1 px) heigher value of the
    // lineheight. As a result, smartLabel is unable to return single-line text.
    // To fix this, increase the maxHeight a little amount. Hence maxHeight =  lineHeight * 1.2
    /**
     * For canvas lineHeight is directly used. In some cases, lineHeight can be 0.x pixels greater than
     * maxHeight. Previously, div was used to calculate lineHeight and it used to return a rounded number.
     *
     * Adding a buffer of 1px, maxheight will be increased by a factor of 1.2 only when
     * 0 <= (lineHeight - maxHeight) <= 1
     */
    if ((lineHeight - maxHeight <= 1) && (lineHeight - maxHeight >= 0)) {
        maxHeight *= 1.2;
    }

    if (canvas || container) {
        if (!documentSupport.isBrowserLess) {
            
            if (options.cleanText !== true) {
                tmpText = text = text.replace(slLib.ltgtquotRegex, function (match) {
                    switch(match){
                        case '&lt;':
                            return '<';
                        case '&gt;':
                            return '>';
                        case '&quot;':
                            return '"';
                        case '&#034;':
                            return '"';
                        case '&#039;':
                            return '\'';
                    }
                });
                originalText = text;
                tmpText = text = tmpText.replace(/<u>/g,'')
                    .replace(/<\/u>/g, '')
                    .replace(/<b>/g,'')
                    .replace(/<\/b>/g, '')
                    .replace(/<strong>/g,'')
                    .replace(/<\/strong>/g, '')
                    .replace(/<em>/g,'')
                    .replace(/<\/em>/g, '')
                    .replace(/<i>/g,'')
                    .replace(/<\/i>/g, '')
                    .replace(/<strike>/g,'')
                    .replace(/<\/strike>/g, '')
                    .replace(/<s>/g,'')
                    .replace(/<\/s>/g, '')
                    .replace(/<del>/g,'')
                    .replace(/<\/del>/g, '')
                    .replace(/<sub>/g,'')
                    .replace(/<\/sub>/g, '')
                    .replace(/<sup>/g,'')
                    .replace(/<\/sup>/g, '')
                    .replace(/<a[\s]+([^>]+)>/g, '')
                    .replace(/<\/a>/g, '')
                    .replace(/<abbr[\s]+([^>]+)>/g, '')
                    .replace(/<\/abbr>/g, '')
                    .replace(/<span[\s]+([^>]+)>/g, '')
                    .replace(/<\/span>/g, '');
            } else {
                tmpText = text;
                originalText = text;
            }
            
            if (!hasHTMLTag) {
                // Due to support of <,>, ", ' for xml we convert &lt;, &gt;, &quot;, &#034;, &#039; to <, >, ", ", ' respectively so to get the correct
                // width it is required to convert the same before calculation for the new improve version of the
                // get text width.
                tmpText = text;
                if (options.cleanText !== true) {
                    tmpText = text = text.replace(slLib.ltgtquotRegex, function (match) {
                        switch(match){
                            case '&lt;':
                                return '<';
                            case '&gt;':
                                return '>';
                            case '&quot;':
                                return '"';
                            case '&#034;':
                                return '"';
                            case '&#039;':
                                return '\'';
                        }
                    });
    
                    tmpText = text = tmpText.replace(/<u>/g,'')
                    .replace(/<\/u>/g, '')
                    .replace(/<b>/g,'')
                    .replace(/<\/b>/g, '')
                    .replace(/<strong>/g,'')
                    .replace(/<\/strong>/g, '')
                    .replace(/<em>/g,'')
                    .replace(/<\/em>/g, '')
                    .replace(/<i>/g,'')
                    .replace(/<\/i>/g, '')
                    .replace(/<strike>/g,'')
                    .replace(/<\/strike>/g, '')
                    .replace(/<s>/g,'')
                    .replace(/<\/s>/g, '')
                    .replace(/<del>/g,'')
                    .replace(/<\/del>/g, '')
                    .replace(/<sub>/g,'')
                    .replace(/<\/sub>/g, '')
                    .replace(/<sup>/g,'')
                    .replace(/<\/sup>/g, '')
                    .replace(/<a[\s]+([^>]+)>/g, '')
                    .replace(/<\/a>/g, '')
                    .replace(/<abbr[\s]+([^>]+)>/g, '')
                    .replace(/<\/abbr>/g, '')
                    .replace(/<span[\s]+([^>]+)>/g, '')
                    .replace(/<\/span>/g, '');
                }
                

                getOriSizeImproveObj = this.getSize(tmpText, true, {
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
                resolvedText = doMergeTextWithTags(originalText, text);
                smartLabel.text = resolvedText;
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
        maxWidthWithEll = this._showNoEllipses ? maxWidth : (maxWidth - ellipsesWidth);

        // Checks if any html tag is present. This if block is executed for all normal texts and
        // all texts containing only <br /> tag.
        if (!hasHTMLTag || hasOnlyBrTag) {
            // Gets splitted array
            oriTextArr = slLib._getTextArray(text);
            //oriTextArr = slLib._getTextArray(tmpText);
            len = oriTextArr.length;
            trimStr = '';
            tempArr = [];
            tempChar = oriTextArr[0];

            if (this._cache[tempChar]) {
                minWidth = this._cache[tempChar].width;
            }
            else {
                minWidth = getWidth(tempChar);
                this._cache[tempChar] = { width: minWidth };
            }

            if (maxWidthWithEll > minWidth && !hasOnlyBrTag) {
                tempArr = text.substr(0, slLib.getNearestBreakIndex(text, maxWidthWithEll, this)).split('');
                //tempArr = tmpText.substr(0, slLib.getNearestBreakIndex(tmpText, maxWidthWithEll, this)).split('')
            }
            else if (minWidth > maxWidth) {
                smartLabel.text = '';
                smartLabel.width = smartLabel.oriTextWidth =
                    smartLabel.height = smartLabel.oriTextHeight = 0;
                return smartLabel;
            }
            else if (ellipsesStr) {
                maxWidthWithEll = maxWidth - (2 * dotWidth);
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
                    }
                    else {
                        if (!getOriSizeImproveObj || !(minWidth =
                            getOriSizeImproveObj.detailObj[tempChar])) {
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
							smartLabel.isTruncated = true;
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
                        maxStrWidth = max(maxStrWidth, strWidth);
                        strHeight += this._lineHeight;
                        if (strHeight <= maxHeight) {
                            // If the totalHeight is less than allowed height, continue.
                            lastIndexBroken = i;
                            strWidth = 0;
                            trimStr = null;
                            continue;
                        } else if (strHeight > maxHeight) {
                            // Else return by truncating the text and attaching ellipses.
                            trimStr = tempArr.slice(0, -1).join('');
                            smartLabel.text = fastTrim(trimStr) + ellipsesStr;
                            smartLabel.tooltext = toolText;
                            smartLabel.width = maxStrWidth;
							smartLabel.height = strHeight - this._lineHeight;
							smartLabel.isTruncated = true;
                            return smartLabel;
                        }
                    }

                    if (this._cache[tempChar]) {
                        minWidth = this._cache[tempChar].width;
                    }
                    else {
                        if (!getOriSizeImproveObj || !(minWidth =
                            getOriSizeImproveObj.detailObj[tempChar])) {
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
                            // do not perform any line break operation if next character is a break tag
                            if (oriTextArr[i + 1] === '<br />') {
                                continue;
                            }
                            /** @todo use regular expressions for better performance. */
                            lastSpace = slLib._findLastIndex(oriTextArr.slice(0, tempArr.length), ' ');
                            lastDash = slLib._findLastIndex(oriTextArr.slice(0, tempArr.length), '-');
                            if (lastSpace > lastIndexBroken) {
                                strWidth = getWidth(tempArr.slice(lastIndexBroken + 1, lastSpace).join(''));
                                tempArr.splice(lastSpace, 1, '<br />');
                                lastIndexBroken = lastSpace;
                                newCharIndex = lastSpace + 1;
                            } else if (lastDash > lastIndexBroken) {
                                if (lastDash === tempArr.length - 1) {
                                    strWidth =
                                        getWidth(tempArr.slice(lastIndexBroken + 1, lastSpace).join(''));
                                    tempArr.splice(lastDash, 1, '<br />-');
                                } else {
                                    strWidth =
                                        getWidth(tempArr.slice(lastIndexBroken + 1, lastSpace).join(''));
                                    tempArr.splice(lastDash, 1, '-<br />');
                                }
                                lastIndexBroken = lastDash;
                                newCharIndex = lastDash + 1;
                            } else {
                                tempArr.splice((tempArr.length - 1), 1, '<br />' + oriTextArr[i]);
                                lastLineBreak = tempArr.length - 2;
                                strWidth = getWidth(tempArr.slice(lastIndexBroken + 1,
                                    lastLineBreak + 1).join(''));
                                lastIndexBroken = lastLineBreak;
                                newCharIndex = i;
                            }
                            strHeight += this._lineHeight;
                            if (strHeight > maxHeight) {
                                smartLabel.text = fastTrim(trimStr) + ellipsesStr;
                                smartLabel.tooltext = smartLabel.oriText;
                                // The max width among all the lines will be the width of the string.
                                smartLabel.width = maxWidth;
								smartLabel.height = (strHeight - this._lineHeight);
								smartLabel.isTruncated = true;
                                return smartLabel;
                            } else {
                                maxStrWidth = max(maxStrWidth, strWidth);
                                trimStr = null;
                                if (!hasOnlyBrTag) {
                                    nearestChar =
                                    slLib.getNearestBreakIndex(text.substr(newCharIndex), maxWidthWithEll, this);
                                    strWidth = getWidth(text.substr(newCharIndex, nearestChar || 1));
                                    if (tempArr.length < newCharIndex + nearestChar) {
                                        tempArr = tempArr.concat(
                                            text.substr(
                                                tempArr.length,
                                                newCharIndex + nearestChar - tempArr.length
                                            ).split('')
                                        );
                                        i = tempArr.length - 1;
                                    }
                                } else {
                                    // take the width already taken in the new line.
                                    strWidth = slLib._getDimentionOfMultiLineText(tempArr.slice(lastIndexBroken + 1).join(''), this).width;
                                }
                            }
                        }
                    }
                }

                maxStrWidth = max(maxStrWidth, strWidth);
                resolvedText = doMergeTextWithTags(originalText, tempArr.join(''));
                smartLabel.text = resolvedText;
                smartLabel.width = maxStrWidth;
                smartLabel.height = strHeight;
                return smartLabel;
            }
        }
        else {
            toolText = text.replace(slLib.spanAdditionRegx, '$2');
            text = text.replace(slLib.spanAdditionRegx, slLib.spanAdditionReplacer);
            text = text.replace(
                /(<br\s*\/*\>)/g,
                '<span class="' + [slLib.classNameWithTag, ' ', slLib.classNameWithTagBR].join('') + '">$1</span>'
            );

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
                        } else if ( chr === '-') {
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
            // if character array is not generated
            minWidth = len && characterArr[0].elem.offsetWidth;
            if (minWidth > maxWidth || !len) {
                smartLabel.text = '';
                smartLabel.width = smartLabel.oriTextWidth = smartLabel.height = smartLabel.oriTextHeight = 0;

                return smartLabel;
            } else if (minWidth > maxWidthWithEll && !this._showNoEllipses) {

                maxWidthWithEll = maxWidth - (2 * dotWidth);
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
                    elemRightMostPoint = (elem.offsetLeft - initialLeft) + elem.offsetWidth;

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
                    elemRightMostPoint = (elem.offsetLeft - initialLeft) + elem.offsetWidth;

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
                                if (lastDash === i) { // in case the overflowing character itself is the '-'
                                    characterArr[lastDash].elem.innerHTML = '<br/>-';
                                } else {
                                    characterArr[lastDash].elem.innerHTML = '-<br/>';
                                }
                                lastIndexBroken = lastDash;
                            } else {
                                elem.parentNode.insertBefore(lastBR = doc.createElement('br'), elem);
                            }

                            //check whether this break made current element outside the area height
                            if ((elem.offsetHeight + elem.offsetTop) > maxHeight) {
                                //remove the lastly inserted line break
                                if (lastBR) {
                                    lastBR.parentNode.removeChild(lastBR);
                                }
                                else if (lastIndexBroken === lastDash) {
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
                removeFromIndexForEllipses = removeFromIndexForEllipses ?
                removeFromIndexForEllipses : removeFromIndex;

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

            //smartLabel.text = doMergeTextWithTags(originalText, smartLabel.text);
            if (smartLabel.isTruncated) {
                smartLabel.text += ellipsesStr;
                smartLabel.tooltext = toolText;
            }
        }

        smartLabel.height = container.offsetHeight;
        smartLabel.width = container.offsetWidth;

        return smartLabel;
    }
    else {
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
SmartLabelManager.prototype.getSize = function (text = '', detailedCalculationFlag = true, config = {}) {
    if (!this._init) {
        return false;
    }

    if (text === undefined || text === null) {
        text = '';
    } else if (typeof text !== 'string') {
        text = text.toString();
    }

    var textArr,
        letter,
        lSize,
        i,
        l,
        cumulativeSize = 0,
        height = 0,
        container,
        indiSizeStore = { },
        hasHTMLTag = config.hasHTMLTag,
        hasOnlyBrTag = config.hasOnlyBrTag;

    if (typeof hasHTMLTag === 'undefined') {
        hasHTMLTag = slLib.xmlTagRegEx.test(text) || slLib.nbspRegex.test(text);
    }
    if (typeof hasOnlyBrTag === 'undefined') {
        hasOnlyBrTag = slLib._hasOnlyBRTag(text);
    }

    this.requireDiv = (hasHTMLTag && !hasOnlyBrTag);
    if (!config.cleanText) {
        text = text.replace(slLib.ltgtquotRegex, function (match) {
            switch(match){
                case '&lt;':
                    return '<';
                case '&gt;':
                    return '>';
                case '&quot;':
                    return '"';
                case '&#034;':
                    return '"';
                case '&#039;':
                    return '\'';
            }
        });
        text = text.replace(/<u>/g,'')
                .replace(/<\/u>/g, '')
                .replace(/<b>/g,'')
                .replace(/<\/b>/g, '')
                .replace(/<strong>/g,'')
                .replace(/<\/strong>/g, '')
                .replace(/<em>/g,'')
                .replace(/<\/em>/g, '')
                .replace(/<i>/g,'')
                .replace(/<\/i>/g, '')
                .replace(/<strike>/g,'')
                .replace(/<\/strike>/g, '')
                .replace(/<s>/g,'')
                .replace(/<\/s>/g, '')
                .replace(/<del>/g,'')
                .replace(/<\/del>/g, '')
                .replace(/<sub>/g,'')
                .replace(/<\/sub>/g, '')
                .replace(/<sup>/g,'')
                .replace(/<\/sup>/g, '')
                .replace(/<a[\s]+([^>]+)>/g, '')
                .replace(/<\/a>/g, '')
                .replace(/<abbr[\s]+([^>]+)>/g, '')
                .replace(/<\/abbr>/g, '')
                .replace(/<span[\s]+([^>]+)>/g, '')
                .replace(/<\/span>/g, '');
    }
    this._updateStyle();
    container = this._container;

    // When text is normal text
    if (!detailedCalculationFlag) {
        return this._calCharDimWithCache(text);
    } else {
        // Calculate the width of every letter with an approximation
        textArr = text.split('');
        for (i = 0, l = textArr.length; i < l; i++) {
            letter = textArr[i];
            lSize = this._calCharDimWithCache(letter, false, textArr.length);
            height = max(height, lSize.height);
            cumulativeSize += lSize.width;
            indiSizeStore[letter] = lSize.width;
        }
    }
    // If text has br tag, return the width and height with proper calculations
    if (hasOnlyBrTag) {
        return {
            ...slLib._getDimentionOfMultiLineText(text, this),
            detailObj: indiSizeStore
        };
    }

    // text contains html tags other than br
    if (hasHTMLTag) {
        container.innerHTML = text;
        return {
            width: container.offsetWidth,
            height: container.offsetHeight,
            detailObj: indiSizeStore
        };
    }

    return {
        width: round(cumulativeSize),
        height: height,
        detailObj: indiSizeStore
    };
};

/**
 * getOriSize API will eventually be deprecated and will be renamed to getSize API. For the next two versions,
 * both getOriSize and getSize API will be supported.
 */
SmartLabelManager.prototype.getOriSize = function (text = '', detailedCalculationFlag = true, config = {}) {
    return this.getSize(text, detailedCalculationFlag, config);
};
/*
 * Dispose the container and object allocated by the smartlabel
 */
SmartLabelManager.prototype.dispose = function () {
    if (!this._init) {
        return this;
    }

    if (this._containerManager && this._containerManager.dispose) {
        this._containerManager.dispose();
    }

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

export default SmartLabelManager;
