class HashQueryParams {
    static encode(obj, newPath, saveKey = 's_f') {
        if (Object.keys(obj).length === 1 && obj.hasOwnProperty('search')) {
            obj = { ...obj.search };
        }
        if (!obj.hasOwnProperty('__$expired')) {
            obj['__$expired'] = new Date().getTime();
        }
        const url = new URL(document.location.href);
        let hash = url.hash;
        let queryParams = {};
        if (hash.indexOf('?') > -1) {
            const searchParams = new URLSearchParams(hash.substring(hash.indexOf('?'), hash.length));
            searchParams.forEach((value, key) => {
                queryParams[key] = value;
            });
        }
        if (queryParams[saveKey]) {
            delete queryParams[saveKey];
        }
        let formValue = '';
        for (let key of Object.keys(obj)) {
            const value = obj[key];
            if (key && value) {
                formValue += `${key}^${value},`;
            }
        }
        if (formValue) {
            formValue = formValue.substring(0, formValue.length - 1);
            queryParams[saveKey] = formValue;
        }
        const hashSearchParams = new URLSearchParams(queryParams);
        if (hash.indexOf('?') > -1) {
            hash = hash.substring(0, hash.indexOf('?'));
        }
        let pureHash = hash.replace('#', '');
        if (newPath === null) {
            return hashSearchParams.toString();
        }
        return `${newPath || pureHash}?${hashSearchParams.toString()}`;
    }
    static decode(saveKey = 's_f') {
        let hash = window.location.hash;
        let hashQueryParamsString = '';
        let formSearchParams = {
            searchForm: {}
        };
        if (saveKey === 's_f') {
            formSearchParams.searchForm = {};
        }
        else {
            formSearchParams[saveKey] = {};
        }
        if (hash.indexOf('?') > -1) {
            hashQueryParamsString = hash.substring(hash.indexOf('?'), hash.length);
        }
        if (hashQueryParamsString) {
            new URLSearchParams(hashQueryParamsString).forEach((value, key) => {
                if (key === saveKey) {
                    const params = value.split(',');
                    params.forEach((item) => {
                        const [_key, _value] = item.split('^');
                        if (_key && _value) {
                            if (saveKey === 's_f') {
                                formSearchParams.searchForm[_key] = _value;
                            }
                            else {
                                formSearchParams[saveKey][_key] = _value;
                            }
                        }
                    });
                }
                else {
                    formSearchParams[key] = value;
                }
            });
        }
        return formSearchParams;
    }
}
export { HashQueryParams };
