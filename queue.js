/*
Copyright (C) 2009 Ron Huang

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

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
