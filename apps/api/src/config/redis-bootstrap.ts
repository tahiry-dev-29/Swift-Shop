import Redis from 'ioredis';

const originalSilentEmit = Redis.prototype.silentEmit;

Redis.prototype.silentEmit = function (eventName, ...args) {
  if (eventName === 'error' && this.listeners('error').length === 0) {
    if (!this.__opencode_noop_listener) {
      this.on('error', () => undefined);
      this.__opencode_noop_listener = true;
    }
  }
  return originalSilentEmit.call(this, eventName, ...args);
};

declare module 'ioredis' {
  interface Redis {
    __opencode_noop_listener?: boolean;
  }
}
