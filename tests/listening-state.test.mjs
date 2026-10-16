import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readListeningState} from '../lib/listening-state.ts';
test('resume rejects broken data and limits saved position and volume',()=>{
 for(const raw of [null,'oops','{}',JSON.stringify({version:99})])assert.equal(readListeningState(raw),null);
 const saved={version:1,trackId:'atlantis',position:45,playlistId:'quiet-dreams',repeat:'one',shuffle:true,volume:.4};assert.deepEqual(readListeningState(JSON.stringify(saved)),saved);
 assert.equal(readListeningState(JSON.stringify({...saved,position:-1})),null);assert.equal(readListeningState(JSON.stringify({...saved,position:999999,volume:3})).volume,1);assert.equal(readListeningState(JSON.stringify({...saved,position:999999})).position,86400);
});
