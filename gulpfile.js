var gulp = require('gulp'),
	initGulpTasks = require('react-component-gulp-tasks'),

	taskConfig = {

	component: {
		name: 'SmartlabelManager',
		lib: 'lib'
	},

	example: {
		src: 'example/src',
		dist: 'example/dist',
		files: [
			'index.html',
			'.gitignore'
		],
		scripts: [
			'example.js'
		],
		less: [
			'example.less'
		]
	}

};

initGulpTasks(gulp, taskConfig);
