const toolbox = require('../../../node_modules/sw-toolbox/sw-toolbox.js') // require('sw-toolbox') has some problems with missing modules
const idbKeyval = require('idb-keyval')

module.exports = (request, values, options) => {
	const urlParts = request.url.match(/^(.*)-(\d+)(\..+)$/)

	if (urlParts === null) {
		// Image without multiple sizes
		return toolbox.cacheFirst(request, values, options)
	}

	const [, leftFragment, sizeFragment, rightFragment] = urlParts
	const generalUrl = leftFragment + rightFragment
	const requestedSize = parseInt(sizeFragment, 10)

	const formatImageUrl = (size) => `${leftFragment}-${size}${rightFragment}`

	const serveTheOneFromCache = (storedSize) =>
		toolbox.cacheOnly(new Request(formatImageUrl(storedSize)), values, options) // Get the stored image

	const isResponseOk = (response) =>
		response instanceof Response && response.ok ? response : Promise.reject(new Error('Bad response'))

	const tryCache = (storedSize) =>
		new Promise((resolve, reject) => { // Resolves with adequate image from cache or rejects
			if (!storedSize || storedSize < requestedSize) {
				reject(new Error('Adequate image not found in cache'))
			} else {
				toolbox.cacheOnly(new Request(formatImageUrl(storedSize)), values, options)
					.then(isResponseOk)
					.then(resolve, reject)
			}
		})

	const saveRequestedSize = (response) =>
		idbKeyval
			.set(generalUrl, requestedSize) // Saves size of the largest image in cache
			.then(() => response) // Pass through response

	const tryNetwork = (storedSize) =>
		toolbox.fastest(new Request(formatImageUrl(requestedSize)), values, options) // "toolbox.fastest" will save to cache (networkOnly won't)
			.then(isResponseOk)
			.then(saveRequestedSize)
			.catch(() => serveTheOneFromCache(storedSize).then(isResponseOk))

	return new Promise((resolve, reject) => {
		let storedSize
		idbKeyval
			.get(generalUrl)
			.then((size) => tryCache(storedSize = size))
			.catch(() => tryNetwork(storedSize))
			.then(resolve, reject)
	})
}
