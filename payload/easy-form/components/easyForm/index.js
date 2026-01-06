import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useImperativeHandle, useState } from 'react';
import { Form } from "antd";
import { EasyFormLayout } from "./easyFormLayout/index.js";
import lodash from 'lodash';
import useFormDebugStore from "@components/easyForm/easyFormDebug/store/index.js";
let forceCleanValueFlag = null;
const _EasyForm = (props, ref) => {
    var _a, _b;
    const [form] = Form.useForm();
    const [count, setCount] = useState(0);
    const [config, setConfig] = useState([]);
    useEffect(() => {
        props.config.forEach((formConfig) => {
            emitUnitWatch(formConfig.name, formConfig.value, true);
        });
        useFormDebugStore.getState().update(props.formId, "InitLayout", "DefineConfig");
    }, []);
    // 使用 useImperativeHandle 钩子来暴露特定的实例值
    useImperativeHandle(ref, () => ({
        updateFormConfig: (config) => {
            setCount(count + 1);
            setConfig(config);
        },
        updateFieldValue(name, value) {
            form.setFieldValue(name, value);
            emitUnitWatch(name, value, false);
        },
        async submit() {
            return new Promise((resolve, reject) => {
                form.validateFields().then((values) => {
                    resolve(values);
                }).catch(() => {
                    resolve(null);
                });
            });
        },
        reset(forceCleanValue) {
            if (forceCleanValue) {
                forceCleanValueFlag = forceCleanValue;
                setConfig(props.config.map((item) => {
                    if (item.__$isInjectValue) {
                        form.setFieldValue(item.name, null);
                        item.value = undefined;
                    }
                    return item;
                }));
            }
            return form.resetFields();
        },
        getFormValues() {
            return form.getFieldsValue();
        }
    }));
    useEffect(() => {
        setConfig(props.config);
    }, [props.config]);
    useEffect(() => {
    }, [config]);
    const initialValues = () => {
        const values = {};
        props.config.forEach((formConfig) => {
            if (lodash.has(formConfig, 'value')) {
                values[formConfig.name] = formConfig.value;
            }
        });
        if (forceCleanValueFlag) {
            setTimeout(() => {
                forceCleanValueFlag = null;
                config.forEach((item) => {
                    if (item.__$isInjectValue) {
                        form.setFieldValue(item.name, null);
                    }
                });
            });
        }
        return values;
    };
    const findUnitConfigIndexByName = (formConfig, name) => {
        return formConfig.findIndex((config) => config.name === name);
    };
    const emitUnitWatch = (name, value, isInit) => {
        for (let config of props.config) {
            if (config.name === name) {
                const inst = {
                    update: (...args) => {
                        // 这里做了一个引用计数，如果需要开启将需要处理
                        // **********************************************************************************
                        const targetName = args[0];
                        const targetUnitConfigIndex = findUnitConfigIndexByName(props.config, targetName);
                        if (targetUnitConfigIndex > -1) {
                            if (!props.config[targetUnitConfigIndex].__refCount) {
                                props.config[targetUnitConfigIndex].__refCount = 0;
                            }
                            props.config[targetUnitConfigIndex].__refCount = props.config[targetUnitConfigIndex].__refCount + 1;
                        }
                        // **********************************************************************************
                        return props.serviceInst.$update(...args);
                    },
                    disable: (...args) => props.serviceInst.$disable(...args),
                    enable: (...args) => props.serviceInst.$enable(...args),
                    show: (...args) => props.serviceInst.$show(...args),
                    hide: (...args) => props.serviceInst.$hide(...args),
                };
                config.watch && config.watch(value, inst, config, isInit);
            }
        }
    };
    const onValuesChangeHandle = (changedValues, allValues) => {
        for (let name in changedValues) {
            if (changedValues.hasOwnProperty(name)) {
                const value = changedValues[name];
                emitUnitWatch(name, value, false);
            }
        }
    };
    return (_jsx(_Fragment, { children: _jsx(Form, { layout: ((_a = props.layout) === null || _a === void 0 ? void 0 : _a.labelVertical) ? 'vertical' : 'horizontal', form: form, initialValues: initialValues(), onValuesChange: onValuesChangeHandle, className: 'easy-form-for-antd-v5', children: ((_b = props.layout) === null || _b === void 0 ? void 0 : _b.matrix) ?
                _jsx(EasyFormLayout.Matrix, { form: form, serviceInst: props.serviceInst, formId: props.formId, layout: props.layout, config: config }) :
                _jsx(EasyFormLayout.Normal, { formId: props.formId, serviceInst: props.serviceInst, layout: props.layout, form: form, config: config }) }) }));
};
export const EasyForm = React.forwardRef(_EasyForm);
