module.exports = function (config) {

  config.set({

    basePath: '',

    frameworks: ['mocha', 'chai', 'sinon'],

    reporters: ['mocha'],

    files: [
      'test/index.js'
    ],

    port: 9876,
    colors: true,
    autoWatch: true,
    singleRun: false,

    logLevel: config.LOG_INFO,

    browsers: ['Chrome'],

    preprocessors: {
      'test/index.js': ['webpack']
    },

    webpack: {
      devtool: 'cheap-module-source-map',
      entry: './test/index.js',
      module: {
        loaders: [{ test: /\.js$/, loader: 'babel', exclude: /node_modules/ }]
      }
    },

    webpackServer: {
      noInfo: true
    }

  });
};
