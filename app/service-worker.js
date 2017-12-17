// Set a name for the current cache
var cacheName = 'sw_cache_get';
var postCache = 'sw_cache_post'; 

// Default files to always cache
var cacheFiles = [
	'./',
	'./service-worker.js',
	'./assets/img/loading.gif',
	'./vendor/bootstrap/css/bootstrap.min.css',
	'./assets/css/style.css',
	'./vendor/jquery/jquery.min.js',
	'./vendor/bootstrap/js/bootstrap.bundle.min.js',
	'./vendor/jquery-easing/jquery.easing.min.js',
	'./vendor/quagga-adapter-latest.js',
	'./vendor/quagga.min.js',
	'./vendor/quaggaApp.js',
	'./vendor/html2pdf.bundle.min.js',
	'./assets/js/sw_handler.js',
	'./assets/js/main.js'
];


self.addEventListener('install', function(e) {
    console.log('[ServiceWorker] Installed');

    // e.waitUntil Delays the event until the Promise is resolved
    e.waitUntil(

    	// Open the cache
	    caches.open(cacheName).then(function(cache) {
	    	// Add all the default files to the cache
			console.log('[ServiceWorker] Caching cacheFiles');
			return cache.addAll(cacheFiles);
	    })
	); // end e.waitUntil
});


self.addEventListener('activate', function(e) {
    console.log('[ServiceWorker] Activated');

    e.waitUntil(

    	// Get all the cache keys (cacheName)
		caches.keys().then(function(cacheNames) {
			return Promise.all(cacheNames.map(function(thisCacheName) {
				console.log('cachenames: ', cacheNames,thisCacheName);
				// If a cached item is saved under a previous cacheName
				if (thisCacheName !== cacheName) {
					// Delete that cached file
					console.log('[ServiceWorker] Removing Cached Files from Cache - ', thisCacheName);
					return caches.delete(thisCacheName);
				}
			
			}));
		})
	); // end e.waitUntil

	console.log(e, self)


});


self.addEventListener('sync', function (e) {
	console.log('sync')
	if (e.tag == 'sync-posts') {
		console.log('sync2')
		// Resubmit offline signature requests
	
	}
});

self.addEventListener('fetch', function(e) {
	if(e.request.method == 'POST'){
		console.log('Service Worker fetch', e);
		e.respondWith(
			caches.match(e.request)
				.then(function (response) {
					// Cache signature post request
					if (!navigator.onLine) {
						var request = e.request;
						var headers = {};
						for (var entry of request.headers.entries()) {
							headers[entry[0]] = entry[1];
						}
						var serialized = {
							url: request.url,
							headers: headers,
							method: request.method,
							mode: request.mode,
							credentials: request.credentials,
							cache: request.cache,
							redirect: request.redirect,
							referrer: request.referrer
						};
						request.clone().text().then(function (body) {
							serialized.body = body;
							addQueueToDB(serialized);
						});
					}
					// Immediately respond if request exists in the cache and user is offline
					if (response && !navigator.onLine) {
						return response;
					}
			


					// IMPORTANT: Clone the request. A request is a stream and
					// can only be consumed once. Since we are consuming this
					// once by cache and once by the browser for fetch, we need
					// to clone the response
					var fetchRequest = e.request.clone();

					// Make the external resource request
					return fetch(fetchRequest).then(
						function (response) {
							// If we do not have a valid response, immediately return the error response
							// so that we do not put the bad response into cache
							if (!response || response.status !== 200 || response.type !== 'basic') {
								return response;
							}

							// IMPORTANT: Clone the response. A response is a stream
							// and because we want the browser to consume the response
							// as well as the cache consuming the response, we need
							// to clone it so we have 2 stream.
							var responseToCache = response.clone();

							// Place the request response within the cache
							caches.open(postCache)
								.then(function (cache) {
									if (e.request.method !== "POST") {
										cache.put(e.request, responseToCache);
									}
								});

							return response;
						}
					);
				})
		);
	}else if(e.request.method == 'GET'){
	e.respondWith(
	// Response as quick as possible 
	// Try finding request in cache	
		caches.match(e.request).then(function (response) {
			if (response) {
				console.log('[ServiceWorker] ' + e.request.url +' In cache');
				return response;
			} else {
				console.log('[Service Worker] ' + e.request.url + ' Not in cache');
				return fetch(e.request);
			}
		})
	);
// No matter what make that request
	e.waitUntil(
		fetch(e.request).then(function(result){
			if(result){
				e.waitUntil(updateCache(e.request));
				e.waitUntil(send_message_to_client(e.clientId, 'status: online'));


				// online send unsent

				e.waitUntil(
					getQueuesFromDB().then(function (callsToCache) {
						if (navigator.onLine && callsToCache.length > 0) {


							var proms = [];
							callsToCache.forEach(function (signatureRequest) {
								proms.push(fetch(signatureRequest.queue.url, {
									method: signatureRequest.queue.method,
									body: signatureRequest.queue.body
								}))
							});
							e.waitUntil(
								Promise.all(proms).then(function () {
									clearDB();
								})
							);


						}
					})
				);
				// online send unsent
			}
		}).catch(function(){
			e.waitUntil(send_message_to_client(e.clientId, 'status: offline'));

		})
	);

}
});

function updateCache(request){
	return caches.open(cacheName).then(function (cache) {
		cache.add(request);
	});
}

function send_message_to_client(clientId, msg) {
	return new Promise(function (resolve, reject) {
		if(!clientId) return resolve();
		var msg_chan = new MessageChannel();

		msg_chan.port1.onmessage = function (event) {
			if (event.data.error) {
				reject(event.data.error);
			} else {
				console.log('reply', event.data)
				resolve(event.data);
			}
		};
		clients.get(clientId).then(function (client) {
			client.postMessage( msg , [msg_chan.port2]);
		});
	});
}

function clearDB() {
	var offlineDB = indexedDB.open("offlineDB", 1);
	offlineDB.onupgradeneeded = function () {
		var db = offlineDB.result;
		var store = db.createObjectStore("MyObjectStore", { keyPath: "id" });
	}
	offlineDB.onsuccess = function () {
		// Start a new transaction
		var db = offlineDB.result;
		var tx = db.transaction("MyObjectStore", "readwrite");
		var store = tx.objectStore("MyObjectStore");
		store.clear();
		tx.oncomplete = function () {
			db.close();
		};
	}
}
function addQueueToDB(queue) {
	var offlineDB = indexedDB.open("offlineDB", 1);
	offlineDB.onupgradeneeded = function () {
		var db = offlineDB.result;
		var store = db.createObjectStore("MyObjectStore", { keyPath: "id" });
	}
	offlineDB.onsuccess = function () {
		// Start a new transaction
		var db = offlineDB.result;
		var tx = db.transaction("MyObjectStore", "readwrite");
		var store = tx.objectStore("MyObjectStore");


		var crequest = store.count();
		crequest.onsuccess = function (e) {
			store.add({
				id: e.target.result + 1, queue: queue
			});
		}

		tx.oncomplete = function () {
			db.close();
		};
	}
}

function getQueuesFromDB() {
	return new Promise(function (res, rej) {
		var offlineDB = indexedDB.open("offlineDB", 1);
		offlineDB.onupgradeneeded = function () {
			var db = offlineDB.result;
			var store = db.createObjectStore("MyObjectStore", { keyPath: "id" });
		}
		offlineDB.onsuccess = function () {
			// Start a new transaction
			var db = offlineDB.result;
			var tx = db.transaction("MyObjectStore", "readwrite");
			var store = tx.objectStore("MyObjectStore");


			var request = store.getAll();
			request.onsuccess = function (e) {
				console.log(e.target.result)
				res(e.target.result);
			};

			tx.oncomplete = function () {
				db.close();
			};
		}

	});
}