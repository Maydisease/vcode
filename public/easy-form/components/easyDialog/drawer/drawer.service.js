export class DrawerService {
    static addQueueStackItem(stackItem) {
        let isExist = DrawerService.drawerQueueStack.find((item) => {
            return stackItem.id === item.id;
        });
        if (!isExist) {
            stackItem.index = DrawerService.drawerQueueStack.length + 1;
            DrawerService.drawerQueueStack.push(stackItem);
        }
    }
    static removeQueueStackItem(id) {
        let findIndex = DrawerService.drawerQueueStack.findIndex((item) => {
            return id === item.id;
        });
        DrawerService.drawerQueueStack = DrawerService.drawerQueueStack.splice(findIndex, 1);
    }
    static popQueueStackItem() {
        DrawerService.drawerQueueStack.pop();
    }
    static getTopStackItem() {
        if (DrawerService.drawerQueueStack.length) {
            return DrawerService.drawerQueueStack[DrawerService.drawerQueueStack.length - 1];
        }
        else {
            return null;
        }
    }
}
DrawerService.drawerQueueStack = [];
