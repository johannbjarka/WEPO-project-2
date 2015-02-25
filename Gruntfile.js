module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.initConfig({

    // get the configuration info from package.json ----------------------------
    // this way we can use things like name and version (pkg.name)
    //pkg: grunt.file.readJSON('package.json'),

    jshint: {
      src: ['Client/js/*.js'],
      options: {
        curly:  true,
        immed:  true,
        newcap: true,
        noarg:  true,
        sub:    true,
        boss:   true,
        eqnull: true,
        node:   true,
        undef:  true,
        devel:  true,
        globals: {
          _:       false,
          jQuery:  false,
          angular: false,
          moment:  false,
          console: false,
          $:       false,
          io:      false
        }
       }

      // when this task is run, lint the Gruntfile and all js files in src
      //build: ['Gruntfile.js', 'src/**/*.js']
    }

  });

  // ===========================================================================
  // LOAD GRUNT PLUGINS ========================================================
  // ===========================================================================
  // we can only load these if they are in our package.json
  // make sure you have run npm install so our app can find these
  //grunt.loadNpmTasks('grunt-contrib-uglify');
};
