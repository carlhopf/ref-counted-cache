# ref-counted-cache

```
npm install --save ref-counted-cache
```



RefCountedCache
------------------


```javascript
import RefCountedCache from 'ref-counted-cache';

class Entry {
  constructor(arg0) {
    this.text = arg0;
    console.info('created');
  }

  close() {
    this.text = 'closed';
    console.info('closed');
  }
}

const cache = new RefCountedCache({
  defaultTimeout: 5 * 1000,

  // new instance
  create: (key, arg0) => {
    return new Entry('hello world ' + arg0);
  },

  // cleanup
  clean: (entry) => {
    entry.close();
  },
});

const cacheKey = 'key1'

// calls create()
const get1 = cache.get(cacheKey, 'my text 1');

// 'hello world: my text 1'
console.info(get1.value.text);

// returns cached value from first get()
const get2 = cache.get(cacheKey, 'my text 2');

// true
console.info(get1.value.text === get2.value.text);

// unref both, after defaultTimeout will call clean()
get1.clean();
get2.clean();

// after defaultTimeout, clean() called for cached entry
setTimeout(() => {
  console.info(get1.value.text === 'closed');
}, 6 * 1000);


```
