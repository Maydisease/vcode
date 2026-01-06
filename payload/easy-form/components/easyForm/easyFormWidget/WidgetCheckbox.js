import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Checkbox } from "antd";
import lodash from "lodash";
import { LoadingOutlined } from "@ant-design/icons";
import useFormDebugStore from "@components/easyForm/easyFormDebug/store/index.js";
class WidgetCheckbox {
}
WidgetCheckbox.Render = (props) => {
    const config = props.config;
    const isArray = Array.isArray(config.data);
    const $value = props.value;
    const $onChange = props.onChange;
    const pureData = isArray ? config.data : [];
    const [data, setData] = useState(pureData);
    const [isLoading, setLoading] = useState(false);
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
    return (_jsx(_Fragment, { children: isLoading ? _jsx(LoadingOutlined, {}) : (_jsx(Checkbox.Group, { disabled: config.disabled, value: $value, onChange: $onChange, children: data.map((item) => {
                return (_jsx(Checkbox, { value: item.value, children: item.label }, `${item.label}_${item.value}`));
            }) })) }));
};
WidgetCheckbox.component = (props) => {
    return (_jsx(WidgetCheckbox.Render, { ...props }));
};
export { WidgetCheckbox };
