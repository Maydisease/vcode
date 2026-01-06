import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import lodash from 'lodash';
import { DatePicker, Dropdown } from "antd";
import dayjs from "dayjs";
import useFormDebugStore from "@components/easyForm/easyFormDebug/store/index.js";

import { ClockCircleOutlined } from '@ant-design/icons';
class WidgetDateRange {
    // 转换结果
    static resultTransform(name, config, values) {
        if (!(config.transformResult &&
            lodash.isArray(config.transformResult) &&
            config.transformResult.length === 2)) {
            return false;
        }
        const enableShowTimeFeature = lodash.get(config, 'features.showTime', false);
        const newValues = values;
        const value = newValues[name];
        if (lodash.has(values, name)) {
            if (!value || (value && !value[0] && !value[1])) {
                delete newValues[name];
                return false;
            }
            const startFieldKey = config.transformResult[0];
            const endFieldKey = config.transformResult[1];
            let startName = startFieldKey;
            let startFormat = "";
            let endName = endFieldKey;
            let endFormat = "";
            if (startFieldKey.indexOf(':') > -1) {
                [startName, startFormat] = startFieldKey.split(':');
            }
            if (endFieldKey.indexOf(':') > -1) {
                [endName, endFormat] = endFieldKey.split(':');
            }
            let startDate = dayjs(value[0]);
            let endDate = dayjs(value[1]);
            if (!enableShowTimeFeature) {
                startDate = startDate.startOf('day');
                endDate = endDate.endOf('day');
            }
            if (startFormat === 't0') {
                startDate = startDate.startOf('day');
            }
            if (endFormat === 't24') {
                endDate = endDate.endOf('day');
            }
            newValues[startName] = startDate.format('YYYY-MM-DD HH:mm:ss');
            newValues[endName] = endDate.format('YYYY-MM-DD HH:mm:ss');
            newValues[`__$transformResult__[${name}]->(${startName},${endName})__`] = value;
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
            let startDate = lodash.get(value, "[0]", null);
            let endDate = lodash.get(value, "[1]", null);
            if (startDate && endDate) {
                if (typeof config.transformInput === 'boolean') {
                    startDate = dayjs(startDate).format("YYYY-MM-DD HH:mm:ss");
                    endDate = dayjs(endDate).format("YYYY-MM-DD HH:mm:ss");
                }
                else if (lodash.isArray(config.transformInput) && config.transformInput.length === 2) {
                    const startFormat = config.transformInput[0];
                    const endFormat = config.transformInput[1];
                    if (typeof startFormat === "string" && typeof endFormat === "string") {
                        startDate = dayjs(startDate).format(startFormat);
                        endDate = dayjs(endDate).format(endFormat);
                    }
                }
            }
            return [startDate, endDate];
        }
    }
}
WidgetDateRange.Render = (props) => {
    const config = props.config;
    const $value = props.value;
    const $onChange = props.onChange;
    useEffect(() => {
        useFormDebugStore.getState().update(props.formId, `Widget(${config.type}):${config.name}`, `EasyFormUnit:${config.name}`);
    }, []);
    return _jsx(DatePicker.RangePicker, { onChange: $onChange, value: $value, style: { width: '100%', minWidth: 140 }, placeholder: config.placeholder, ...config.features, disabled: config.disabled });
};
WidgetDateRange.FastSelect = (props) => {
    const updateDateValue = (startDate) => {
        let payload = [null, null];
        if (startDate) {
            const endDate = dayjs();
            payload = [startDate, endDate];
        }
        props.serviceInst.$update(props.config.name, payload);
    };
    // props.serviceInst.$update(props.config.name, )
    return _jsx("div", { className: 'fast-select', children: _jsx(Dropdown, { menu: {
                items: [
                    {
                        label: "清理",
                        key: 0,
                        onClick: () => {
                            updateDateValue();
                        }
                    },
                    {
                        label: "今日",
                        key: 1,
                        onClick: () => {
                            updateDateValue(dayjs().startOf('day'));
                        }
                    },
                    {
                        label: "近七天",
                        key: 2,
                        onClick: () => {
                            const endDate = dayjs().subtract(7, 'day');
                            updateDateValue(endDate);
                        }
                    },
                    {
                        label: "近30天",
                        key: 3,
                        onClick: () => {
                            updateDateValue(dayjs().subtract(30, 'day'));
                        }
                    }
                ]
            }, trigger: ['click'], children: _jsx(ClockCircleOutlined, {}) }) });
};
WidgetDateRange.component = (props) => {
    return (_jsxs("div", { className: 'widget-date-range-custom-container', children: [_jsx(WidgetDateRange.Render, { ...props }), _jsx(WidgetDateRange.FastSelect, { ...props })] }));
};
export { WidgetDateRange };
