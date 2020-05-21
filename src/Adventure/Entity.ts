import { Order } from "./Order";
import { Adventure, State, Responses, ResponseFunction, ResponseTable } from "./Adventure";

type DescriptionFunction = (this: Entity, adventure?: Adventure) => string;

export interface Item {
    proper?: boolean;
    many?: boolean;
    name?: string;
    seen?: boolean;
    fullName?: (inventoryMode: boolean, adventure?: Adventure) => string;
}

export class EntityVariables {
    name?: string;
    proper?: boolean = false;
    many?: boolean = false;
    key?: string;
    wearable?: boolean = false;
    container?: boolean = false;
    sitting?: boolean = false;
    laying?: boolean = false;
    openable?: boolean = false;
    open?: boolean = false;
    worn?: boolean = false;
    scenery?: boolean = false;
    seen?: boolean = false;
    description?: string | DescriptionFunction;
    hidden?: boolean = false;
    noun?: string;
    adjective?: string;
    location: string = 'destroyed';
    printLocationNames?: boolean = false;
    inventoryDetails?: string | DescriptionFunction;
    details?: string | DescriptionFunction;
    exitNames?: { [exit: string]: string };
    responses?: ResponseTable;
    
    afterTurn?(this: Entity, order: Order, adventure: Adventure): State | void;
    before?(this: Entity, order: Order, adventure: Adventure): State | void;
    execute?(this: Entity, order: Order, adventure: Adventure): State | void;
}

export const DefaultEntityVariables = new EntityVariables();

export class Entity extends EntityVariables implements Item, Responses {
    protected defaults: EntityVariables;

    constructor(key: string, variables?: EntityVariables) {
        super();
        this.defaults = new EntityVariables();
        Object.assign(this.defaults, DefaultEntityVariables);
        Object.assign(this.defaults, variables);
        this.defaults.key = key;
        Object.assign(this, this.defaults);
    }

    serializeChanges() {
        let results: { [key: string]: any } = { key: this.key };
        let self = this as any;
        let defaults = this.defaults as any;
        for (let key of Object.keys(self)) {
            if (self[key] !== defaults[key] && typeof self[key] !== 'function' && typeof self[key] !== 'object') {
                results[key] = self[key];
            }
        }
        return results;
    }

    unserializeChanges(state: { [variable: string]: any }) {
        let self = this as any;
        let defaults = this.defaults as any;
        if (defaults) {
            Object.assign(this, this.defaults);
        }
        for (let key in state) {
            self[key] = state[key];
        }
    }

    public fullName(inventoryMode: boolean = false, adventure: Adventure) {
        var name = this.name;
        var details = inventoryMode ? (this.inventoryDetails || this.details) : this.details;
        if (typeof (details) == "function")
            details = details.call(this, adventure);
        if (details)
            name += " (" + details + ")";
        return name;
    }

    public reset() {
        Object.assign(this, this.defaults);
    }
}

export type Entities = { [key: string]: EntityVariables | Entity };