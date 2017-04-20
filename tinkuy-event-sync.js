// # Synchronise events from tinkuy.dk to CouchDB
//
// The couchdb url to synchronise to should be includes in the url-hash, i.e. `http://tinkuy-event-sync.solsort.com/#https://user:passwd@couch.db/database` synchronises with `couch.db/database`.

let PouchDB = require('pouchdb');
let deepEqual = require('deep-equal');
let db = new PouchDB('tinkuy_events');
let remote = location.hash.slice(1);

PouchDB.replicate(remote, 'tinkuy_events')
  .then(main);

async function main() {
  try {
    await updateDB();
  } catch(e) {
    console.log('tinkuy_event_sync error: ' + e);
  }
  /* wait 3 minutes between syncs */
  setTimeout(main, 3 * 60 * 1000);
}

async function updateDB() {
  console.log('tinkuy_event_sync');
  let events = await fetch('http://tinkuy.dk/events.json');
  events = await events.json();

  console.log('tinkuy_event_sync got data');
  let changed = 0;
  for(let event of events) {
    let doc;
    try {
      doc = await db.get(String(event.id));
    } catch(e) {
      doc = {};
    }
    let newDoc = Object.assign({}, doc, event);

    if(!deepEqual(doc, newDoc)) {
      await db.put(newDoc);
      ++changed;
    }
  }

  console.log('tinkuy_event_sync replicate: ' + changed);
  if(changed) {
    await PouchDB.replicate('tinkuy_events', remote);
  }
  console.log('tinkuy_event_sync done');
}
