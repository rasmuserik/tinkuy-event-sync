let updateDB = (() => {
  var _ref2 = _asyncToGenerator(function* () {
    console.log('tinkuy_event_sync');
    let events = yield fetch('http://tinkuy.dk/events.json');
    events = yield events.json();

    console.log('tinkuy_event_sync got data');
    let changed = 0;
    for (let event of events) {
      let doc;
      try {
        doc = yield db.get(String(event.id));
      } catch (e) {
        doc = {};
      }
      let newDoc = Object.assign({}, doc, event);

      if (!deepEqual(doc, newDoc)) {
        yield db.put(newDoc);
        ++changed;
      }
    }

    console.log('tinkuy_event_sync replicate: ' + changed);
    if (changed) {
      yield PouchDB.replicate('tinkuy_events', location.hash.slice(1));
    }
    console.log('tinkuy_event_sync done');
  });

  return function updateDB() {
    return _ref2.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

// # Synchronise events from tinkuy.dk to CouchDB
//
// The couchdb url to synchronise to should be includes in the url-hash, i.e. `http://tinkuy-event-sync.solsort.com/#https://user:passwd@couch.db/database` synchronises from/to couch.db/database.

let PouchDB = require('pouchdb');
let deepEqual = require('deep-equal');
let db = new PouchDB('tinkuy_events');

if (!window.tinkuy_events_sync) {
  PouchDB.replicate(location.hash.slice(1), 'tinkuy_events');
  setTimeout(() => window.tinkuy_events_sync(), 5000);
}

window.tinkuy_events_sync = _asyncToGenerator(function* () {
  try {
    yield updateDB();
  } catch (e) {
    console.log('tinkuy_event_sync error: ' + e);
  }
  setTimeout(function () {
    return window.tinkuy_events_sync();
  }, 60000);
});
