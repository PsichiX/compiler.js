/**
 * Preprocess and compile JavaScript file.
 *
 * @param {Object|String} config configuration JSON object or configuration file path.
 * @param {Boolean} config.verbose determines if program should print not only errors.
 * @param {String} config.entry entry file path.
 * @param {String} config.intermediate intermediate file path.
 * @param {String} config.output output file path.
 * @param {String} config.basedir base directory path (for included files).
 * @param {Object} config.defines map of definitions: {NAME: value}.
 * @param {Object} config.lint determines if lint will be used.
 * @param {Object} config.minify determines if minify will be used.
 * @param {Function|null} callback function called when compilation is complete.
 */
exports.compile = function(config, callback){

	var version          = '1.1.3',
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
		    },
		    writeSync: function(options, blob, done){
			    fs.writeFileSync(options, blob.result);
			    done(null, blob);
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

	callback = callback || function(){
		};

	// process config.
	if (config){
		if (typeof config === 'string'){
			config = exports.readConfigFile(config);
		}
		config.verbose && (verbose = config.verbose);
		config.entry && (entryFile = config.entry);
		config.intermediate && (intermediateFile = config.intermediate);
		config.output && (distributionFile = config.output);
		config.basedir && (baseDir = config.basedir);
		if (config.defines){
			var defs = config.defines,
			    key;
			for (key in defs){
				if (defs.hasOwnProperty(key)){
					defines[key] = defs[key];
				}
			}
		}
		config.lint && (lint = config.lint);
		config.minify && (minify = config.minify);
	}

	// configuration validation.
	if (!entryFile){
		throw 'Entry file is not specified!';
	}
	if (!fs.existsSync(entryFile)){
		throw 'Entry file does not exists: ' + entryFile;
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
	verbose && q.log('Compiler.js v' + version);
	verbose && q.log('>>> Configuration:');
	verbose && q.log('entry: ' + entryFile);
	verbose && intermediateFile && q.log('intermediate: ' + intermediateFile);
	verbose && q.log('output: ' + distributionFile);
	verbose && q.log('basedir: ' + baseDir);
	verbose && q.log('lint: ' + lint);
	verbose && q.log('minify: ' + minify);
	verbose && q.log('defines: ' + JSON.stringify(defines, null, '  '));
	q.read(entryFile);
	q.preprocess({
		basedir: baseDir,
		defines: defines
	});
	intermediateFile && q.writeSync(intermediateFile);
	lint && q.jslint();
	minify && q.jsminify();
	q.writeSync(distributionFile);
	verbose && q.log('>>> Performing compilation...');
	q.run(function(){
		verbose && console.log('>>> Done!');
		callback();
	});

};

exports.readConfigFile = function(path){

	var fs      = require('fs'),
	    content = fs.readFileSync(path);
	if (content){
		var data = JSON.parse(content);
		if (data && data.inherits && typeof data.inherits === 'string'){
			var inherits = exports.readConfigFile(data.inherits),
			    key;
			for (key in data){
				if (data.hasOwnProperty(key)){
					inherits[key] = data[key];
				}
			}
			return inherits;
		}
		return data;
	}
	return null;

};
