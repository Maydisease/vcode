import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Radio } from "antd";
import lodash from "lodash";
import { LoadingOutlined } from '@ant-design/icons';
import useFormDebugStore from "@components/easyForm/easyFormDebug/store/index.js";
class WidgetRadio {
}
WidgetRadio.Render = (props) => {
    const config = props.config;
    const $value = props.value;
    const $onChange = props.onChange;
    const isArray = Array.isArray(config.data);
    const pureData = isArray ? config.data : [];
    const [data, setData] = useState(pureData);
    const [isLoading, setLoading] = useState(false);
    const featuresGroup = (lodash.get(props, 'config.features.group', {}) || {});
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
            setData(config.data);
        }
    }, [config.data]);
    return (_jsx(_Fragment, { children: isLoading ? _jsx(LoadingOutlined, {}) : (_jsx(Radio.Group, { ...lodash.omit(featuresGroup, 'optionType'), value: $value, onChange: $onChange, disabled: config.disabled, children: data.map((item) => {
                if (lodash.get(featuresGroup, 'optionType', 'default') === 'button') {
                    return (_jsx(Radio.Button, { value: item.value, children: item.label }, `${item.label}_${item.value}`));
                }
                return (_jsx(Radio, { value: item.value, children: item.label }, `${item.label}_${item.value}`));
            }) })) }));
};
WidgetRadio.component = (props) => {
    return _jsx(WidgetRadio.Render, { ...props });
};
export { WidgetRadio };
