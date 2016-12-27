# SmartLabel

SmartLabel is a component which can be used to measure and restrict text in svg / canvas where the layout engine does not automatically takes care of the text behaviours. 


## Concept

Live demo: [fusioncharts.github.io/fusioncharts-smartlabel](http://fusioncharts.github.io/fusioncharts-smartlabel/)

To build the examples locally, run:

```javascript
npm install
npm start
```

Then open [`localhost:8000`](http://localhost:8000) in a browser.


## Installation

The easiest way to use fusioncharts-smartlabel is to install it from NPM and include it in your own build process (using [Browserify](http://browserify.org), [Webpack](http://webpack.github.io/), etc).

You can also use the standalone build by including `dist/fusioncharts-smartlabel.js`

```javascript
npm install fusioncharts-smartlabel --save
```


## Usage

__Please see the concept above before proceeding__


SmartLabel is immensely useful when text needs to be drawn in SVG or Canvas. Since SVG / Canvas does not manage text it is necessary to have pre procressing on the text before having it rendered.

SmartLabel provides out of the box feature to
- Calculate the metrics (height and width) of text for any style
- If a bound box is provided it truncates the text
- Add ellipses if the text is truncated
- Wraps a label in the bound box

To require the SmartLabel
```javascript
var SmartLabelManager = require('fusioncharts-smartlabel');
```

To Create a new instance
```javascript
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
 *                              elements are to be attached. If not passed, it appends in body.
 *
 * @param {Boolean} useEllipses - This decides if a ellipses to be appended if the text is truncated.
 * @param {Object} options - Control options
 *                          {
 *                              maxCacheLimit: No of letter to be cached. Default: 500.
 *                          }
 * @constructor
 */
var slManager =  new SmartLabelManager(id, container, useEllipses, options)
```

To apply style before calculating text metrics
```javascript
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
slManager.setStyle(style);
```

Decide whether the text would have trailing ellipses if truncated
```javascript
/*
 * Decides whether ellipses to be shown if the node is truncated
 *
 * @param {Boolean} useEllipses - decides if a ellipses to be appended if the text is truncated. Default: false
 *
 * @return {SmartLabelManager} - Current instance of SmartLabelManager
 */
slManager.useEllipsesOnOverflow(useEllipses);
```

To get the text bounded by a bound box
```javascript
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
smartlabel = slManager.getSmartText(text, maxWidth, maxHeight, noWrap);
```

To get the size of a given text
```javascript
/*
 * Get the height and width of a text.
 *
 * @param {String} text - Text whose metrics to be measured
 * @param {Boolean} Optional detailedCalculationFlag - this flag if set it calculates per letter position
 *                          information and returns it. Ideally you dont need it unless you want to post process the
 *                          string. And its an EXPENSIVE OPERATION.
 *
 * @return {Object} - If detailedCalculationFlag is set to true the returned object would be
 *                  {``
 *                      height: height of the text
 *                      width: width of the text
 *                      detailObj: detail calculation of letters in the format {lettername: width}
 *                  }
 *                  If detailedCalculationFlag is set to false the returned object wont have the detailObj prop.
 */
size = slManager.getOriSize(text, detailedCalculationFlag);
```

To dispose the components
```javascript
/*
 * Dispose the container and object allocated by the smartlabel
 */
slManager.dispose();
```



## Development (`src`, `lib` and the build process)

**NOTE:** The source code for the component is in `src`. A transpiled CommonJS version (generated with Babel) is available in `lib` for use with node.js, browserify and webpack. A UMD bundle is also built to `dist`, which can be included without the need for any build system.


## License

__MIT__

Copyright (c) 2016 FusionCharts Technologies  &lt;support@fusioncharts.com&gt;.

