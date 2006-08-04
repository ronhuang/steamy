function Queue(maxLength) {
    this.maxLength = maxLength;

    this.queue = new Array();
    this.length = 0;
    this.queueSpace = 0;

    this.enqueue = function(item) {
        if (this.length >= this.maxLength)
            return false;

        this.length++;
        this.queue[this.queue.length++] = item;
        return true;
    };

    this.dequeue = function() {
        var item = undefined;
        if (this.queue.length) {
            this.length--;
            item = this.queue[this.queueSpace];
            if ((++this.queueSpace) * 2 >= this.queue.length) {
                for (var i = this.queueSpace; i < this.queue.length; i++)
                    this.queue[i - this.queueSpace] = this.queue[i];
                this.queue.length -= this.queueSpace;
                this.queueSpace = 0;
            }
        }
        return item;
    };

    this.full = function() {
        return (this.length >= this.maxLength);
    };

    this.empty = function() {
        var item = undefined;
        while (undefined != (item = this.dequeue()))
            delete item;

        this.queue.length = 0;
        this.length = 0;
        this.queueSpace = 0;
    }
}
