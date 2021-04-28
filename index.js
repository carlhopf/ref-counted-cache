/**
 *
 */
export default class RefCountedCache {
  constructor({ create, clean, defaultTimeout = 60 * 1000 }) {
    this.create = create;
    this.clean = clean;
    this.defaultTimeout = defaultTimeout;
    this.cache = {};
  }

  get(key, { args = [], timeout } = {}) {
    let cached = this.cache[key];

    // create
    if (!cached) {
      cached = {
        value: this.create(key, args),
        refs: [],
        cleanTimeout: undefined,
        timeoutMs: timeout || this.defaultTimeout,
      };

      this.cache[key] = cached;
    }

    // always stop cleanup timeout on get()
    clearTimeout(cached.cleanTimeout);
    delete cached.cleanTimeout;

    // add ref
    const ref = new Object();
    cached.refs.push(ref);

    return {
      value: cached.value,
      unref: () => this._unref(key, cached, ref),
    };
  }

  // remove ref, setup cleanup timeout if no more refs
  _unref(key, cached, ref) {
    let index = cached.refs.indexOf(ref);

    // already removed
    if (index === -1) return;

    cached.refs.splice(index, 1);

    // setup clean timeout
    if (!cached.cleanTimeout && cached.refs.length === 0) {
      const fn = () => {
        this.clean(cached.value);
        delete this.cache[key];
      };

      // instant
      if (cached.timeoutMs <= 0) {
        fn();
      }
      // delayed
      else {
        cached.cleanTimeout = setTimeout(fn, cached.timeoutMs);
      }
    }
  }

  inspect(key) {
    return this.cache[key]?.value;
  }
}
