import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import React from "react";
import { Col, Row } from "antd";
import { EasyFormUnit } from "../easyFormUnit/index.js";
export const Normal = (props) => {
    if (props.layout && props.layout.vertical) {
        return _jsx(_Fragment, { children: props.config.map((unit) => {
                return _jsx(Row, { gutter: 16, children: _jsx(Col, { span: 6, style: { display: unit.hide ? 'none' : '' }, children: _jsx(EasyFormUnit, { serviceInst: props.serviceInst, formId: props.formId, form: props.form, config: unit, layout: props.layout }) }) }, unit.name);
            }) });
    }
    return _jsx(_Fragment, { children: _jsx(Row, { gutter: 16, children: props.config.map((unit) => {
                return _jsx(Col, { style: { display: unit.hide ? 'none' : '' }, children: _jsx(EasyFormUnit, { serviceInst: props.serviceInst, formId: props.formId, form: props.form, config: unit, layout: props.layout }) }, unit.name);
            }) }) });
};
