/**
 *
 */
export default class RefCountedCache {
  constructor({ create, clean, timeout = 60 * 1000 }) {
    this.create = create;
    this.clean = clean;
    this.timeout = timeout;
    this.cache = {};
  }

  get(key, ...args) {
    let cached = this.cache[key];

    // create
    if (!cached) {
      cached = {
        value: this.create(...args),
        references: 0,
        cleanTimeout: undefined,
      };

      this.cache[key] = cached;
    }

    // always stop cleanup timeout on get
    clearTimeout(cached.cleanTimeout);
    delete cached.cleanTimeout;

    // increase count
    cached.references++;

    return cached.value;
  }

  del(key) {
    let cached = this.cache[key];

    if (cached) {
      // prevent sub zero
      if (cached.references > 0) cached.references--;

      // setup clean timeout
      if (!cached.cleanTimeout && cached.references <= 0) {
        cached.cleanTimeout = setTimeout(() => {
          this.clean(cached.value);
          delete this.cache[key];
        }, this.timeout);
      }
    }
  }

  inspect(key) {
    return this.cache[key]?.value;
  }
}
