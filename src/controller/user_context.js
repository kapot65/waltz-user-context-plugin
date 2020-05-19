import {Controller} from "@waltz-controls/middleware";
import {UserContext} from "../model/user_context";
import {kChannelLog, kTopicError, kUser} from "../context";

export const kControllerUserContext = 'controller:user_context';
export const kUserContext = 'context:user_context';

class DecoratedUserContext extends UserContext {
    constructor({user, tango_hosts, device_filters, ext, controller}) {
        super({user, tango_hosts, device_filters, ext});
        this.controller = controller;
    }

    save(host, options){
        return super.save(host, options)
            .then(resp => {
                if (resp.ok)
                    return this;
                else
                    throw new Error(`Failed to save UserContext[${context.user}] due to  ${resp.status}:${resp.statusText}`)
            })
            .catch(err => {
                this.dispatch(err, kTopicError, kChannelLog);
                throw err;
            })
    }

}


function defaultUserContext(user){
    return btoa(JSON.stringify(new UserContext({user, tango_hosts:{}, device_filters:["*/*/*"], ext:{}})))
}

/**
 * @type UserContextController
 * @extends Controller
 */
export class UserContextController extends Controller {
    /**
     *
     * @param {Application} app
     * @constructor
     */
    constructor(app) {
        super(kControllerUserContext, app);
    }

    /**
     * Inserts UserContext into app's context
     *
     * @return {Promise<void>}
     */
    async run() {
        const user = await this.app.getContext(kUser)
        this.app.registerContext(kUserContext, this.load(user.name, {headers: {...user.headers}})
            .catch(err => {
                this.dispatch(err, kTopicError, kChannelLog);
                throw err;//TODO throw critical error that prevents the whole application from proceeding
            }));
    }

    /**
     *
     * @param user
     * @param options
     * @return {Promise<UserContext>}
     */
    load(user, options){
        return fetch(`/user-context/cache?id=${user}`, options)
            .then(resp => {
                if(resp.ok)
                    return resp.text()
                else if(resp.status === 404)
                    return defaultUserContext(user);
                else
                    throw new Error(`Failed to load UserContext[${user}] due to ${resp.status}: ${resp.statusText}`);
            })
            .then(text => JSON.parse(atob(text)))
            .then(json => new DecoratedUserContext({...json}));
    }
}