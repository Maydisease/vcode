const EventEmitter3 = window.EventEmitter3;
if (!EventEmitter3) {
  throw new Error("eventemitter3 UMD not loaded");
}
export default EventEmitter3;