import RefCountedCache from '../index.js';
import assert from 'assert';

describe('RefCountedCache', function () {
  it('get', async function () {
    let i = 0;

    const cache = new RefCountedCache({
      create: () => {
        i++;
        return i;
      },
      clean: () => (i = 100),
      defaultTimeout: 1 * 1000,
    });

    // calls create()
    const get1 = cache.get('key1');
    assert.equal(i, 1);
    assert.equal(get1.value, 1);

    // buffered value, create() not called
    const get2 = cache.get('key1');
    assert.equal(i, 1);
    assert.equal(get2.value, 1);
  });

  it('unref(), clean after timeout', async function () {
    let i = 0;

    const cache = new RefCountedCache({
      create: () => {
        i++;
        return i;
      },
      clean: () => (i = 100),
      defaultTimeout: 200,
    });

    // calls create()
    const get1 = cache.get('key1', {});

    assert.equal(i, 1);
    assert.equal(get1.value, 1);

    // delete
    get1.unref();
    await new Promise((r) => setTimeout(r, 300));

    // internal
    assert(!cache.cache['key1']);

    // calls create() again value cleaned up
    const get2 = cache.get('key1', { timeout: 200 });
    assert.equal(i, 101);
    assert.equal(get2.value, 101);

    // internal
    assert(cache.cache['key1']);
  });

  it('override timeout', async function () {
    let i = 0;

    const cache = new RefCountedCache({
      create: () => {
        i++;
        return i;
      },
      clean: () => (i = 100),
      defaultTimeout: 2000,
    });

    // calls create()
    const get1 = cache.get('key1', {
      timeout: 100,
    });

    assert.equal(i, 1);
    assert.equal(get1.value, 1);

    // will call clean() with overridden timeout ms
    get1.unref();

    await new Promise((r) => setTimeout(r, 150));
    assert.equal(i, 100);
  });

  it('del(), stop cleanup on new get()', async function () {
    let i = 0;

    const cache = new RefCountedCache({
      create: () => {
        i++;
        return i;
      },
      clean: () => (i = 100),
      defaultTimeout: 200,
    });

    // calls create()
    const get1 = cache.get('key1', { timeout: 200 });
    assert.equal(i, 1);
    assert.equal(get1.value, 1);

    // delete
    get1.unref('key1');
    assert.equal(i, 1);
    await new Promise((r) => setTimeout(r, 100));

    // unref/delete stopped, new get
    cache.get('key1');
    assert.equal(i, 1);

    // wait more to verify cleanup really stopped
    await new Promise((r) => setTimeout(r, 300));
    const get3 = cache.get('key1', { timeout: 200 });
    assert.equal(i, 1);
    assert.equal(get3.value, 1);
  });

  it('2x get(), will only cleanup after both unref()', async function () {
    let i = 0;

    const cache = new RefCountedCache({
      create: () => {
        i++;
        return i;
      },
      clean: () => (i = 100),
      defaultTimeout: 200,
    });

    // calls create() once, but counts references internally
    const get1 = cache.get('key1');
    const get2 = cache.get('key1');
    assert.equal(i, 1);

    // 1st unref
    get1.unref();
    await new Promise((r) => setTimeout(r, 300));

    // not yet deleted, still 1 ref
    assert.equal(i, 1);

    // 2nd unref
    get2.unref();
    await new Promise((r) => setTimeout(r, 300));

    // no more refs, now deleted
    assert.equal(i, 100);
  });

  it('2x get(), start cleanup after 2x del(), stop with new get()', async function () {
    let i = 0;

    const cache = new RefCountedCache({
      create: () => {
        i++;
        return i;
      },
      clean: () => (i = 100),
      defaultTimeout: 200,
    });

    // calls create() once, but counts references internally
    const get1 = cache.get('key1');
    const get2 = cache.get('key1');
    assert.equal(i, 1);

    // 1st unref
    get1.unref();
    get2.unref();
    await new Promise((r) => setTimeout(r, 100));

    // new ref
    const get3 = cache.get('key1');
    await new Promise((r) => setTimeout(r, 300));

    // no more refs, now deleted
    assert.equal(i, 1);
    assert.equal(get3.value, 1);
  });

  it('options.args[]', function (cb) {
    const cache = new RefCountedCache({
      create: (key, arg0, arg1) => {
        assert.deepStrictEqual(arg0, { foo: 'bar' });
        assert.deepStrictEqual(arg1, 123);
        cb(null);
      },
      clean: () => {},
      defaultTimeout: 1 * 1000,
    });

    cache.get('key1', {}, { foo: 'bar' }, 123);
  });
});
