import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Dropdown, message, Popover, Space, Table, Tag } from "antd";
import { QuestionCircleOutlined } from '@ant-design/icons';

import { EasyTableActions, EasyTableRowActions } from "./actions/index.js";
import { DownOutlined, SettingOutlined } from '@ant-design/icons';
import EasyTableColumnSetting, { deleteLocalColumnConfig, getInitColumnConfig } from "./easyTableColumnSetting.js";
import lodash from "lodash";
import { v4 } from "uuid";
import { getRandomIdUtil } from "../../utils/getRandom.util.js";
import { measureTextWidth } from "@utils/measureTextWIdth.util.js";
import classNames from "classnames";
import { calculateTime } from "@utils/dateParse.util.js";
const initialPagination = {
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    hideOnSinglePage: false,
    showTotal: (total) => (_jsxs(_Fragment, { children: ["\u5171\u8BA1 ", _jsx("span", { style: { color: '#FF0000' }, children: total }), " \u6761\u6570\u636E"] })),
    pageSizeOptions: ['10', '20', '50', '100']
};
const Component = (props, ref) => {
    let propsColumns = lodash.get(props, 'columns', []);
    const activeScopeService = props.scopeService;
    const TableColumn = Table.Column;
    let initRowSelectionProps = () => {
        let type = null;
        if (props.rowSelection) {
            type = props.rowSelection === 'radio' ? 'radio' : 'checkbox';
        }
        return type;
    };
    const [tableId, setTableId] = useState('');
    const currentTableRef = useRef(null);
    const [displayColumnSetting, setDisplayColumnSetting] = useState(false);
    const [dataSource, setDataSource] = useState([]);
    const [loading, setLoading] = useState(false);
    const [columns, setColumns] = useState(propsColumns);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [selectedRowsData, setSelectedRowsData] = useState([]);
    const [pagination, setPagination] = useState(initialPagination);
    const [selectionType, setSelectionType] = useState(initRowSelectionProps());
    let exportFn = () => ({
        getDataSource: getDataSource,
        updateDataSource: updateDataSource,
        resetPagination: resetPagination,
        clearRowSelection: clearRowSelection,
        loadDataList: loadDataList,
        updateSelection: updateSelection,
    });
    let tabKey = props.__$parentTabKey;
    if (tabKey) {
        props.__$parentLayoutHooks.updateRef(`${tabKey}`, exportFn);
    }
    useImperativeHandle(ref, exportFn);
    const autoCalcColumnWidth = () => {
        const newColumn = columns.map((column, index) => {
            const lastColumnIndex = columns.length - 1 === index;
            let rule1 = lastColumnIndex;
            // 如果外层设置了宽度，并且有data数据的话
            let rule2 = column.width && dataSource.length > 0;
            // 如果 自定义了 render 函数，并且有data数据的情况下，
            let rule3 = column.render && dataSource.length > 0;
            // 是最后一列（非action栏）;
            if (rule1 || rule2 || rule3) {
                if (rule2) {
                    column.__$width = column.width;
                }
                return column;
            }
            // 如果自定义了render，并且没有data数据时，那么就以column的宽度来做整体列的宽度
            if (column.render && dataSource.length === 0) {
                column.__$width = measureTextWidth(column.title);
                return column;
            }
            column.__$width = 100;
            dataSource.forEach((dataItem) => {
                const dateItemValue = dataItem[column.dataIndex];
                if (dateItemValue) {
                    if (!column.__$width) {
                        column.__$width = column.title ? measureTextWidth(column.title) : 0;
                    }
                    let width = dateItemValue ? measureTextWidth(dateItemValue) : 0;
                    width = width > 400 ? 400 : width;
                    if (column.__$width < width) {
                        column.__$width = width;
                    }
                }
            });
            return column;
        });
        {
            // 针对最后一列（可见）做处理，放开__$width
            const visibleNewColumns = newColumn.filter((item) => item.show);
            let lastVisibleColumnDataIndex = undefined;
            if (visibleNewColumns.length > 0) {
                lastVisibleColumnDataIndex = visibleNewColumns[visibleNewColumns.length - 1].dataIndex;
            }
            newColumn.some((_item) => {
                const item = _item;
                if (lastVisibleColumnDataIndex && item.dataIndex === lastVisibleColumnDataIndex) {
                    item.__$width = undefined;
                    return true;
                }
                else {
                    return false;
                }
            });
        }
        setColumns(newColumn);
    };
    const getDataSource = () => {
        return dataSource;
    };
    // 更新数据源，并生成每条数据的唯一id
    const updateDataSource = (newDataSource) => {
        setDataSource(newDataSource.map((item) => {
            if (!item.__$uniqueId) {
                item.__$uniqueId = `__$uniqueId_${getRandomIdUtil()}`;
            }
            return item;
        }));
        const pagination = activeScopeService && typeof activeScopeService.getPageInfo === 'function'
            ? activeScopeService.getPageInfo()
            : {};
        setPagination({ ...initialPagination, ...pagination, total: newDataSource.length });
    };
    const updateSelection = (keys) => {
        let newKeys = [];
        const selectedRows = dataSource.filter((item) => {
            const key = rowKeyProps(item);
            if (keys.includes(key)) {
                newKeys.push(key);
                return true;
            }
            else {
                return false;
            }
        });
        setSelectedRowKeys(keys);
        props.onRowSelectionChange && props.onRowSelectionChange(keys, selectedRows);
    };
    useEffect(() => {
        if (!(lodash.has(props, 'disableAutoCalcColumnWidth') && props.disableAutoCalcColumnWidth)) {
            autoCalcColumnWidth();
        }
    }, [dataSource]);
    // 更新数据列
    const updateColumn = (columns) => {
        columns.map((column) => {
            var _a;
            let renderProps = column.render;
            if (column["mapping.enum"] && !column.render) {
                renderProps = (text, record) => {
                    const items = column["mapping.enum"] || [];
                    const find = items.find((_item) => _item.value === text);
                    if (find) {
                        return _jsx(_Fragment, { children: find.label });
                    }
                    else {
                        return _jsx(_Fragment, { children: text });
                    }
                };
            }
            else if (column["mapping.tag"] && !column.render) {
                renderProps = (text, record) => {
                    var _a;
                    const config = (_a = column["mapping.tag"]) === null || _a === void 0 ? void 0 : _a.find((item) => item[0] === text);
                    if (config) {
                        return _jsx(Tag, { color: config[1], children: config[2] });
                    }
                    return _jsx(_Fragment, { children: text });
                };
            }
            else if (column["mapping.join"] && !column.render) {
                renderProps = (text, record) => {
                    const config = column["mapping.join"];
                    if (text && lodash.isArray(text) && config) {
                        return _jsx(_Fragment, { children: text.join(config) });
                    }
                    return _jsx(_Fragment, { children: text });
                };
            }
            else if (props.quickSearchColumns && props.quickSearchColumns.length) {
                let findSearchConf = props.quickSearchColumns.find((item) => {
                    return item.indexOf(column.dataIndex) === 0;
                });
                if (findSearchConf) {
                    let coverName;
                    let searchName;
                    if (findSearchConf.indexOf(':') > -1) {
                        [coverName, searchName] = findSearchConf.split(':');
                    }
                    else {
                        coverName = findSearchConf;
                        searchName = findSearchConf;
                    }
                    if (coverName && searchName) {
                        const coverColumn = (_a = props.columns) === null || _a === void 0 ? void 0 : _a.find((columnItem) => columnItem.dataIndex === coverName);
                        renderProps = (text, record) => {
                            const displayText = record[coverName];
                            if (displayText) {
                                return (_jsx("div", { className: 'quick-search', children: _jsx("span", { title: `点击搜素:${displayText}`, className: classNames('link'), onClick: () => {
                                            if (!(props.searchRef && props.searchRef.current)) {
                                                message.warning("table未配置searchRef props");
                                                console.warn("table未配置searchRef props");
                                                return;
                                            }
                                            props.searchRef.current.updateHandle({
                                                [searchName]: displayText
                                            });
                                        }, children: 
                                        // 如果easyTable的coverColumn 中，已经包含了render的话，那么这里将会嵌套包含这个render，否则将渲染一个新的render
                                        (coverColumn && coverColumn.render) ? coverColumn.render(text, record) : displayText }) }));
                            }
                            return _jsx(_Fragment, { children: text });
                        };
                    }
                }
            }
            column.render = renderProps;
            return column;
        });
        setColumns(columns);
    };
    // 获取数据列
    const getDataTableColumn = async () => {
        if (!props.columnsCode && propsColumns && propsColumns.length) {
            const _columns = propsColumns.map((column) => {
                if (!lodash.has(column, 'show')) {
                    column.show = true;
                }
                return column;
            });
            const { columns } = getInitColumnConfig(_columns);
            updateColumn(columnsSettingChange(columns, _columns));
        }
        // 如果配置了columnsCode，那么将从服务端接口来获取动态的下发列
        if (props.columnsCode) {
            if (!activeScopeService || typeof activeScopeService.getDataTableColumn !== 'function') {
                console.warn("easyTable columnsCode 需要 scopeService.getDataTableColumn");
                return;
            }
            const response = await activeScopeService.getDataTableColumn(props.columnsCode, props.enableMockMode, props.columnsDetailApiPrefix);
            // 如果有数据配置标题的话，这里是可以配置标题的 [__$parentUpdateTitle] 是 easyTableLayout注入进来的标题修改方法
            const tableLayoutUpdateTitle = lodash.get(props, '__$parentUpdateTitle', undefined);
            if (response && response.title && tableLayoutUpdateTitle) {
                tableLayoutUpdateTitle(response.tableTitle);
            }
            // 从column 中获取 默认时间配置项，调用props.searchRef 设置默认时间
            if (response && response.defaultDateRangeType && props.searchRef && props.searchRef.current) {
                const defaultDateRange = calculateTime(response.defaultDateRangeType);
                const defaultDateRangeName = props.searchRef.current.getDefaultDateRangeName();
                console.log('defaultDateRangeName:', defaultDateRangeName);
                if (defaultDateRangeName) {
                    // 同步搜索表单默认时间配置
                    props.searchRef.current.updateHandle({
                        [defaultDateRangeName]: defaultDateRange
                    }, true);
                    const searchConfig = props.searchRef.current.$formInst.getConfig();
                    const searchFormUnitConfig = searchConfig.find((conf) => conf.name === defaultDateRangeName);
                    if (searchFormUnitConfig && searchFormUnitConfig.transformResult && lodash.isArray(searchFormUnitConfig.transformResult)) {
                        const isShowTime = lodash.get(searchFormUnitConfig, 'features.showTime', false);
                        const startDateName = searchFormUnitConfig.transformResult[0];
                        const endDateName = searchFormUnitConfig.transformResult[1];
                        if (startDateName && endDateName) {
                            let dateFormat = isShowTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD';
                            // 同步传递进来的props.scopeService时间搜索条件
                            activeScopeService && activeScopeService.updateSearch && activeScopeService.updateSearch({
                                [startDateName]: defaultDateRange[0].format(dateFormat),
                                [endDateName]: defaultDateRange[1].format(dateFormat)
                            });
                        }
                    }
                }
            }
            if (response && response.showNum && response.list && response.list.length) {
                const combinedArray = lodash.unionBy(response.list, propsColumns, 'dataIndex');
                const _columns = combinedArray.sort((a, b) => {
                    return (b.show - a.show);
                }).map((item, index) => {
                    const i = index + 1;
                    item.show = i <= response.showNum && item.show;
                    const findItem = propsColumns.find((column) => column.dataIndex === item.key);
                    return {
                        ...item,
                        ...findItem
                    };
                });
                // 初次数据初始化时，从本地缓存中尝试加载配置
                const { columns } = getInitColumnConfig(_columns);
                const result = columnsSettingChange(columns, _columns);
                updateColumn(result);
            }
        }
    };
    // 末尾列的action配置
    const lastRowActionColumn = () => {
        if (props.rowActionMenus && typeof props.rowActionMenus === 'function') {
            return _jsx(TableColumn, { ellipsis: true, title: "操作", width: 220, dataIndex: "__$action", fixed: 'right', render: (_, record, index) => {
                    const key = rowKeyProps(record);
                    const menus = props.rowActionMenus(key, record, index);
                    menus.map((item) => {
                        (record && key) && (item.__table_record_id = key);
                        item.__table_record = record;
                        item.__table_index = index;
                        if (item.onHandle) {
                            item.__onHandle_callback = actionOnHandleCallback;
                        }
                        return item;
                    });
                    let actionMenus = EasyTableRowActions(menus);
                    // row action 菜单拆分，大于指定条目的菜单将被拆进more内
                    let maxNum = 3;
                    const moreItems = [];
                    let modifiedChildren = React.Children.map(lodash.get(actionMenus, 'props.children'), (child, index) => {
                        if (lodash.has(child.props, 'show') && !child.props.show) {
                            return null;
                        }
                        else if (lodash.has(child.props, 'perm') && !child.props.perm) {
                        }
                        else {
                            return child;
                        }
                    });
                    const normalActionMenus = React.Children.map(modifiedChildren, (child, index) => {
                        if ((index + 1) > maxNum) {
                            moreItems.push({
                                key: index,
                                label: child
                            });
                            return null;
                        }
                        else {
                            const style = { ...child.props.style, marginRight: "5px" };
                            return React.cloneElement(child, { style });
                        }
                    });
                    return _jsxs("div", { className: 'table-row-actions', children: [_jsx("div", { className: 'normal', children: normalActionMenus }), moreItems.length > 0 ? (_jsx("div", { className: classNames({ "more": true, }), children: _jsx(Dropdown, { menu: { items: moreItems }, children: _jsx("a", { href: '#', onClick: (e) => e.preventDefault(), children: _jsxs(Space, { style: { color: '#666' }, size: 2, children: ["\u66F4\u591A", _jsx(DownOutlined, {})] }) }) }) })) : void 0] });
                } }, "__$action");
        }
    };
    const componentUninstall = () => {
        activeScopeService && activeScopeService.updatePageInfo && activeScopeService.updatePageInfo(initialPagination);
    };
    const init = async () => {
        const tableId = v4();
        setTableId(tableId);
        await getDataTableColumn();
        if (!props.dataSource) {
            await loadDataList(true);
        }
        else {
            loadStaticDataList(true, initialPagination);
        }
    };
    useEffect(() => {
        init();
        return () => {
            componentUninstall();
        };
    }, []);
    // 加载本地静态数据（非 scopeService模式）
    const loadStaticDataList = (resetPage = false, pagination) => {
        if (resetPage) {
            resetPagination();
        }
        const paginationPayload = { ...initialPagination, ...pagination, total: props.dataSource.length };
        setPagination(paginationPayload);
        setDataSource(lodash.get(props, 'dataSource', []).map((item, index) => {
            item.__$uniqueId = `__$uniqueId_${getRandomIdUtil()}`;
            return item;
        }));
    };
    const loadDataList = async (resetPage = false) => {
        var _a;
        if (activeScopeService && !props.getDataListApi) {
            const pagination = activeScopeService.getPageInfo ? activeScopeService.getPageInfo() : {};
            setPagination({ ...initialPagination, ...pagination });
            return true;
        }
        if (resetPage) {
            resetPagination();
        }
        setLoading(true);
        if (!props.getDataListApi) {
            setLoading(false);
            return false;
        }
        const data = await props.getDataListApi.call(activeScopeService) || [];
        const pagination = activeScopeService && activeScopeService.getPageInfo ? activeScopeService.getPageInfo() : { total: data.length };
        setPagination({ ...initialPagination, ...pagination, total: (_a = pagination.total) !== null && _a !== void 0 ? _a : data.length });
        setLoading(false);
        if (!data) {
            return false;
        }
        setDataSource((data || []).map((item, index) => {
            item.__$uniqueId = `__$uniqueId_${getRandomIdUtil()}`;
            return item;
        }));
        props.onDataLoad && props.onDataLoad();
        return true;
    };
    const updatePagination = (newPagination) => {
        setPagination(newPagination);
        console.log('config@!:newPagination:');
    };
    const resetPagination = () => {
        updatePagination({
            ...pagination,
            current: 1,
        });
        activeScopeService && activeScopeService.updatePageInfo && activeScopeService.updatePageInfo({
            current: 1,
            pageSize: 10,
            total: undefined
        });
        console.log('config@!:2');
    };
    const clearRowSelection = () => {
        setSelectedRowKeys([]);
        setSelectedRowsData([]);
    };
    const rowSelectionProp = () => {
        if (!selectionType) {
            return {};
        }
        return {
            rowSelection: {
                type: selectionType,
                selectedRowKeys,
                preserveSelectedRowKeys: true,
                onChange: (selectedRowKeys, selectedRows) => {
                    setSelectedRowKeys(selectedRowKeys);
                    setSelectedRowsData(selectedRows);
                    props.onRowSelectionChange && props.onRowSelectionChange(selectedRowKeys, selectedRows);
                }
            }
        };
    };
    const paginationTriggerLoadListData = (newPagination) => {
        if (!props.dataSource) {
            loadDataList();
        }
        else {
            loadStaticDataList(false, newPagination);
        }
    };
    const actionOnHandleCallback = async (reloadData) => {
        if (reloadData) {
            clearRowSelection();
            await loadDataList(true);
        }
    };
    const propsActionBarMenus = useMemo(() => {
        return props.actionBarMenus ? EasyTableActions(props.actionBarMenus.map((menu) => {
            if (menu.isBatch) {
                menu.disabled = props.rowSelection && (selectedRowKeys.length === 0);
                if (menu.onHandle || menu.onDropdownHandle) {
                    menu.__batch_ids = selectedRowKeys;
                    menu.__batch_data = selectedRowsData;
                }
            }
            if (menu.onHandle || menu.onDropdownHandle) {
                menu.__onHandle_callback = actionOnHandleCallback;
            }
            return menu;
        })) : void 0;
    }, [props.actionBarMenus, selectedRowKeys, props.rowSelection]); // 依赖列表中的 count 更新时，useMemo 会重新计算 doubleCount
    const columnsSettingChange = (columnsConfig, targetColumns) => {
        let newColumns = columnsConfig.map((column) => {
            const findConfig = (targetColumns || columns).find((config) => column.dataIndex === config.dataIndex);
            return {
                ...findConfig,
                ...column
            };
        });
        // 如果没有设置当前的columns的话，那么就代表是从column setting 组件中传递出来的事件
        // 否则就是当前组件默认从缓存中取出来的
        if (!targetColumns) {
            updateColumn(newColumns);
        }
        return newColumns;
    };
    const firstIndexColumn = () => {
        if (props.hideNoColumn) {
            return void 0;
        }
        return (_jsx(TableColumn, { ellipsis: true, title: '序号', dataIndex: '__$no', width: 80, render: (value, record, index) => {
                const baseIndex = index + 1;
                const { total, pageSize, current } = pagination;
                return (((total < pageSize ? 1 : current) - 1) * pageSize) + baseIndex;
            } }, '__$no'));
    };
    let easyTableColumnSetting = displayColumnSetting ? (_jsx(EasyTableColumnSetting, { columnsCode: props.columnsCode, columnsSettingChange: columnsSettingChange, columns: columns, closeHandle: () => {
            setDisplayColumnSetting(false);
        } })) : void 0;
    const rowKeyProps = (record) => {
        let key = record.id || record.__$uniqueId;
        if (props.rowKey) {
            key = record[props.rowKey];
        }
        return key;
    };
    const columnTitle = (column) => {
        if (!column.tip) {
            return column.title;
        }
        return _jsxs("div", { className: 'title', children: [_jsx("span", { children: column.title }), _jsx("span", { style: { marginLeft: 5, color: '#999' }, children: _jsx(Popover, { mouseEnterDelay: 0.5, placement: "topLeft", content: _jsx("div", { style: {
                                color: '#666',
                                maxWidth: 300,
                                whiteSpace: 'wrap',
                                wordBreak: 'break-word'
                            }, children: column.tip }), title: _jsx(_Fragment, { children: column.title }), children: _jsx(QuestionCircleOutlined, {}) }) })] });
    };
    return (_jsxs("div", { className: `easy-table-component-container ${displayColumnSetting ? 'setting-column' : ''}`, children: [props.hideActionBar ? void 0 : (_jsxs("div", { className: 'table-action-bar', children: [_jsx("div", { className: 'spacer' }), _jsx("div", { className: 'actions', children: propsActionBarMenus })] })), easyTableColumnSetting, _jsxs("div", { className: 'table-wrap', children: [_jsxs(Table, { id: `table_id_${tableId}`, ref: currentTableRef, size: 'small', scroll: props.containerScroolMaxWidth ? { x: props.containerScroolMaxWidth } : {}, loading: loading, ...rowSelectionProp(), dataSource: dataSource, pagination: pagination, rowKey: rowKeyProps, onChange: (newPagination) => {
                            updatePagination(newPagination);
                            props.onChange && props.onChange(newPagination);
                            activeScopeService && activeScopeService.updatePageInfo && activeScopeService.updatePageInfo(newPagination);
                            paginationTriggerLoadListData(newPagination);
                        }, children: [firstIndexColumn(), columns.map((column, index) => {
                                return column.show ? _jsx(TableColumn, { ellipsis: true, title: columnTitle(column), dataIndex: column.dataIndex, width: column.__$width || column.width, render: column.render }, column.dataIndex) : void 0;
                            }), lastRowActionColumn()] }), !props.hideSettingBtn ? (_jsx(Dropdown, { menu: {
                            items: [
                                {
                                    label: (_jsx("div", { style: { width: '100%' }, children: "\u914D\u7F6E\u5B57\u6BB5" })),
                                    key: 'setting',
                                    onClick: () => {
                                        setDisplayColumnSetting(true);
                                    }
                                },
                                {
                                    label: (_jsx("div", { style: { width: '100%' }, children: "\u91CD\u7F6E\u5B57\u6BB5" })),
                                    key: 'reset',
                                    onClick: () => {
                                        deleteLocalColumnConfig(columns);
                                        getDataTableColumn();
                                    }
                                },
                            ]
                        }, children: _jsx("div", { className: 'setting', children: _jsx(SettingOutlined, {}) }) })) : void 0] })] }));
};
const ExportEasyTable = forwardRef(Component);
export default ExportEasyTable;
