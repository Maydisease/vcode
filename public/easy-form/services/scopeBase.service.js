import lodash from "lodash";

class ScopeBaseService {
    constructor() {
        this.search = {};
        this.pageInfo = {
            current: 1,
            pageSize: 10,
            total: 0,
        };
    }

    clearSearch() {
        this.search = {};
    }

    updateSearch(params) {
        this.search = { ...this.search, ...params };
    }

    updatePageInfo(pageInfo) {
        this.pageInfo = { ...this.pageInfo, ...pageInfo };
    }

    updatePageInfoPro(response) {
        let total = lodash.get(response, 'total', 0);
        let current = lodash.get(response, 'current', 0);
        let pageSize = lodash.get(response, 'pageSize', 0);
        if (response.pageinfo) {
            total = response.__proto__.pageinfo.total;
            current = response.__proto__.pageinfo.current;
            pageSize = response.__proto__.pageinfo.pageSize;
        }
        const config = {
            total,
            current,
            pageSize
        };

        this.updatePageInfo(config);
    }

    getPageInfo() {
        return this.pageInfo;
    }

    getPurePageInfo() {
        return {
            current: this.pageInfo.current,
            pageSize: this.pageInfo.pageSize
        };
    }

    resetPageInfo() {
        this.pageInfo = {
            current: 1,
            pageSize: 10,
            total: 0,
        };
    }
}

export { ScopeBaseService };
