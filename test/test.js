var compiler = require('../index.js'),
    config   = {
	    verbose:      true,
	    entry:        'src/main.js',
	    intermediate: 'intermediate/app.js',
	    output:       'bin/app.js',
	    basedir:      'src/',
	    defines:      {
		    'DEBUG': true
	    },
	    lint:         true,
	    minify:       true
    };

compiler.compile(config);