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

	const imageUrl = (size) => {
		return `${leftFragment}-${size}${rightFragment}`
	}

	const serveTheOneFromCache = (storedSize) => {
		// Get the stored image
		return toolbox.cacheOnly(new Request(imageUrl(storedSize)), values, options)
	}

	const checkResponseOk = (response) => {
		if (response instanceof Response && response.ok) {
			return response
		} else {
			return Promise.reject(new Error('Bad response'))
		}
	}

	const tryCache = (storedSize) => {
		// Resolves with adequate image from cache or rejects
		return new Promise((resolve, reject) => {
			if (!storedSize || storedSize < requestedSize) {
				reject(new Error('Adequate image in cache not found'))
			} else {
				toolbox.cacheOnly(new Request(imageUrl(storedSize)), values, options)
				.then(checkResponseOk)
				.then((response) => {
					resolve(response)
				})
				.catch((e) => {
					reject(e)
				})
			}
		})
	}

	const saveRequestedSize = (response) => {
		// Saves size of the largest image in cache
		return idbKeyval.set(generalUrl, requestedSize)
		.then(() => {
			return response // Pass through response
		})
	}

	const tryNetwork = (storedSize) => {
		return new Promise((resolve, reject) => {
			toolbox.fastest(new Request(imageUrl(requestedSize)), values, options) // "toolbox.fastest" will save to cache (networkOnly won't)
			.then(checkResponseOk)
			.then(saveRequestedSize)
			.catch((e) => {
				return serveTheOneFromCache(storedSize)
				.then(checkResponseOk)
			})
			.then((response) => {
				resolve(response)
			})
			.catch((e) => {
				reject(e)
			})
		})
	}

	return new Promise((resolve, reject) => {
		let storedSize
		idbKeyval.get(generalUrl)
		.then((size) => {
			storedSize = size
			return tryCache(storedSize)
		})
		.catch((e) => {
			return tryNetwork(storedSize)
		})
		.then((response) => {
			resolve(response)
		})
		.catch((e) => {
			reject(e)
		})

	})
}
