export class ListService {
    constructor() {
        this.data = [];
    }
    push(data) {
        this.data.push(data);
        this.watch();
    }
    hide(id) {
        this.data.map((item) => {
            if (item.id === id) {
                item.hide = true;
            }
            return item;
        });
    }
    pop() {
        return this.data.pop();
    }
    getPrev(id) {
        const findItemIndex = this.data.findIndex((item) => item.id === id);
        return findItemIndex > 0 ? this.data[findItemIndex - 1] : null;
    }
    getLast() {
        return this.data.length > 0 ? this.data[this.data.length - 1] : null;
    }
    delete() {
        //
    }
    watch() {
    }
    size() {
        return this.data.length;
    }
    getAll() {
        return this.data;
    }
}
