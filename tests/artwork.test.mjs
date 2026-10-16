import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {artworkSource,artworkVariants} from '../lib/artwork-sources.ts';
test('optimized artwork preserves unique uploaded URLs while reducing bundled image sizes',()=>{
 const upload='/api/media/11111111-1111-4111-8111-111111111111';assert.equal(artworkSource(upload),upload);assert.equal(artworkVariants(upload),null);
 for(const name of ['hero-dream','ocean-cathedral','celestial-bloom','dream-garden']){const variants=artworkVariants('/media/'+name+'.png');assert.equal(variants.length,2);for(const variant of variants){const optimized=readFileSync('public'+variant.src),original=readFileSync('public/media/'+name+'.png');assert.ok(optimized.length<original.length/5);assert.equal(optimized.toString('ascii',8,12),'WEBP')}}
});
