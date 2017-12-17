class AppStatus {
    constructor(appInstance) {
        this.app = appInstance;
        this.watchers = {online: [], offline: []};
    }
    on(eventName, callback) {
        var realStatus, eventClasses;
        if (eventName.indexOf('.') !== -1) {
            eventName = eventName.split('.');
            [realStatus] = eventName.shift();
            eventClasses = eventName;
        } else {
            realStatus = eventName;
            eventClasses = null;
        }
        if (this.watchers.hasOwnProperty(realStatus)) {
            this.watchers[realStatus].push({
                eventClasses: eventClasses,
                callback: callback
            });
        }
    }
    off(eventName, callback) {
        var realStatus, eventClasses;
        if (eventName.indexOf('.') !== -1) {
            eventName = eventName.split('.');
            [realStatus] = eventName.shift();
            eventClasses = eventName;
        } else {
            realStatus = eventName;
            eventClasses = null;
        }
        if (this.watchers.hasOwnProperty(realStatus)) {
        this.watchers[realStatus].forEach(function(element, index){
                if(element.eventClasses.indexOf(eventClasses) !== -1 || element.callback === callback){
                    this.onlineWatchers.splice(index, 1);
                }
                });
        }
  
    }
    dispatch(event) {
        if (this.watchers.hasOwnProperty(event)) {
            for (var i = 0; i < this.watchers[event].length; i++) {
                this.watchers[event][i].callback();
            }
        }
    }
}

var waybillrEvents = new AppStatus();

waybillrEvents.on('offline', () => {
    $('.online-btn').each(function () {
        $(this).attr('data-restore-class', $(this).attr('class'));
        setTimeout(()=>{
            $(this).removeClass('btn-primary btn-default btn-success').addClass('btn-warning offline-warn');
        }, 300);
        this.setAttribute('disabled', '');
    });
    $('.online-circle').css('background-color', 'orange');
    $('.online-status-text').text('offline');
});

waybillrEvents.on('online', () => {
    $('.btn').each(function () {
        $(this).removeClass('offline-warn btn-warning').addClass($(this).attr('data-restore-class'));
        this.removeAttribute('disabled');
        this.removeAttribute('data-restore-class');

        $('.online-circle').css('background-color', 'green');
        $('.online-status-text').text('online');
    });
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('./service-worker.js').then(function (registration) {
            // Registration was successful
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function (err) {
            // registration failed :(
            console.log('ServiceWorker registration failed: ', err);
        });
    });

    navigator.serviceWorker.addEventListener('message', function (event) {
        // event.data = 'status: online || status: offline'
        if (event.data.indexOf('online') !== -1) {
            waybillrEvents.dispatch('online');
        } else {
            waybillrEvents.dispatch('offline');
        }
        // resolve
        event.ports[0].postMessage(event.data + ' ok');
    });
}
function registerForSync(promise){
navigator.serviceWorker.ready.then(function (reg) {
    return reg.sync.register('action:send--datato:url--data:adsasd');
}).then(function () {
    console.log('sync registered');
});
}
// 

var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
var offlineDB = indexedDB.open("offlineDB", 1);
offlineDB.onupgradeneeded = function () {
    var db = offlineDB.result;
    var store = db.createObjectStore("MyObjectStore", { keyPath: "id" });
};

offlineDB.onsuccess = function () {
    // Start a new transaction
    var db = offlineDB.result;
    var tx = db.transaction("MyObjectStore", "readwrite");
    var store = tx.objectStore("MyObjectStore");
    
    console.log(store);
    var crequest = store.count();
    crequest.onsuccess = function(e){
    }
  
    // Query the data
    var request = store.getAll();
    request.onsuccess = function (e) {
        console.log(e.target.result)
        // Extract all the objects from the event.target.result
    };

    // Close the db when the transaction is done
    tx.oncomplete = function () {
        db.close();
    };
}
