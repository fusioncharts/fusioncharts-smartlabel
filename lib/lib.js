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