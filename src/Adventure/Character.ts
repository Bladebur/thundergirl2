import { Entity } from './Entity';

export class CharacterVariables {
    key?: string;
    maxObjectsCarried?: number = 99;
    inventory?: Entity[] = []
    location?: string = "destroyed";
    sitting?: string | boolean;
    sittingMode?: string;
}

export let DefaultCharacterVariables = new CharacterVariables();

export class Character extends CharacterVariables {

    private defaults: CharacterVariables;

    constructor(key: string, variables?: CharacterVariables) {
        super();
        this.defaults = new CharacterVariables();
        Object.assign(this.defaults, DefaultCharacterVariables);
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

    reset() {
        Object.assign(this, this.defaults);
    }
}