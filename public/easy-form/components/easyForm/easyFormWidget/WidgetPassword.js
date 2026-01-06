import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import { Input } from "antd";
import useFormDebugStore from "@components/easyForm/easyFormDebug/store/index.js";
import { EyeFilled, EyeInvisibleFilled } from '@ant-design/icons';

import classNames from "classnames";
class WidgetPassword {
}
WidgetPassword.Render = (props) => {
    const [visibility, setVisibility] = React.useState(false);
    const config = props.config;
    const $value = props.value;
    const $onChange = props.onChange;
    useEffect(() => {
        useFormDebugStore.getState().update(props.formId, `Widget(${config.type}):${config.name}`, `EasyFormUnit:${config.name}`);
    }, []);
    return (_jsxs("div", { className: 'widget-password-custom-container', children: [_jsx(Input, { autoComplete: "new-password", onChange: $onChange, allowClear: false, style: { minWidth: 140 }, placeholder: config.placeholder, ...config.features, disabled: config.disabled, value: $value, styles: {
                    input: !visibility ? {
                        WebkitTextSecurity: 'disc'
                    } : {}
                } }), _jsxs("div", { className: classNames('switch-visibility', {
                    disabled: props.config.disabled,
                    active: visibility,
                }), onClick: (event) => {
                    setVisibility(!visibility);
                }, children: [visibility && _jsx(EyeFilled, {}) || void 0, !visibility && _jsx(EyeInvisibleFilled, {}) || void 0] })] }));
};
WidgetPassword.component = (props) => {
    return (_jsx(WidgetPassword.Render, { ...props }));
};
export { WidgetPassword };
