var lib = {
	init: function (win) {
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
			
			maxDefaultCacheLimit: 500,

			classNameReg: new RegExp('\b' + classNameWithTag + '\b'),
			
			classNameBrReg: new RegExp('\b' + classNameWithTagBR + '\b'),

			spanAdditionRegx: /(<[^<\>]+?\>)|(&(?:[a-z]+|#[0-9]+);|.)/ig,
			
			spanAdditionReplacer: '$1<span class="'+ classNameWithTag + '">$2</span>',

			spanRemovalRegx: new RegExp('\\<span[^\\>]+?'+ classNameWithTag +'[^\\>]{0,}\\>(.*?)\\<\\/span\\>', 'ig'),

			xmlTagRegEx: new RegExp('<[^>][^<]*[^>]+>', 'i'),

			brRegex: new RegExp('({br[ ]*})|(<br[ ]*>)|(<br[ ]*\/>)|(<br\\>)', 'g'),

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
			getDocumentSupport: function () {
				var childRetriverFn,
				    childRetriverString,
				    noClassTesting;

				if (doc.getElementsByClassName) {
				    childRetriverFn = 'getElementsByClassName';
				    childRetriverString = classNameWithTag;
				    noClassTesting = true;
				}
				else {
				    childRetriverFn = 'getElementsByTagName';
				    childRetriverString = 'span';
				    noClassTesting = false;
				}

				return {
				    isIE: /msie/i.test(userAgent) && !win.opera,
				    hasSVG: Boolean(win.SVGAngle || doc.implementation.hasFeature(
				        'http://www.w3.org/TR/SVG11/feature#BasicStructure', '1.1')),
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
			createContainer: function (containerParent) {
			    var body,
			        container;

			    if (containerParent && (containerParent.offsetWidth || containerParent.offsetHeight)) {
			        if (containerParent.appendChild) {
			            containerParent.appendChild(container = doc.createElement(DIV));
			            container.className = containerClass;
			            container.setAttribute('aria-hidden', 'true');
			            container.setAttribute('role', 'presentation');
			            return container;
			        }
			    }
			    else {
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
			getNearestBreakIndex: function  (text, maxWidth, sl) {
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
			        return (text.length - 1);
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
			setLineHeight: function  (styleObj) {
		        var fSize = styleObj.fontSize = (styleObj.fontSize || '12px');
		        styleObj.lineHeight = styleObj.lineHeight || styleObj['line-height'] || ((parseInt(fSize, 10) * 1.2) + 'px');
		        return styleObj;
			},

			/**
			 * Returns the clean height by removing 'px' if present.
			 */
			_getCleanHeight: function (height) {
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
			_getDimentionUsingDiv: function (text = '') {
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
			_getDimentionUsingCanvas: function (text = '') {
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
			_hasOnlyBRTag: function (input = '') {
				var i,
					len,
					text = input.replace(lib.brRegex, '<br />'),
					brTagArray = text.split('<br />'),
					brTagArrayLen = brTagArray.length,
					index = [];

				// Check for other tags
				for (i = 0; i < brTagArrayLen; i++) {
					if(lib.xmlTagRegEx.test(brTagArray[i])) {
						return;
					}
				}

				// Finds position of all br tag
				for (i = 0, len = text.length; i < len; i++) {
					if (text[i] === '<') {
						if (text.substr(i, Math.min(6, len - i)) === '<br />') {
							index.push(i);
						} else {
							return;
						}
					}
				}

				if (index.length === 0) {
					return;
				} else return index;
			},

			/**
			 * For a text containing <br /> it returns the height and width of the text
			 * 
			 */
			_getDimentionOfMultiLineText: function (text = '', sl) {
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
			_getTextArray: function (text = '') {
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
			_findLastIndex: function (array = [], item) {
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


export default lib;