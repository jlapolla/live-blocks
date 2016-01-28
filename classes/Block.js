this.Block = (function(Subject, EventEmitter, Error, extendClass, multiInheritClass, hasOwnProperty, getUndefined){
  var clear = function(prop){

    if (hasOwnProperty(prop, "source")){

      // Detach from source
      prop.source.object.detach(this, prop.source.propName);

      // Delete source
      delete prop.source;
    }
    else if (hasOwnProperty(prop, "value")){

      // Delete value
      delete prop.value;
    }
  };
  var maxUpdateIterations = 1000;
  function Block(run){
    Subject.call(this);
    EventEmitter.call(this);
    this._properties = {};
    this._pendingNotifications = {};
    this._updating = false;
    this._running = false;

    // Add run function if supplied
    if (typeof run !== "undefined")
      this.run = run;
  }
  extendClass(Subject, Block);
  multiInheritClass(EventEmitter, Block);
  var P = Block.prototype;
  P.error = function(){
    return this._lastError;
  };
  P.duplicate = function(){

    if (typeof this.run === "function")
      return new Block(this.run);
    else
      return new Block();
  };
  P.update = function(){

    // Check updating flag
    if (this._updating)
      return; // Return early if we are already updating
    else
      this._updating = true; // Set updating flag immediately

    // Main update loop
    var iterations = 1;
    while (true){

      // Check for infinite update loop
      if (iterations++ > maxUpdateIterations) {

        this._updating = false;
        this._running = false;
        throw new Error("Infinite update loop detected: reached " + maxUpdateIterations + " iterations");
      }

      // Check for changes
      var changes = getUndefined();
      for (var propName in this._properties){

        // Get the property
        var prop = this._properties[propName];

        // Get property value
        var value = getUndefined();
        var propDeleted = getUndefined();
        if (hasOwnProperty(prop, "value"))
          value = prop.value;
        else if (hasOwnProperty(prop, "source"))
          value = prop.source.object.prop(prop.source.propName);
        else
          propDeleted = true;

        // Compare value to cached value
        // Do not run if both value and cached are "NaN"
        if (value !== prop.cached && (value === value || prop.cached === prop.cached)){

          // Set changes flag
          if (this._running)
            changes = true;
          else {
            
            if (changes !== getUndefined())
              throw new Error("System logic bug detected! This is an issue within LiveBlocks itself. Please file a bug report with the developer!");
            else
              changes =  propName;
          }

          // Set pending notification
          this._pendingNotifications[propName] = this._pendingNotifications;

          // Cache new value
          prop.cached = value;
        }

        // Delete the property completely
        if (propDeleted)
          delete this._properties[propName];
      }

      // Handle changes
      if (changes && !this._running){

        // Look up run function
        var run;
        if (typeof this.run === "function")
          run = this.run;
        else if (typeof this.run !== "undefined" && typeof this.run[changes] === "function")
          run = this.run[changes];

        // Execute run() if it is a function
        if (typeof run === "function") {

          // Fire "run" event
          this.fire("run", changes);

          // Execute run() in a try block
          try {

            this._running = true;
            run.call(this);
            delete this._lastError;
          }
          catch (e) {

            this._lastError = e;
            this.fire("error", e);
          }

          // Handle successful run
          if (!hasOwnProperty(this, "_lastError"))
            this.fire("success");
        }

        // Restart loop to check for new changes
        continue;
      }

      // Unset running flag
      this._running = false;

      // Handle pending notifications
      var notifications = getUndefined();
      for (var propName in this._pendingNotifications){

        // Set notifications flag
        notifications = true;

        // Call .notify()
        this.notify(propName);
      }

      // Handle notifications
      if (notifications){

        // Clear pending notifications
        this._pendingNotifications = {};

        // Restart loop to check for new changes
        continue;
      }

      // Unset updating flag and return
      this._updating = false;
      return;
    }
  };
  P.prop = function(arg1, arg2, arg3){

    // Get the property object
    var prop = this._properties[arg1];

    if (typeof arg2 !== "undefined"){

      // We are setting a property to a source or value

      // Create the property if it does not exist
      if (!hasOwnProperty(this._properties, arg1)){
        prop = {};
        this._properties[arg1] = prop;
      }

      // Clear the old property
      clear.call(this, prop);

      // Set new source or value
      if (typeof arg3 !== "undefined"){

        // We are setting a property to a source

        // Record the source
        prop.source = {object: arg2, propName: arg3};

        // Attach to the source
        arg2.attach(this, arg3);
      }
      else {

        // We are setting a property to a value

        // Record the value
        prop.value = arg2;
      }

      // Call update
      this.update();
    }
    else {

      // We are getting a property

      // Return cached value if property exists
      if (hasOwnProperty(this._properties, arg1))
        return prop.cached;
    }
  };
  P.del = function(propName){

    if (hasOwnProperty(this._properties, propName)){

      // Clear property source or value
      clear.call(this, this._properties[propName]);

      // Call .update() to delete the property
      this.update();
    }
  };
  Block.setMaxUpdateIterations = function(iterations) {

    maxUpdateIterations = iterations;
  };
  return Block;
}(this.Subject, this.EventEmitter, host.Error, this.extendClass, this.multiInheritClass, this.hasOwnProperty, this.getUndefined));

