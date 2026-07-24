export class RuntimeLock {
  constructor() {
    this.owner = null;
  }

  acquire(owner) {
    if (this.owner !== null) return false;
    this.owner = owner;
    return true;
  }

  release(owner) {
    if (this.owner !== owner) return false;
    this.owner = null;
    return true;
  }

  forceRelease() {
    this.owner = null;
  }

  get isLocked() {
    return this.owner !== null;
  }
}
