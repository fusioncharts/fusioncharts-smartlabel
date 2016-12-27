# SmartLabel

SmartLabel is a component which can be used to measure and restrict text in svg / canvas where the layout engine does not automatically takes care of the text behaviours. 


## Demo & Examples

Live demo: [fusioncharts.github.io/fusioncharts-smartlabel](http://fusioncharts.github.io/fusioncharts-smartlabel/)

To build the examples locally, run:

```
npm install
npm start
```

Then open [`localhost:8000`](http://localhost:8000) in a browser.


## Installation

The easiest way to use fusioncharts-smartlabel is to install it from NPM and include it in your own build process (using [Browserify](http://browserify.org), [Webpack](http://webpack.github.io/), etc).

You can also use the standalone build by including `dist/fusioncharts-smartlabel.js`

```
npm install fusioncharts-smartlabel --save
```


## Usage

__EXPLAIN USAGE HERE__

```
var SmartLabel = require('fusioncharts-smartlabel');

```

### Notes

__ADDITIONAL USAGE NOTES__


## Development (`src`, `lib` and the build process)

**NOTE:** The source code for the component is in `src`. A transpiled CommonJS version (generated with Babel) is available in `lib` for use with node.js, browserify and webpack. A UMD bundle is also built to `dist`, which can be included without the need for any build system.

To build, watch and serve the examples (which will also watch the component source), run `npm start`. If you just want to watch changes to `src` and rebuild `lib`, run `npm run watch` (this is useful if you are working with `npm link`).

## License

__MIT__

Copyright (c) 2016 FusionCharts Technologies  &lt;support@fusioncharts.com&gt;.

