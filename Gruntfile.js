module.exports = function(grunt) {

  grunt.initConfig({

    jshint: {
      src: ['client/js/*.js'],
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
    },

    concat: {
      options: {
        separator: ';',
      },
      dist: {
        src: ['client/js/*.js'],
        dest: 'client/dist/built.js',
      },
    },

    uglify: {
      my_target: {
        files: {
          'client/dist/built.min.js': ['cLient/dist/built.js']
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask( 'default', [ 'jshint', 'concat', 'uglify' ] );
};

