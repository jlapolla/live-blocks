this.BlackBox = (function(EventEmitter, extendClass, hasOwnProperty, Queue, getUndefined, Map, Set){
  var errorListener = function(e){

    if (!hasOwnProperty(this, "_lastError"))
      this._lastError = e;
  };
  var init = (function(){

    var processWire, processBlock;

    processWire = function(wire, wireSet, blockSet){

      // Check if this wire has already been processed
      if (!wireSet.has(wire)){

        // Wire has not been processed
        // Add wire to wire set
        wireSet.add(wire);

        // Process all blocks connected to the wire
        var it = wire.connections();
        while (!it.peek().done)
          processBlock(it.next().value.block, wireSet, blockSet);
      }
    };

    processBlock = function(block, wireSet, blockSet){

      // Check if this block has already been processed
      if (!blockSet.has(block)){

        // Block has not been processed
        // Add block to block set
        blockSet.add(block);

        // Process all wires connected to the block
        var it = block.connections();
        while (!it.peek().done)
          processWire(it.next().value.wire, wireSet, blockSet);
      }
    };

    return function(pins){

      // Create wire set and block set
      // These collect all wires and blocks in the network
      var wireSet = new Set();
      var blockSet = new Set();

      // Process pins hash
      for (var pin in pins){

        // Add pin to internal wire hash
        this._internalWires[pin] = pins[pin].wire;

        // Process the wire and all connected blocks
        processWire(pins[pin].wire, wireSet, blockSet);
      }

      // All blocks are in the block set now
      // Attach "error" event listener to all blocks in the network
      var it = blockSet.values();
      while (!it.peek().done)
        it.next().value.on("error", this._errorListener);
    };
  }());
  function BlackBox(hash){

    EventEmitter.call(this);

    this._updating = false;
    this._internalWires = {};
    this._externalWires = {};
    this._errorListener = errorListener.bind(this);

    if (typeof hash !== "undefined"){

      // Add pins if supplied
      if (hasOwnProperty(hash, "pins"))
        init.call(this, hash.pins);

      // Add queue if supplied
      if (hasOwnProperty(hash, "queue"))
        this._updateQueue = hash.queue;
    }

    // Set defaults
    if (!hasOwnProperty(this, "_updateQueue"))
      this._updateQueue = new Queue();
  }
  extendClass(EventEmitter, BlackBox);
  var P = BlackBox.prototype;
  P.duplicate = (function(){

    var processWire, processBlock;

    processWire = function(wire, wireMap, blockMap){

      // Check if this wire has already been processed
      var duplicate = wireMap.get(wire);
      if (duplicate)
        return duplicate;

      // Wire has not been processed
      // Duplicate the wire
      duplicate = wire.duplicate();

      // Add duplicate wire to wire map
      wireMap.put(wire, duplicate);

      // Process all blocks connected to the wire
      var it = wire.connections();
      while (!it.peek().done)
        processBlock(it.next().value.block, wireMap, blockMap);

      // Return duplicate wire
      return duplicate;
    };

    processBlock = function(block, wireMap, blockMap){

      // Check if this block has already been processed
      var duplicate = blockMap.get(block);
      if (duplicate)
        return duplicate;

      // Block has not been processed
      // Duplicate the block
      duplicate = block.duplicate();

      // Add duplicate block to block map
      blockMap.put(block, duplicate);

      // Process all wires connected to the block
      var it = block.connections();
      while (!it.peek().done){

        // Process and get the duplicate wire
        var wire = processWire(it.peek().value.wire, wireMap, blockMap);

        // Connect the duplicate block to the duplicate wire
        duplicate.connect(it.next().value.pin, wire);
      }

      // Return duplicate block
      return duplicate;
    };

    return function(){

      // Create wire map and block map
      // These map wires and blocks in the original circuit to their duplicates
      var wireMap = new Map();
      var blockMap = new Map();

      // Construct pins hash for the new BlackBox
      var pins;
      for (var pin in this._internalWires)
        pins[pin] = processWire(this._internalWires[pin], wireMap, blockMap);

      // Return the new BlackBox
      return new BlackBox({pins: pins, queue: this._updateQueue.duplicate()});
    };
  }());
  P.update = function(pin){

    // A connected wire value changed

    // Check updating flag
    if (this._updating){

      // Add update to queue and return
      this._updateQueue.push(pin);
      return;
    }
    else
      this._updating = true; // Set updating flag

    // Main loop
    while (true){

      // Defensive copy external wires
      // Internal wires should never change
      var internalWires = this._internalWires, externalWires = {};
      for (var name in internalWires){

        if (this._externalWires[name])
          externalWires[name] = this._externalWires[name];
      }

      // Get updated pin value
      var value;
      if(externalWires[pin])
        value = externalWires[pin].value();
      else
        value = getUndefined();

      // Fire update event
      this.fire("update", {pin: pin, value: value});

      // Clear last error, if any
      delete this._lastError;

      // Copy values from external wires to internal wires
      for (var name in internalWires){

        if (externalWires[name])
          internalWires[name].value(externalWires[name].value());
        else
          internalWires[name].value(getUndefined());
      }

      // Handle successful run
      if (!hasOwnProperty(this, "_lastError")){

        // Fire event
        this.fire("success");

        // Copy values from internal wires to external wires
        for (var name in internalWires){

          if (externalWires[name])
            externalWires[name].value(internalWires[name].value());
        }
      }
      else
        this.fire("error", this._lastError); // Fire event

      // Proces update queue
      if (this._updateQueue.isEmpty()){

        // Unset updating flag and return
        this._updating = false;
        return;
      }
      else
        pin = this._updateQueue.next(); // Get next updated pin from queue

      // Restart loop
    }
  };
  return BlackBox;
}(this.EventEmitter, this.extendClass, this.hasOwnProperty, this.Queue, this.getUndefined, this.Map, this.Set));

