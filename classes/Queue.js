this.Queue = (function(getUndefined){
  function Queue(){

    this._queueTip = getUndefined();
    this._queueCurrent = getUndefined();
  }
  Queue.prototype = {};
  var P = Queue.prototype;
  P.push = function(item){

    // Push item onto queue
    var next = {item: item};
    if (this._queueCurrent){

      // Update tip if something is in the queue
      this._queueTip.next = next;
      this._queueTip = next;
      return;
    }
    else {

      // Create items if nothing is in the queue
      this._queueCurrent = {next: next};
      this._queueTip = next;
      return;
    }
  };
  P.next = function(){

    // Increment queue and get next item
    if (this._queueCurrent !== this._queueTip){

      // We are not at the end of the queue
      this._queueCurrent = this._queueCurrent.next;
      return this._queueCurrent.item;
    }
    else {

      // We are at the end of the queue
      this._queueCurrent = getUndefined();
      this._queueTip = getUndefined();
      return;
    }
  };
  P.peek = function(){

    // Get next item without incrementing
    if (this._queueCurrent !== this._queueTip)
      return this._queueCurrent.next.item; // We are not at the end of the queue
    else
      return; // We are at the end of the queue
  }
  return Queue;
}(this.getUndefined));

