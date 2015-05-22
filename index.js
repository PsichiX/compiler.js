/**
 * Preprocess and compile JavaScript file.
 *
 * @param {Object} config configuration.
 * @param {String} config.entry entry file path.
 * @param {String} config.intermediate intermediate file path.
 * @param {String} config.output output file path.
 * @param {String} config.basedir base directory path (for included files).
 * @param {Object} config.defines map of definitions: {NAME: value}.
 * @param {Object} config.lint determines if lint will be used.
 * @param {Object} config.minify determines if minify will be used.
 */
exports.compile = function(config){

	var version          = '1.0.0',
	    fs               = require('fs'),
	    gear             = require('gear'),
	    preprocessor     = require('preprocessor'),
	    // gear module custom tasks.
	    tasks            = {
		    preprocess: function(options, blob, done){
			    var result = new preprocessor(
				    blob.result,
				    options && options.basedir ? options.basedir : '.'
			    ).process(
				    options && options.defines ? options.defines : {}
			    );
			    done(null, new gear.Blob(result));
		    }
	    },
	    // register tasks.
	    registry         = new gear.Registry({
		    module: 'gear-lib',
		    tasks: tasks
	    }),
	    // configuration data.
	    verbose          = false,
	    entryFile        = 'entry.js',
	    intermediateFile = null,
	    distributionFile = null,
	    baseDir          = './',
	    defines          = {},
	    lint             = false,
	    minify           = false;


	// process config.
	if (config){
		'verbose' in config && (verbose = config.verbose);
		'entry' in config && (entryFile = config.entry);
		'intermediate' in config && (intermediateFile = config.intermediate);
		'output' in config && (distributionFile = config.output);
		'basedir' in config && (baseDir = config.basedir);
		if ('defines' in config){
			var defs = config.defines,
			    key;
			for (key in defs){
				if (defs.hasOwnProperty(key)){
					defines[key] = defs[key];
				}
			}
		}
		'lint' in config && (lint = config.lint);
		'minify' in config && (minify = config.minify);
	}

	// configuration validation.
	if (!entryFile){
		throw 'Entry file is not specified!';
	}
	if (!fs.existsSync(entryFile)){
		throw 'Entry file does not exists: ' + entryFile;
	}
	if (!intermediateFile){
		intermediateFile = entryFile.substring(-3) === '.js'
			? entryFile.substring(0, -3) + 'intermediate.js'
			: entryFile + '.intermediate';
	}
	if (!distributionFile){
		distributionFile = entryFile.substring(-3) === '.js'
			? entryFile.substring(0, -3) + 'distribution.js'
			: entryFile + '.distribution';
	}
	if (!baseDir){
		baseDir = './';
	}

	// execute tasks.
	var q = new gear.Queue({registry: registry});
	q.log('JS compiler v' + version);
	verbose && q.log('>>> Configuration:');
	verbose && q.log('entry: ' + entryFile);
	verbose && q.log('intermediate: ' + intermediateFile);
	verbose && q.log('output: ' + distributionFile);
	verbose && q.log('basedir: ' + baseDir);
	verbose && q.log('lint: ' + lint);
	verbose && q.log('minify: ' + minify);
	verbose && q.log('defines: ' + JSON.stringify(defines, null, '  '));
	verbose && q.log('>>> Preprocess entry file into intermediate file');
	q.read(entryFile);
	q.preprocess({
		basedir: baseDir,
		defines: defines
	});
	q.write(intermediateFile);
	verbose && q.log('>>> Compile intermediate file into distribution file');
	lint && q.jslint();
	minify && q.jsminify();
	q.write(distributionFile);
	q.log('Done!');
	q.run();

};