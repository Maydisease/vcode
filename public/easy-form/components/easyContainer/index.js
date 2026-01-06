import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';

import classNames from "classnames";
export default ((props) => {
    const titleProp = props.title ? (_jsx("div", { className: 'title', children: props.title })) : void 0;
    const descProp = props.desc ? (_jsx("div", { className: 'desc', children: props.desc })) : void 0;
    const extendProp = props.extend ? (_jsx("div", { className: 'extend', children: props.extend })) : void 0;
    const titleBar = () => {
        if (!titleProp && !extendProp) {
            return void 0;
        }
        return _jsxs("div", { className: 'title-bar', children: [titleProp, descProp, _jsx("span", { className: 'spacer' }), extendProp] });
    };
    return _jsxs("div", { className: classNames('easy-container-component-container', {
            'clear-bottom-margin': props.clearBottomMargin,
            'transparent': props.transparent,
            'fill-height': props.fillHeight
        }), children: [titleBar(), _jsx("div", { className: classNames('body', {
                    'is-title-bar-hide': !props.title && !props.extend
                }), children: props.children })] });
});
