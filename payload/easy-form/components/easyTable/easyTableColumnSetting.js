import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { SortableContainer, SortableElement, SortableHandle, } from 'react-sortable-hoc';
import { arrayMoveImmutable } from 'array-move';

import { EyeOutlined, CloseOutlined } from '@ant-design/icons';
import { getShortIdUtl } from "../../utils/getShortId.utl.js";
var CHANGE_SHOW_TYPE;
(function (CHANGE_SHOW_TYPE) {
    CHANGE_SHOW_TYPE[CHANGE_SHOW_TYPE["HIDE"] = 0] = "HIDE";
    CHANGE_SHOW_TYPE[CHANGE_SHOW_TYPE["SHOW"] = 1] = "SHOW";
})(CHANGE_SHOW_TYPE || (CHANGE_SHOW_TYPE = {}));
// 创建可排序项的高阶组件
const SortableItem = SortableElement((props) => {
    const DragHandle = SortableHandle(() => _jsx("span", { className: 'label', children: props.item.title }));
    return (_jsxs("div", { className: `easy-table-column-setting-item ${props.item.show ? '' : 'hide'}`, children: [_jsx(DragHandle, {}), _jsx("span", { className: 'state', onClick: (event) => {
                    props.changeShowHandle(props.item.dataIndex, props.item.show ? CHANGE_SHOW_TYPE.HIDE : CHANGE_SHOW_TYPE.SHOW);
                    event.stopPropagation();
                    event.preventDefault();
                    return false;
                }, children: _jsx(EyeOutlined, {}) })] }));
});
// 创建包含可排序项的列表的高阶组件
const SortableList = SortableContainer((props) => {
    return (_jsx("div", { className: 'drag-list', children: props.items.map((item, index) => {
            return _jsx(SortableItem, { changeShowHandle: props.changeShowHandle, index: index, item: item }, `item-${item.dataIndex}`);
        }) }));
});
export const deleteLocalColumnConfig = (columns) => {
    const columnHashId = getColumnHashId(columns);
    localStorage.removeItem(columnHashId);
};
export const getColumnHashId = (columns) => {
    let columnsHashList = [];
    for (const column of columns) {
        columnsHashList.push(`${column.dataIndex}`);
    }
    const columnsHashStr = columnsHashList.sort().join(',');
    return `EASY_TABLE_COLUMNS_CACHE_${getShortIdUtl(columnsHashStr)}`;
};
export const getInitColumnConfig = (propsColumns) => {
    // 初始化 columns 为空数组，稍后会填入数据
    let columns = [];
    // 初始化一个对象用于快速查找 dataIndex 对应的 column
    let columnsLookup = {};
    // 单次遍历来处理所有逻辑
    for (const column of propsColumns) {
        // 添加到 columns 数组
        columns.push({
            title: column.title,
            show: column.show,
            dataIndex: column.dataIndex
        });
        // 填充 columnsLookup 对象
        columnsLookup[column.dataIndex] = column;
    }
    const localStoreSaveId = getColumnHashId(propsColumns);
    // 尝试从本地存储中获取列设置
    const localColumnSetting = localStorage.getItem(localStoreSaveId);
    // 如果本地存储中有设置，则使用这些设置来覆盖或更新 columns
    if (localColumnSetting) {
        const columnSettingCache = JSON.parse(localColumnSetting);
        // 更新 columns，使用从本地存储中恢复的设置
        columns = columnSettingCache.map((cachedColumn) => ({
            ...columnsLookup[cachedColumn.dataIndex],
            ...cachedColumn
        }));
    }
    return { columns, localStoreSaveId };
};
let localStoreSaveId = undefined;
const EasyTableColumnSetting = (props) => {
    useEffect(() => {
        const result = getInitColumnConfig(props.columns);
        localStoreSaveId = result.localStoreSaveId;
        setItems(result.columns);
    }, []);
    const [items, setItems] = useState([]);
    // 更新本地缓存
    const updateLocalCache = (newItems) => {
        if (localStoreSaveId) {
            localStorage.setItem(localStoreSaveId, JSON.stringify(newItems));
            props.columnsSettingChange(newItems);
        }
    };
    // 拖拽排序结束时
    const onSortEnd = ({ oldIndex, newIndex }) => {
        setItems((prevItems) => {
            const newItems = arrayMoveImmutable(prevItems, oldIndex, newIndex);
            updateLocalCache(newItems);
            return newItems;
        });
    };
    // 改变是否隐藏按钮时
    const onChangeShow = (dataIndex, type) => {
        const newItems = items.map((item) => {
            if (dataIndex === item.dataIndex) {
                item.show = !!type;
            }
            return item;
        });
        setItems(newItems);
        updateLocalCache(newItems);
    };
    return _jsxs("div", { className: 'easy-table-column-setting', children: [_jsx(SortableList, { helperClass: 'dragging', helperContainer: () => window.__EASY_FORM_SHADOW_ROOT__ || document.body, axis: 'x', items: items, transitionDuration: 100, useDragHandle: true, onSortEnd: onSortEnd, changeShowHandle: onChangeShow }), _jsx("div", { className: 'close', onClick: () => {
                    props.closeHandle && props.closeHandle();
                }, children: _jsx(CloseOutlined, {}) })] });
};
export default EasyTableColumnSetting;
