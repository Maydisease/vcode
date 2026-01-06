import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import { Input } from "antd";
import useFormDebugStore from "@components/easyForm/easyFormDebug/store/index.js";
class WidgetTextArea {
}
WidgetTextArea.Render = (props) => {
    const config = props.config;
    const $value = props.value;
    const $onChange = props.onChange;
    useEffect(() => {
        useFormDebugStore.getState().update(props.formId, `Widget(${config.type}):${config.name}`, `EasyFormUnit:${config.name}`);
    }, []);
    return (_jsx(Input.TextArea, { onChange: $onChange, allowClear: true, style: { minWidth: 140 }, placeholder: config.placeholder, ...config.features, disabled: config.disabled, value: $value }));
};
WidgetTextArea.component = (props) => {
    return (_jsx(WidgetTextArea.Render, { ...props }));
};
export { WidgetTextArea };
