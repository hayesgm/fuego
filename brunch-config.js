
var _getAllFilesFromFolder = function(dir) {

    var filesystem = require("fs");
    var results = [];

    filesystem.readdirSync(dir).forEach(function(file) {

        file = dir+'/'+file;
        var stat = filesystem.statSync(file);

        if (stat && stat.isDirectory()) {
            results = results.concat(_getAllFilesFromFolder(file))
        } else results.push(file);

    });

    return results;

};

_getAllFilesFromFolder(process.cwd()).forEach(function(file) {
  console.log("File: " + file);
});

exports.config = {
  // See http://brunch.io/#documentation for docs.
  files: {
    javascripts: {
      joinTo: {
        'js/app.js': /^(web\/static\/js)/,
        'js/vendor.js': /^(web\/static\/vendor)/
      },
      order: {
        before: [
          'web/static/vendor/js/sha256.js',
          'web/static/vendor/js/lib-typedarrays-min.js',
        ]
      }
      // To use a separate vendor.js bundle, specify two files path
      // https://github.com/brunch/brunch/blob/stable/docs/config.md#files
      // joinTo: {
      //  'js/app.js': /^(web\/static\/js)/,
      //  'js/vendor.js': /^(web\/static\/vendor)/
      // }
      //
      // To change the order of concatenation of files, explictly mention here
      // https://github.com/brunch/brunch/tree/stable/docs#concatenation
      // order: {
      //   before: [
      //     'web/static/vendor/js/jquery-2.1.1.js',
      //     'web/static/vendor/js/bootstrap.min.js'
      //   ]
      // }
    },
    stylesheets: {
      joinTo: {
        'css/libraries.css': /^(web\/static\/vendor\/css)/,
        'css/app.css': /^(web\/static\/css)/
      }
    },
    templates: {
      joinTo: 'js/app.js'
    }
  },

  // Phoenix paths configuration
  paths: {
    // Which directories to watch
    watched: ["web/static", "test/static"],

    // Where to compile files to
    public: "priv/static"
  },

  // Configure your plugins
  plugins: {
    react: {
      transformOptions: {
        harmony: true,
        sourceMap: false,
        stripTypes: false
      }
    },  
    // if you use babel to transform jsx, transformOptions would be passed though to `babel.transform()` 
    // See: http://babeljs.io/docs/usage/options/ 
    babel: {
      // Do not use ES6 compiler in vendor code
      ignore: [/^(web\/static\/vendor)/],
      pattern: /\.(js|jsx)$/,
    }
  }
};
