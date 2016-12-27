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
      type : 'text'
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
