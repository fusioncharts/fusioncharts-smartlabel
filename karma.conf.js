module.exports = function(config) {
  config.set({

    basePath: './',


    frameworks: ['mocha', 'chai'],


    files: [
      '_build/common.js',
      '_build/fusioncharts-smartlabel.js',  
      'test/**/*.js'
    ],


    exclude: [
      'test/**/*.swp',
      '**/*.swp'
    ],


    preprocessors: {
        '_build/fusioncharts-smartlabel.js': ['coverage']
    },

    coverageReporter: {
        dir: 'coverage/',
        reporters: [
            { type : 'text' },
            { type: 'html', subdir: 'report-html', file: 'report.html' },
            { type: 'lcov', subdir: 'report-lcov', file: 'report.txt' }
        ]
    },



    reporters: ['spec', 'coverage'],


    port: 9876,


    colors: true,


    logLevel: config.LOG_INFO,


    autoWatch: false,


    browsers: ['PhantomJS'],


    singleRun: true,

    concurrency: Infinity
  });
};
