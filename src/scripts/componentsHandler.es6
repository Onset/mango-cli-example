module.exports = (components) => {
	let componentsStartTime

	if (DEBUG) {
		componentsStartTime = performance.now()
		console.groupCollapsed('Initializing components...')
	}

	//
	// Lazy components initialization from initComponents queue
	//
	const instances = []

	// Init function
	const init = (component) => {
		let componentStartTime

		if (component.name in components) {
			if (DEBUG) {
				componentStartTime = performance.now()
			}

			const Component = components[component.name] // class
			const placement = (typeof component.place === 'string') ? document.querySelector(component.place) : component.place // DOM element
			const instance = new Component(placement, component.data || {}) // new instance

			instances.push(instance)

			if (DEBUG) {
				const componentEndTime = performance.now()
				console.log(`component: ${component.name}: ${Math.round(componentEndTime-componentStartTime)} ms`)
			}
		} else if (DEBUG) {
			console.warn(`component: ${component.name}: not found!`)
		}
	}
	// Instance only required components
	initComponents.forEach(init)

	// Allow lazy init of components after page load
	initComponents = {
		push: init,
	}

	if (DEBUG) {
		const componentsEndTime = performance.now()
		console.groupEnd()
		console.info(`Components initialization: ${Math.round(componentsEndTime-componentsStartTime)} ms`)

		console.groupCollapsed('Instances:')
		instances.forEach((component) => {
			console.dir(component)
		})
		console.groupEnd()
	}

	//
	// Print timing data on page load
	//
	if (DEBUG) {
		function printPerfStats() {
			const timing = window.performance.timing
			console.groupCollapsed('Performance:')
			console.log(`dns: \t\t ${timing.domainLookupEnd - timing.domainLookupStart} ms`)
			console.log(`connect: \t ${timing.connectEnd - timing.connectStart} ms`)
			console.log(`ttfb: \t\t ${timing.responseStart - timing.connectEnd} ms`)
			console.log(`basePage: \t ${timing.responseEnd - timing.responseStart} ms`)
			console.log(`frontEnd: \t ${timing.loadEventStart - timing.responseEnd} ms`)
			console.groupEnd()
		}

		window.addEventListener('load', () => setTimeout(printPerfStats, 1000))
	}
}
