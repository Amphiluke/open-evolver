let cacheRegistry = new WeakMap();

export default class {
    constructor(createFn) {
        Object.defineProperty(this, "create", {configurable: true, value: createFn});
        cacheRegistry.set(this, new Map());
    }
    get(item) {
        let cache = cacheRegistry.get(this);
        // Create an item only on actual need (when requested for the first time) and then cache it
        if (!cache.has(item)) {
            cache.set(item, this.create(item));
        }
        return cache.get(item);
    }
    renew(item) {
        // Delete an item from cache.
        // Next time the item will be requested via `.get()`, its actual value will be stored in cache again
        cacheRegistry.get(this).delete(item);
    }
}