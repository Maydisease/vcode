import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Select } from "antd";
import lodash from "lodash";
import useFormDebugStore from "@components/easyForm/easyFormDebug/store/index.js";
class WidgetSelect {
}
WidgetSelect.Render = (props) => {
    const config = props.config;
    const $value = props.value;
    const $onChange = props.onChange;
    const isArray = Array.isArray(config.data);
    const pureData = isArray ? config.data : [];
    const [isLoad, setLoading] = useState(false);
    const [data, setData] = useState(pureData);
    useEffect(() => {
        useFormDebugStore.getState().update(props.formId, `Widget(${config.type}):${config.name}`, `EasyFormUnit:${config.name}`);
    }, []);
    useEffect(() => {
        if (!isArray && lodash.isFunction(config.data)) {
            setLoading(true);
            config.data().then((response) => {
                setData(response || []);
                setLoading(false);
            });
        }
        else {
            setData(config.data || []);
        }
    }, [config.data]);
    useEffect(() => {
    }, [config.disabled]);
    return (_jsx(Select, { "data-testid": `widget-select-${config.name}`, loading: isLoad, value: $value, onChange: $onChange, allowClear: true, showSearch: true, filterOption: (input, option) => {
            let label = "";
            if (option && option.label) {
                label = option.label;
            }
            return label.toLowerCase().includes(input.toLowerCase());
        }, style: { minWidth: 140 }, placeholder: config.placeholder, ...config.features, disabled: config.disabled, children: data.map((item) => {
            return (_jsx(Select.Option, { label: item.label, "data-testid": `widget-select-option-${item.value}`, value: item.value, children: item.label }, `${item.label}_${item.value}`));
        }) }));
};
WidgetSelect.component = (props) => {
    return (_jsx(WidgetSelect.Render, { ...props }));
};
export { WidgetSelect };
