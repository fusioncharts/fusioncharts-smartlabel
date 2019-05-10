const path = require('path');

let libraryName = 'SmartLabel',
	fileName = 'fusioncharts-smartlabel',
	mode = process.argv[2].slice(2);

if (mode === 'prod') {
	fileName += '.min.js';
	mode = 'production';
} else {
	fileName += '.js';
	mode = 'development';
}

module.exports = {
	entry: './src/SmartlabelManager.js',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: fileName,
        library: libraryName,
        libraryExport: 'default',
        libraryTarget: 'umd'
	},
	module: {
		rules: [{
			test: /\.js$/,
			loader: 'babel-loader',
			query: {
				presets: ['@babel/preset-env']
			}
		}]
	},
	mode
};
