import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { EasyFormService } from "../easyForm/easyForm.service.js";
import { Button } from "antd";
import { DoubleLeftOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';

import useQueryParams from "../../hooks/useQueryParams.hook.js";
import { useRandomId } from "@components/easyForm/easyFormHook/useRandomId.js";
const createMatrix = (config, num) => {
    const matrix = [];
    config.forEach((config, index) => {
        const level = Math.floor(index / 3);
        if (!matrix[level]) {
            matrix[level] = [];
        }
        matrix[level].push(`${config.name}:8`);
    });
    return matrix;
};
const EasySearch = (props, ref) => {
    let formConfig = props.config;
    let defaultFormConfig = [];
    let isExistExtend = formConfig.length > 6;
    let urlSearchParam = useQueryParams();
    const defaultForm = useMemo(() => new EasyFormService(), [props.config]);
    let { formId } = useRandomId();
    useEffect(() => {
        initExtendStatus();
    }, [props.config]);
    const [isExtendStatus, setIsExtendStatus] = useState(false);
    const initUrlSearchParams = () => {
        if (Object.keys(urlSearchParam.search).length) {
            props.scopeService.updateSearch(urlSearchParam.search);
            formConfig = formConfig.map((config, index) => {
                const value = urlSearchParam.search[config.name];
                if (value) {
                    config.value = value;
                    // 增加特殊标记，在重置表单时，该value 需要被清理
                    config.__$isInjectValue = true;
                }
                return {
                    ...config
                };
            });
            return formConfig;
        }
        return formConfig;
    };
    formConfig = initUrlSearchParams();
    defaultFormConfig = defaultForm.defineConfig(formConfig);
    const defaultLayoutConfig = defaultForm.defineLayoutConfig({
        matrixMode: "grid",
        matrix: createMatrix(defaultFormConfig, 3),
    });
    const updateHandle = (payload, disableSubmit = false) => {
        if (Object.keys(payload).length) {
            for (let key in payload) {
                const value = payload[key];
                const find6 = formConfig.some((config, index) => config.name === key && index >= 6);
                if (find6) {
                    setIsExtendStatus(true);
                }
                defaultForm.$update(key, value);
            }
            if (!disableSubmit) {
                setTimeout(() => {
                    submitHandle().then();
                });
            }
        }
    };
    const exportFn = () => {
        return {
            submitHandle: submitHandle,
            updateHandle: updateHandle,
            resetHandle: resetHandle,
            getDefaultDateRangeName: getDefaultDateRangeNameHandle,
            $formInst: defaultForm,
            $formInstUpdate: (name, value, data) => defaultForm.$update(name, value, data),
        };
    };
    useImperativeHandle(ref, exportFn);
    useEffect(() => {
        initExtendStatus();
        return () => {
            if (props.scopeService) {
                props.scopeService.clearSearch();
            }
        };
    }, []);
    const filterEmptyValues = (values) => {
        for (let key in values) {
            const value = values[key];
            if (value === null || value === "") {
                values[key] = undefined;
            }
        }
    };
    const getDefaultDateRangeNameHandle = () => {
        return props.defaultDateRangeFieldName;
    };
    const submitHandle = async () => {
        var _a, _b;
        let values = {};
        const defaultValues = await defaultForm.$submit();
        values = { ...defaultValues };
        filterEmptyValues(values);
        if (props.scopeService) {
            props.scopeService.clearSearch();
            if (!props.enableMockMode) {
                props.scopeService.updateSearch(values);
            }
            else {
                props.scopeService.updateSearch({ condition: JSON.stringify(values) });
            }
        }
        if ((_a = props.tableRef) === null || _a === void 0 ? void 0 : _a.current) {
            props.tableRef.current.clearRowSelection();
            (_b = props.tableRef) === null || _b === void 0 ? void 0 : _b.current.loadDataList(true);
        }
        props.searchHandle && props.searchHandle(values);
        return values;
    };
    const resetHandle = async (pureRest = false) => {
        var _a, _b;
        defaultForm.$reset(true);
        if (props.scopeService) {
            props.scopeService.clearSearch();
        }
        if (((_a = props.tableRef) === null || _a === void 0 ? void 0 : _a.current) && !pureRest) {
            props.tableRef.current.clearRowSelection();
            (_b = props.tableRef) === null || _b === void 0 ? void 0 : _b.current.loadDataList(true);
        }
        props.resetHandle && props.resetHandle();
    };
    const initExtendStatus = () => {
        const names = [];
        formConfig.forEach((config, index) => {
            if (index >= 6) {
                names.push(config.name);
            }
        });
        if (isExtendStatus) {
            defaultForm.$show(names);
        }
        else {
            defaultForm.$hide(names);
        }
    };
    useEffect(() => {
        initExtendStatus();
    }, [isExtendStatus]);
    const extendAction = isExistExtend ? (_jsxs("span", { className: `${isExtendStatus ? 'is-extend-status' : ''}`, onClick: () => {
            setIsExtendStatus(!isExtendStatus);
        }, children: [_jsx("i", { children: _jsx(DoubleLeftOutlined, {}) }), isExtendStatus ? '关闭' : '展开'] })) : void 0;
    return (_jsxs("div", { className: 'easy-search-component-container', children: [_jsx("div", { className: 'form-container', children: _jsx("div", { className: 'default', children: _jsx(defaultForm.Form, { formId: formId, config: defaultFormConfig, layout: defaultLayoutConfig }) }) }), _jsxs("div", { className: 'action-bar', children: [extendAction, _jsx(Button, { icon: _jsx(SearchOutlined, {}), type: 'primary', onClick: () => submitHandle(), children: "\u641C\u7D22" }), _jsx(Button, { icon: _jsx(ReloadOutlined, {}), onClick: () => resetHandle(), children: "\u91CD\u7F6E" })] })] }));
};
const ExportEasyTable = forwardRef(EasySearch);
export default ExportEasyTable;
