import { Adventure, State, ResponseFunction, Responses, ResponseTable } from "./Adventure";
import { Order } from "./Order";

export type LocationFunction = (this: Location, adventure: Adventure) => string;
export type ReachFunction = (location: Location, adventure: Adventure) => string[];

export class LocationVariables {
    key?: string;
    description?: string | LocationFunction;
    name?: string = '';
    brief?: string;
    seen?: boolean = false;
    hideObjects?: boolean = false;
    exits?: { [exit: string]: string };
    exitNames?: { [exit: string]: string };
    directions?: { [exit: string]: string | LocationFunction };
    reach?: string[] | ReachFunction;
    responses?: ResponseTable;
    areas?: string[];
    area?: string;

    afterDescription?(adventure: Adventure): void;
    before?(order: Order, adventure: Adventure): State;
    execute?(order: Order, adventure: Adventure): State;
}

export let DefaultLocationVariables = new LocationVariables();

export class Location extends LocationVariables implements Responses {
    private defaults: LocationVariables;

    constructor(public key: string, variables?: LocationVariables) {
        super();
        this.defaults = new LocationVariables();
        Object.assign(this.defaults, DefaultLocationVariables);
        Object.assign(this.defaults, variables);
        this.defaults.key = key;
        Object.assign(this, this.defaults);
    }

    serializeChanges() {
        let results: { [key: string]: any } = { key: this.key };
        let self = this as any;
        let defaults = this.defaults as any;
        for (let key of Object.keys(self)) {
            if (self[key] !== defaults[key] && typeof self[key] !== 'function' && typeof self[key] !== 'object')
                results[key] = self[key];
        }
        return results;
    }

    unserializeChanges(state: { [variable: string]: any }) {
        let self = this as any;
        for (let key in state) {
            self[key] = state[key];
        }
    }

	reset = function() {
        Object.assign(this, this.defaults);
    }
}

export type Locations = { [key: string]: LocationVariables | Location };