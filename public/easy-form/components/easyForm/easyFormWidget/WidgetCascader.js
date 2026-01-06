import { jsx as _jsx } from "react/jsx-runtime";
import { Cascader } from "antd";
import React, { useEffect, useState } from "react";
import lodash from "lodash";
import useFormDebugStore from "@components/easyForm/easyFormDebug/store/index.js";
class WidgetCascader {
}
WidgetCascader.Render = (props) => {
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
    return _jsx(Cascader, { loading: isLoad, style: { width: '100%' }, options: data, value: $value, onChange: $onChange, placeholder: config.placeholder, ...config.features, disabled: config.disabled });
};
WidgetCascader.component = (props) => {
    return (_jsx(WidgetCascader.Render, { ...props }));
};
export { WidgetCascader };
