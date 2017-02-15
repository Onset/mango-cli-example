const toolbox = require('../node_modules/sw-toolbox/sw-toolbox.js') // require('sw-toolbox') has some problems with missing modules

const STATIC_PRECACHE = [
	'styles/' + BUILDSTAMP + 'index.css',
	'https://ajax.googleapis.com/ajax/libs/jquery/2.2.0/jquery.min.js',
	'scripts/' + BUILDSTAMP + 'index.js',
	'sprites/shapes.svg',
]

toolbox.options.debug = DEBUG
toolbox.options.networkTimeoutSeconds = 5
toolbox.options.cache.maxEntries = 100

toolbox.precache([
	'.', // Index page
].concat(STATIC_PRECACHE))

STATIC_PRECACHE.forEach((url) => {
	toolbox.router.get(url, toolbox.cacheOnly)
})


toolbox.router.default = toolbox.networkFirst
