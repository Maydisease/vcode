import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import { Switch } from "antd";
import useFormDebugStore from "@components/easyForm/easyFormDebug/store/index.js";
class WidgetSwitch {
}
WidgetSwitch.Render = (props) => {
    const config = props.config;
    const $value = props.value;
    const $onChange = props.onChange;
    useEffect(() => {
        useFormDebugStore.getState().update(props.formId, `Widget(${config.type}):${config.name}`, `EasyFormUnit:${config.name}`);
    }, []);
    return _jsx(Switch, { onChange: $onChange, value: $value, placeholder: config.placeholder, ...config.features, disabled: config.disabled });
};
WidgetSwitch.component = (props) => {
    return (_jsx(WidgetSwitch.Render, { ...props }));
};
export { WidgetSwitch };
