this.Subject = (function(hasOwnProperty){
  function Subject(){
    this._observers = {};
  };
  Subject.prototype = {};
  var P = Subject.prototype;
  P.attach = function(observer, prop){

    // Look up observers
    var observers;
    if (hasOwnProperty(this._observers, prop))
      observers = this._observers[prop];
    else
      observers = [];

    // Iterate over observers and copy to newObservers
    var newObservers = [], observerExists;
    for (var i = 0; i < observers.length; i++){
      newObservers.push(observers[i]);
      if (observers[i] === observer)
        observerExists = true;
    }

    // Add the new observer if not exists
    if (!observerExists)
      newObservers.push(observer);

    // Replace observers
    this._observers[prop] = newObservers;
  };
  P.detach = function(observer, prop){

    // Look up observers
    var observers;
    if (hasOwnProperty(this._observers, prop))
      observers = this._observers[prop];
    else
      return; // Nothing left to do

    // Iterate over observers and copy to newObservers
    var newObservers = [];
    for (var i = 0; i < observers.length; i++){
      if (observers[i] !== observer)
        newObservers.push(observers[i]);
    }

    // Replace observers
    if (newObservers.length)
      this._observers[prop] = newObservers;
    else
      delete this._observers[prop];
  };
  P.notify = function(prop){

    // Look up observers
    var observers;
    if (hasOwnProperty(this._observers, prop))
      observers = this._observers[prop];
    else
      return; // Nothing left to do

    // Call .update() on each observer
    for (var i = 0; i < observers.length; i++)
      observers[i].update();
  }
  return Subject;
}(this.hasOwnProperty));

