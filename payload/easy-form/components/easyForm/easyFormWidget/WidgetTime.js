import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import { TimePicker } from "antd";
import dayjs from "dayjs";
import lodash from 'lodash';
import useFormDebugStore from "@components/easyForm/easyFormDebug/store/index.js";
class WidgetTime {
    // 转换结果
    static resultTransform(name, config, values) {
        let format = "YYYY-MM-DD HH:mm:ss";
        if (!config.transformResult) {
            return;
        }
        if (typeof config.transformResult === "string") {
            format = config.transformResult || format;
        }
        const cloneValues = lodash.cloneDeep(values);
        const newValues = values;
        const value = newValues[name];
        if (value && lodash.has(values, name)) {
            newValues[name] = dayjs(value).format(format);
            newValues[`__$transformResult__[${name}]->(${name})__`] = cloneValues[name];
        }
        return newValues;
    }
    static inputTransform(value, config) {
        if (typeof value !== "string") {
            return value;
        }
        if (!config.transformInput) {
            return value;
        }
        if (typeof config.transformInput === "boolean") {
            return dayjs(value);
        }
        if (typeof config.transformInput === "string") {
            return dayjs(value).format(config.transformInput);
        }
    }
}
WidgetTime.Render = (props) => {
    const config = props.config;
    const $value = props.value;
    const $onChange = props.onChange;
    useEffect(() => {
        useFormDebugStore.getState().update(props.formId, `Widget(${config.type}):${config.name}`, `EasyFormUnit:${config.name}`);
    }, []);
    return _jsx(TimePicker, { style: { width: '100%' }, onChange: $onChange, value: $value, placeholder: config.placeholder, ...config.features, disabled: config.disabled });
};
WidgetTime.component = (props) => {
    return (_jsx(WidgetTime.Render, { ...props }));
};
export { WidgetTime };
