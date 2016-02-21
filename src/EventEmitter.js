this.EventEmitter = (function (hasOwnProperty) {
  function EventEmitter() {
    this._listeners = {};
  };

  EventEmitter.prototype = {};
  var P = EventEmitter.prototype;
  P.on = function (ev, callback) {

    // Look up listeners
    var listeners;
    if (hasOwnProperty(this._listeners, ev))
      listeners = this._listeners[ev];
    else
      listeners = [];

    // Iterate over listeners and copy to newListeners
    var newListeners = [], listenerExists;
    for (var i = 0; i < listeners.length; i++) {
      newListeners.push(listeners[i]);
      if (listeners[i] === callback)
        listenerExists = true;
    }

    // Add the new callback if not exists
    if (!listenerExists)
      newListeners.push(callback);

    // Replace listeners
    this._listeners[ev] = newListeners;
  };

  P.off = function (ev, callback) {

    // Look up listeners
    var listeners;
    if (hasOwnProperty(this._listeners, ev))
      listeners = this._listeners[ev];
    else
      return; // Nothing left to do

    // Iterate over listeners and copy to newListeners
    var newListeners = [];
    for (var i = 0; i < listeners.length; i++) {
      if (listeners[i] !== callback)
        newListeners.push(listeners[i]);
    }

    // Replace listeners
    if (newListeners.length)
      this._listeners[ev] = newListeners;
    else
      delete this._listeners[ev];
  };

  P.fire = function (ev, arg) {

    // Look up listeners
    var listeners;
    if (hasOwnProperty(this._listeners, ev))
      listeners = this._listeners[ev];
    else
      return; // Nothing left to do

    // Call each callback
    if (typeof arg !== 'undefined') {
      for (var i = 0; i < listeners.length; i++)
        listeners[i](arg);
    } else {
      for (var i = 0; i < listeners.length; i++)
        listeners[i]();
    }
  };

  return EventEmitter;
}(this.hasOwnProperty));

