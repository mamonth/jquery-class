/*jshint node: true */

'use strict';

module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        jasmine_node: {
            options: {
                forceExit: true,
                match: '.',
                matchall: false,
                extensions: 'js',
                specNameMatcher: 'test',
                jUnit: {
                    report: true,
                    savePath : "./build/reports/jasmine/",
                    useDotNotation: true,
                    consolidate: true
                }
            },
            all: ['test/']
        },
        watch: {
            files: [
                'src/jquery.class.js',
                'test/jquery.class.test.js'
            ],
            tasks: 'test'
        },
        uglify: {
            options:{
                sourceMap: true,
                preserveComments: 'some'
            },
            main_target: {
                files: {
                    'dist/jquery.class.min.js': ['src/jquery.class.js']
                }
            }
        }

    });

    grunt.loadNpmTasks('grunt-jasmine-node-new');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('test', ['jasmine_node']);

    grunt.registerTask('default', ['test', 'uglify'] );
};
