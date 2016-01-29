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
    }
    else {

      // Create items if nothing is in the queue
      var dummy = {next: next};
      this._queueCurrent = dummy;
      this._queueTip = next;
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
      return this._queueCurrent;
    }
  };
  P.peek = function(){

    // Get next item without incrementing
    if (this._queueCurrent !== this._queueTip)
      return this._queueCurrent.next.item; // We are not at the end of the queue

    // We are at the end of the queue
    // return undefined
  }
  return Queue;
}(this.getUndefined));

