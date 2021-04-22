import RefCountedCache from '../index.js';
import assert from 'assert';

describe('RefCountedCache', function () {
  it('get', async function () {
    let i = 0;

    const cache = new RefCountedCache({
      create: () => i++,
      timeout: 1 * 1000,
    });

    // calls create()
    cache.get('key1', { foo: 'bar' });
    assert.equal(i, 1);

    // buffered value, create() not called
    cache.get('key1', { foo: 'bar' });
    assert.equal(i, 1);
  });

  it('del, unset after timeout', async function () {
    let i = 0;

    const cache = new RefCountedCache({
      create: () => i++,
      clean: () => (i = 100),
      timeout: 200,
    });

    // calls create()
    cache.get('key1', { foo: 'bar' });
    assert.equal(i, 1);

    // delete
    cache.del('key1');
    await new Promise((r) => setTimeout(r, 300));

    // internal
    assert(!cache.cache['key1']);

    // calls create() again value cleaned up
    cache.get('key1', { foo: 'bar' });
    assert.equal(i, 101);

    // internal
    assert(cache.cache['key1']);
  });

  it('del(), stop cleanup on new get()', async function () {
    let i = 0;

    const cache = new RefCountedCache({
      create: () => i++,
      clean: () => (i = 100),
      timeout: 200,
    });

    // calls create()
    cache.get('key1', { foo: 'bar' });
    assert.equal(i, 1);

    // delete
    cache.del('key1');
    await new Promise((r) => setTimeout(r, 100));

    // unset stopped, old value returned
    cache.get('key1', { foo: 'bar' });
    assert.equal(i, 1);

    // wait more to verify cleanup really stopped
    await new Promise((r) => setTimeout(r, 300));
    cache.get('key1', { foo: 'bar' });
    assert.equal(i, 1);
  });

  it('2x get(), will only cleanup after 2x del()', async function () {
    let i = 0;

    const cache = new RefCountedCache({
      create: () => i++,
      clean: () => (i = 100),
      timeout: 200,
    });

    // calls create() once, but counts references internally
    cache.get('key1', { foo: 'bar' });
    cache.get('key1', { foo: 'bar' });
    assert.equal(i, 1);

    // delete
    cache.del('key1');
    await new Promise((r) => setTimeout(r, 300));

    // not yet deleted, still 1 ref
    assert.equal(i, 1);

    // delete again
    cache.del('key1');
    await new Promise((r) => setTimeout(r, 300));

    // no more refs, now deleted
    assert.equal(i, 100);
  });

  it('2x get(), start cleanup after 2x del(), stop with new get()', async function () {
    let i = 0;

    const cache = new RefCountedCache({
      create: () => i++,
      clean: () => (i = 100),
      timeout: 200,
    });

    // calls create() once, but counts references internally
    cache.get('key1', { foo: 'bar' });
    cache.get('key1', { foo: 'bar' });
    assert.equal(i, 1);

    // delete
    cache.del('key1');
    await new Promise((r) => setTimeout(r, 300));

    // not yet deleted, still 1 ref
    assert.equal(i, 1);

    // delete again, starts cleanup
    cache.del('key1');

    // stop cleanup
    await new Promise((r) => setTimeout(r, 100));
    cache.get('key1', { foo: 'bar' });

    // check not cleaned up
    await new Promise((r) => setTimeout(r, 300));

    // no more refs, now deleted
    assert.equal(i, 1);
  });
});
