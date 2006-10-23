function Queue(maxLength) {
    this.maxLength = maxLength;
    this.queue = [];
};

Queue.prototype.length = function() {
    return this.queue.length;
};

Queue.prototype.push = function(item) {
    if (this.queue.length >= this.maxLength)
        return false;

    this.queue.push(item);
    return true;
};

Queue.prototype.pop = function() {
    var item = undefined;
    if (this.queue.length) {
        item = this.queue.pop();
    }
    return item;
};

Queue.prototype.full = function() {
    return this.queue.length >= this.maxLength;
};

Queue.prototype.moreThanHalf = function() {
    return (this.queue.length > (this.maxLength / 2));
}

Queue.prototype.empty = function() {
    var item = undefined;
    while (undefined != (item = this.pop()))
        delete item;
};
