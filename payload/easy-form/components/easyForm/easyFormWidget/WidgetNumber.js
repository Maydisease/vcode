import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import { InputNumber } from "antd";
import useFormDebugStore from "@components/easyForm/easyFormDebug/store/index.js";
class WidgetNumber {
}
WidgetNumber.Render = (props) => {
    const config = props.config;
    const $value = props.value;
    const $onChange = props.onChange;
    useEffect(() => {
        useFormDebugStore.getState().update(props.formId, `Widget(${config.type}):${config.name}`, `EasyFormUnit:${config.name}`);
    }, []);
    return _jsx(InputNumber, { onChange: $onChange, value: $value, style: { width: '100%', minWidth: 140 }, placeholder: config.placeholder, ...config.features, disabled: config.disabled });
};
WidgetNumber.component = (props) => {
    return (_jsx(WidgetNumber.Render, { ...props }));
};
export { WidgetNumber };
