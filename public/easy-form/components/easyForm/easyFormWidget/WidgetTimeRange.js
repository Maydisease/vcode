import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import lodash from 'lodash';
import { TimePicker } from "antd";
import dayjs from "dayjs";
import useFormDebugStore from "@components/easyForm/easyFormDebug/store/index.js";
class WidgetTimeRange {
    // 转换结果
    static resultTransform(name, config, values) {
        if (!(config.transformResult &&
            lodash.isArray(config.transformResult) &&
            config.transformResult.length === 2)) {
            return false;
        }
        const newValues = values;
        const value = newValues[name];
        if (lodash.has(values, name)) {
            if (!value) {
                delete newValues[name];
                return false;
            }
            const startFieldKey = config.transformResult[0];
            const endFieldKey = config.transformResult[1];
            newValues[startFieldKey] = dayjs(value[0]).format('YYYY-MM-DD HH:mm:ss');
            newValues[endFieldKey] = dayjs(value[1]).format('YYYY-MM-DD HH:mm:ss');
            newValues[`__$transformResult__[${name}]->(${startFieldKey},${endFieldKey})__`] = value;
            delete newValues[name];
        }
        return newValues;
    }
    static inputTransform(value, config) {
        if (!(typeof lodash.get(value, '[0]', undefined) === "string" &&
            typeof lodash.get(value, '[1]', undefined) === "string")) {
            return value;
        }
        if (!config.transformInput) {
            return value;
        }
        if (config.transformInput) {
            let start = lodash.get(value, "[0]", null);
            let end = lodash.get(value, "[1]", null);
            if (start && end) {
                if (typeof config.transformInput === 'boolean') {
                    start = dayjs(start).format("YYYY-MM-DD HH:mm:ss");
                    end = dayjs(end).format("YYYY-MM-DD HH:mm:ss");
                }
                else if (lodash.isArray(config.transformInput) && config.transformInput.length === 2) {
                    const startFormat = config.transformInput[0];
                    const endFormat = config.transformInput[1];
                    if (typeof startFormat === "string" && typeof endFormat === "string") {
                        start = dayjs(start).format(startFormat);
                        end = dayjs(end).format(endFormat);
                    }
                }
            }
            return [start, end];
        }
    }
}
WidgetTimeRange.Render = (props) => {
    const config = props.config;
    const $value = props.value;
    const $onChange = props.onChange;
    useEffect(() => {
        useFormDebugStore.getState().update(props.formId, `Widget(${config.type}):${config.name}`, `EasyFormUnit:${config.name}`);
    }, []);
    return _jsx(_Fragment, { children: _jsx(TimePicker.RangePicker, { style: { width: '100%', minWidth: 140 }, onChange: $onChange, value: $value, placeholder: config.placeholder, ...config.features, disabled: config.disabled }) });
};
WidgetTimeRange.component = (props) => {
    return (_jsx(WidgetTimeRange.Render, { ...props }));
};
export { WidgetTimeRange };
