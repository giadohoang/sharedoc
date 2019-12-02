import sorted from 'sorted-cmp-array';

//extending sortedArray functionality from library
//Adding a 'get' method for retrieving elements.
class SortedArray extends sorted {
    constructor(compareFn) {
        super(compareFn);
    }

    get(idx) {
        return this.arr[idx];
    }
}

export default SortedArray;