import { jsx as _jsx } from "react/jsx-runtime";
import BaseAction from "./baseAction.js";

const tableActions = (actionConfig, type) => {
    return _jsx("div", { className: 'easy-table-actions-container', children: actionConfig.map((action, index) => {
            return _jsx(BaseAction, { ...action, buttonStyle: type }, index);
        }) });
};
const EasyTableActions = (actionConfig) => {
    return tableActions(actionConfig, 'default');
};
const EasyTableRowActions = (actionConfig) => {
    return tableActions(actionConfig, 'link');
};
export { EasyTableActions, EasyTableRowActions };
