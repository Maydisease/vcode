import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Col, Row } from "antd";
import { EasyFormUnit } from "../easyFormUnit/index.js";
import React from "react";
import lodash from "lodash";

import { measureTextWidth } from "@utils/measureTextWIdth.util.js";
export const Matrix = (props) => {
    const parseConfig = (matrix) => {
        return matrix.map((row) => {
            let fixedSpans = row
                .map((cell) => cell.split(':')[1])
                .filter(Boolean)
                .reduce((sum, span) => sum + parseInt(span, 10), 0);
            let autoSpanCells = row.filter((cell) => !cell.includes(':')).length;
            let remainingSpace = 24 - fixedSpans;
            let autoSpan = Math.floor(remainingSpace / autoSpanCells);
            return row.map((cell) => {
                let [name, span] = cell.split(':');
                return {
                    name: name,
                    __layoutSpan: span ? parseInt(span, 10) : autoSpan
                };
            });
        });
    };
    let maxLabelWidth = -1;
    const createMatrixConfig = () => {
        if (!props.config.length) {
            return [];
        }
        const layout = parseConfig(props.layout.matrix);
        return layout.map((rows) => {
            const rest = rows.map((layoutItem) => {
                const unit = props.config.find((unitConfig) => unitConfig.name === layoutItem.name);
                if (unit) {
                    let textWidth = measureTextWidth(unit.label || "", 14, 0);
                    if (unit.label && textWidth > maxLabelWidth) {
                        maxLabelWidth = textWidth;
                    }
                    return { ...unit, __layoutSpan: layoutItem.__layoutSpan };
                }
                else {
                    if (props.config.length) {
                        console.warn(`矩阵计算时，在formConfig中未找到 name = "${layoutItem.name}" 的控件，请检查配置`);
                    }
                }
                return layoutItem;
            });
            return rest;
        });
    };
    const matrixMode = lodash.get(props, 'layout.matrixMode', undefined);
    // display:grid 布局方式
    if (matrixMode === "grid") {
        return _jsx(_Fragment, { children: _jsx("div", { className: 'grid-layout-container', children: createMatrixConfig().map((formConfig, index) => (formConfig.map((unit) => {
                    return (_jsx(EasyFormUnit, { formId: props.formId, span: unit.__layoutSpan, maxLabelWidth: lodash.get(props, 'layout.labelWidth', 0) || maxLabelWidth, form: props.form, config: unit, layout: props.layout, serviceInst: props.serviceInst }, unit.name));
                }))) }) });
    }
    // 网格布局方式
    return _jsx(_Fragment, { children: createMatrixConfig().map((formConfig, index) => {
            return (_jsx(Row, { gutter: 16, children: formConfig.map((unit) => {
                    return _jsx(Col, { span: unit.__layoutSpan, style: { display: unit.hide ? 'none' : '' }, children: _jsx(EasyFormUnit, { formId: props.formId, maxLabelWidth: lodash.get(props, 'layout.labelWidth', 0) || maxLabelWidth, form: props.form, config: unit, layout: props.layout, serviceInst: props.serviceInst }, unit.name) }, unit.name);
                }) }, index));
        }) });
};
