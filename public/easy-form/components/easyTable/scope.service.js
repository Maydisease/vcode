import lodash from "lodash";
import { ScopeBaseService } from "@services/scopeBase.service.js";
import { httpClient } from "@services/http/httpClient.service.js";
import { message } from "antd";
class ScopeService extends ScopeBaseService {
    constructor() {
        super();
    }
    async getDataTableColumn(code, enableMockMode = false, columnsDetailApiPrefix) {
        this.columnsCode = code;
        this.columnsDetailApiPrefix = columnsDetailApiPrefix;
        // isMockMode
        let address = '/dis/common/column/config/detail';
        if (columnsDetailApiPrefix) {
            address = `${columnsDetailApiPrefix}/common/column/config/detail`;
        }
        if (enableMockMode) {
            address = '/pe/common/column/config/detail';
        }
        const [err, response] = await httpClient.post(address, { code });
        if (err) {
            return void 0;
        }
        return {
            tableTitle: lodash.get(response, 'tableTitle', undefined),
            title: lodash.get(response, 'title', undefined),
            defaultDateRangeType: lodash.get(response, 'defaultDateRangeType', undefined),
            showNum: lodash.get(response, 'showNum', 0),
            list: (lodash.get(response, 'fields', []) || []).map((item) => {
                return {
                    key: item.columnKey,
                    dataIndex: item.columnKey,
                    title: item.columnAlias || item.columnLabel,
                    show: item.showed === 1
                };
            })
        };
    }
    modifyTitle(title) {
        return new Promise((resolve) => {
            httpClient.post('/dis/common/column/config/updateTableTitle', {
                code: this.columnsCode,
                tableTitle: title
            }).then(([err, data]) => {
                if (!err) {
                    message.success('修改成功');
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            });
        });
    }
}
const scopeService = new ScopeService();
export { scopeService };
