const toolbox = require('../node_modules/sw-toolbox/sw-toolbox.js') // require('sw-toolbox') has some problems with missing modules
const imagesHandler = require('./scripts/utils/imagesHandler')
const idbKeyval = require('idb-keyval')

const STATIC_PRECACHE = [
	'styles/' + BUILDSTAMP + 'index.css',
	'https://ajax.googleapis.com/ajax/libs/jquery/2.2.0/jquery.min.js',
	'scripts/' + BUILDSTAMP + 'index.js',
	'sprites/shapes.svg',
]

//toolbox.options.debug = DEBUG
toolbox.options.networkTimeoutSeconds = 5
toolbox.options.cache.maxEntries = 100

self.addEventListener('install', (e) => {
	e.waitUntil(
		idbKeyval.clear()
		.then(self.skipWaiting())
	)
})
self.addEventListener('activate', (e) => {
	e.waitUntil(self.clients.claim())
})

toolbox.precache([
	'.', // Index page
].concat(STATIC_PRECACHE))

STATIC_PRECACHE.forEach((url) => {
	toolbox.router.get(url, toolbox.cacheOnly)
})

toolbox.router.get('images/*', imagesHandler) // @TODO: return larger image if cached

// @TODO: offline page

toolbox.router.default = toolbox.networkFirst
