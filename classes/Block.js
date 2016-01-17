this.Block = (function(Subject, extendClass, hasOwnProperty){
  function Block(){
    Subject.call(this);
    this._properties = {};
    this._pendingNotifications = {};
    this._updating = false;
  }
  extendClass(Subject, Block);
  var P = Block.prototype;
  P.update = function(){

    // Check updating flag
    if (this._updating)
      return; // Return early if we are already updating
    else
      this._updating = true; // Set updating flag immediately

    // Main update loop
    while (true){

      // Check for changes
      var changes;
      for (var propName in this._properties){

        if (hasOwnProperty(this._properties, propName)){

          // Get the property
          var prop = this._properties[propName];

          // Get property value
          var value, propDeleted;
          if (hasOwnProperty(prop, "value"))
            value = prop.value;
          else if (hasOwnProperty(prop, "source"))
            value = prop.source.object.prop(prop.source.propName);
          else
            propDeleted = true;

          if (value !== prop.cached){

            // Set changes flag
            changes = true;

            // Set pending notification
            this._pendingNotifications[propName] = this._pendingNotifications;

            // Cache new value
            prop.cached = value;
          }

          // Delete the property completely
          if (propDeleted)
            delete this._properties[propName];
        }
      }

      // Handle changes
      if (changes){

        // Execute.run() if it is a function
        if (typeof this.run === "function")
          this.run();

        // Restart loop to check for new changes
        continue;
      }

      // Handle pending notifications
      var notifications;
      for (var propName in this._pendingNotifications){

        if (hasOwnProperty(this._pendingNotifications, propName)){

          // Set notifications flag
          notifications = true;

          // Call .notify()
          this.notify(propName);
        }
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
  return Block;
}(this.Subject, this.extendClass, this.hasOwnProperty));

