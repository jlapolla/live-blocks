this.Block = (function(Subject, extendClass, hasOwnProperty){
  function Block(){
    Subject.call(this);
    this._properties = {};
    this._pendingNotifications = {};
    this._pendingChanges = {};
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

      // Handle pending changes
      var changes;
      for (var propName in this._pendingChanges){

        if (hasOwnProperty(this._pendingChanges, propName)){

          // Set changes flag
          changes = true;

          // Set pending notification
          this._pendingNotifications[propName] = this._pendingNotifications;

          // Get the property
          var prop = this._properties[propName];

          // Cache new property value
          if (hasOwnProperty(prop, "value"))
            prop.cached = prop.value;
          else if (hasOwnProperty(prop, "source"))
            prop.cached = prop.source.object.prop(prop.source.propName);
          // Else assume the property was deleted
        }
      }

      // Handle changes
      if (changes){

        // Clear pending changes
        this._pendingChanges = {};

        // Execute.run() if there were property changes since the last run
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

