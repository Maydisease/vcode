import { WidgetText } from "../easyFormWidget/WidgetText.js";
import { WidgetTextArea } from "../easyFormWidget/WidgetTextArea.js";
import { WidgetNumber } from "../easyFormWidget/WidgetNumber.js";
import { WidgetSelect } from "../easyFormWidget/WidgetSelect.js";
import { WidgetDate } from "../easyFormWidget/WidgetDate.js";
import { WidgetDateRange } from "../easyFormWidget/WidgetDateRange.js";
import { WidgetSwitch } from "../easyFormWidget/WidgetSwitch.js";
import { WidgetRadio } from "../easyFormWidget/WidgetRadio.js";
import { WidgetCheckbox } from "../easyFormWidget/WidgetCheckbox.js";
import { WidgetTime } from "../easyFormWidget/WidgetTime.js";
import { WidgetTimeRange } from "../easyFormWidget/WidgetTimeRange.js";
import { WidgetCascader } from "@components/easyForm/easyFormWidget/WidgetCascader.js";
import { WidgetTreeSelect } from "@components/easyForm/easyFormWidget/WidgetTreeSelect.js";
import { WidgetPassword } from "@components/easyForm/easyFormWidget/WidgetPassword.js";
import { WidgetUpload } from "@components/easyForm/easyFormWidget/WidgetUpload.js";
export const WIDGET = {
    text: WidgetText.component,
    password: WidgetPassword.component,
    textArea: WidgetTextArea.component,
    number: WidgetNumber.component,
    select: WidgetSelect.component,
    date: WidgetDate.component,
    dateRange: WidgetDateRange.component,
    timeRange: WidgetTimeRange.component,
    switch: WidgetSwitch.component,
    radio: WidgetRadio.component,
    checkbox: WidgetCheckbox.component,
    cascader: WidgetCascader.component,
    treeSelect: WidgetTreeSelect.component,
    time: WidgetTime.component,
    upload: WidgetUpload.component,
    slot: undefined,
};
