/**
 * Model device_filter
 * @class
 * @type {DeviceFilter}
 * @property {string} user
 * @property {string[]} value
 */
export class DeviceFilter {
    constructor({user,value}) {
        this.user=user;
        this.value=value;
        this.domain_filter=[];
            /** @member {family_filter} */
        this.family_filter=[];
            /** @member {member_filter} */
        this.member_filter=[];

        const domains_map = this.value
            .map(function(it){
                return it.split('/')[0] + "*"});
        this.domain_filter =
            domains_map
                .filter(function (item, pos) {
                    return this.indexOf(item) === pos}, domains_map);
        const families_map = this.value.map(function(it){
            return it.split('/')[0] + '/' + it.split('/')[1]});
        this.family_filter =
            families_map.filter(function (item, pos) {
                return this.indexOf(item) === pos}, families_map);
        this.member_filter =
            this.value.map(function(it){
                return it});

        console.debug(["Created new DeviceFilter[user=",this.user,", value=",this.value,"]"].join(''));
    }

    /**
     * @return {boolean} true if this filter
     */
    isUniversal(){
        return this.value.length === 1 && this.value[0] === '*/*/*';
    }

    /**
     *
     * @return {string[]}
     */
    getDomainFilters(){
        return this.domain_filter;
    }
    /**
     * @param domain
     * @return {string[]}
     */
    getFamilyFilters(domain) {
        return this.family_filter.filter(function(it){
            return it.startsWith(domain) || it.startsWith("*");
        }).map(function (it) {
            let result = domain + '/' + it.split('/')[1];
            if(!result.endsWith("*")) result += "*";
            return result;
        })
    }
    /**
     * @param domain
     * @param family
     * @return {string[]}
     */
    getMemberFilters(domain, family){
        return this.member_filter.filter(function(it){
            //TODO use regex here
            return (it.split('/')[0] == domain || it.split('/')[0] === "*")
                && (it.split('/')[1] == family || it.split('/')[1] === "*");
        }).map(function(it){
            return [domain, family, it.split('/')[2]].join('/');
        })
    }

}

const kUserContextUrl = '/user-context/cache';
/**
 * Model user_context
 *
 * Contains associated with this user data e.g. rest_url, tango_hosts, device filters
 *
 * Extends {@link https://jmvc-15x.github.io/docs/classes/MVC.Model.html MVC.Model}
 * @namespace {TangoWebappPlatform}
 * @name {UserContext}
 * @property {string} user
 * @property {string} rest_url
 * @property {{}} tango_hosts
 * @property {string[]} device_filters
 * @property {Object} ext
 */
export class UserContext {
    constructor({user, tango_hosts, device_filters, ext}) {
        this.user = user;
        this.tango_hosts = tango_hosts;
        this.device_filters = device_filters;
        this.ext = ext;
    }

    /**
     *
     * @return {Array}
     */
    getTangoHosts(){
        return Object.entries(this.tango_hosts).map(([key, value]) => key);
    }

    /**
     *
     * @param host
     * @return {UserContext}
     */
    addTangoHost(host){
        this.tango_hosts[host] = null
        return this;
    }

    /**
     *
     * @param host
     * @return {UserContext}
     */
    removeTangoHost(host){
        delete this.tango_hosts[host];
        return this;
    }

    /**
     *
     */
    toDeviceFilter() {
        return new DeviceFilter({
            user: this.user,
            value: this.device_filters
        });
    }

    /**
     *
     * @param {string} [host=''] host
     * @param {object} [options={}] options
     * @return {Promise<Response>}
     */
    save(host = '', options = {}){
        return fetch(`${host}${kUserContextUrl}`,{
            ...options,
            method: 'post',
            headers: {
                ...options.headers,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `id=${this.user}&data=${btoa(JSON.stringify({...this}))}`
        })
    }

    /**
     *
     * @param {string} id
     * @param {*} def
     * @return {*}
     */
    getOrDefault(id, def){
        return this.ext[id] || (this.ext[id] = def);
    }

    /**
     *
     * @param {string} id
     * @return {*}
     */
    get(id){
        return this.ext[id];
    }

    /**
     *
     * @param {string} id
     * @param {function(any):void} extUpdater
     * @return {UserContext}
     */
    updateExt(id, extUpdater){
        extUpdater(this.get(id));
        return this;
    }

    /**
     *
     * @param {string} [host = ''] host
     * @param {object} [options = {}] options
     * @return {Promise<Response>}
     */
    delete(host = '', options = {}){
        return fetch(`${host}${kUserContextUrl}`,{
            ...options,
            method: 'post',
            headers: {
                ...options.headers,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `id=${this.user}`
        })
    }
}
