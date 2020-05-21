import { Character } from './Character';
import { Location } from './Location';
import { Module } from './Module';
import { Order } from './Order';
import { Entity, Item } from './Entity';
import { Vocabulary, WordType, WordDefinition } from './Vocabulary';
import { Output } from './Output';
import { English } from './English';

function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export type ResponseFunction = (this: Adventure, order: Order, item?: Item) => State | void;
export type ResponseTable = { [orders: string]: ResponseFunction | string };
export interface Responses {
    responses?: ResponseTable
}

export enum State {
    DONE = 0,
    NOTDONE = 1,
    WAIT = 2,
    ASK = 3,
    RESTART = 4,
    NOACTION = -1
}

export const DONE = State.DONE;
export const NOTDONE = State.NOTDONE;
export const WAIT = State.WAIT;
export const ASK = State.ASK;
export const NOACTION = State.NOACTION;
export const RESTART = State.RESTART;

export class AdventureVariables {
    prompt = "> ";
    askPrompt = "> ";
    thirdPerson = true;
    inventoryMode: boolean = true;
    printLocationNames: boolean = false;
    exitNames?: { [exit: string]: string };

    /** True if currently executing a sub-order (such as one of the TAKE objects inside a TAKE ALL)
     *  Partial orders won't advance the current turn and will not show success responses.
     */
    partialOrder = false;
};

export let DefaultAdventureVariables = new AdventureVariables();

class SaveState {
    entities: { [variable: string]: any }[];
    locations: { [variable: string]: any }[];
    player: { [variable: string]: any };
    variables: { [variable: string]: any };
}

export class Adventure extends AdventureVariables {

    private defaults: AdventureVariables;

    public output: Output;
    public initialState: SaveState;

    public entities: Entity[] = [];
    public locations: Location[] = [];
    public vocabulary: Vocabulary = new Vocabulary();
    public synonyms = {};
    public order: Order = null;
    public areas: { [name: string]: Responses } = {};
    public player: Character;
    public autoIndent = "    ";

    public askCallback: (response: string) => State;

    private modules: Module[] = [];

    public currentMessage = "";

    private remainingText = "";
    private currentOrder: Order;
    private waitOrder: Order;
    private askOrder: Order;
    private lastNoun: string;
    private lastNounAsWritten: string;
    private skipResponses: boolean = false;

    constructor() {
        super();
        this.player = new Character("player");

        this.defaults = new AdventureVariables();
        Object.assign(this.defaults, DefaultAdventureVariables);
        Object.assign(this, this.defaults);

        this.addModule(English);
    }

    saveDefaultVariables() {
        Object.assign(this.defaults, this);
    }

    reset() {
        for (var location of this.locations)
            location.reset();
        for (var entity of this.entities)
            entity.reset();
    }

    addResponseWords(responses: ResponseTable) {
        if (!responses)
            return;
        for (var key in responses) {
            var parts = key.split(",");
            for (var p = 0; p < parts.length; p++) {
                var words = parts[p].trim().split(" ");
                for (var n = 0; n < words.length; n++) {
                    if (words[n] === '*' || words[n] === '_')
                        continue;
                    if (this.vocabulary.findWord(words[n]))
                        continue;
                        this.vocabulary.addWord(words[n], n > 0 ? WordType.Noun : WordType.Verb);
                }
            }
        }
    };

    addModule(module: Module) {
        this.modules.push(module);
        this.vocabulary.addWords(module);
        this.addResponseWords(module.responses);
        if (module.locations) {
            for (var key in module.locations) {
                let location = module.locations[key];
                if (!(location instanceof Location))
                    location = new Location(key, module.locations[key]);
                this.locations.push(location as Location);
                this.addResponseWords(location.responses);
            }
        }
        if (module.entities) {
            for (var key in module.entities) {
                let entity: Entity;
                if (module.entities[key] instanceof Entity) {
                    entity = module.entities[key] as Entity;
                } else {
                    entity = new Entity(key, module.entities[key]);
                }
                if (!entity.name) {
                    entity.name= key;
                }
                if (!entity.noun) {
                    let words = entity.name.split(' ');
                    let noun = words[words.length - 1];
                    entity.noun = noun;
                }
                this.addResponseWords(entity.responses);
                this.vocabulary.addWord(entity.noun, WordType.Noun);
                this.vocabulary.addWord(entity.adjective, WordType.Noun);
                this.entities.push(entity);
            }
        }
        if (module.areas) {
            for (var key in module.areas) {
                this.areas[key] = module.areas[key];
                this.addResponseWords(module.areas[key].responses);
            }
        }
    }

    exitsFrom(location: Location): Item[] {
        var list: Item[] = [];
        if (!location.exits)
            return list;
        for (var exit in location.exits) {
            var name = exit;
            if (location.exitNames && location.exitNames[name])
                name = location.exitNames[name];
            if (this.exitNames && this.exitNames[name])
                name = this.exitNames[name];
            for (var module of this.modules) {
                if (module.exitNames && module.exitNames[name])
                    name = module.exitNames[name];
            }
            if (location.directions && location.directions[exit]) {
                var directions = location.directions[exit];
                if (typeof directions === "function") {
                    directions = directions.call(location, this);
                }
                name = name + " (" + directions + ")";
            }
            list.push({
                name: name,
                proper: true
            });
        }
        return list;
    }

    parsedProperObjectName(object: Item): string {
        var text = "";
        var from = 0;
        for (var n = 0; n < object.name.length; n++) {
            if (object.name.charAt(n) == '[') {
                text += object.name.substring(from, n);
                from = n + 1;
                while (n < object.name.length && object.name.charAt(n) != ']')
                    n++;
                var code = object.name.substring(from, n);
                switch (code) {
                    case "your":
                    case "yours":
                        if (!this.thirdPerson)
                            text += "my";
                        else
                            text += code;
                        break;
                    default:
                        text += code;
                        break;
                }
                from = n + 1;
                continue;
            }
        }
        return text + object.name.substring(from, object.name.length);
    };

    parseMessageCode(code: string, param: string | Item | Item[]) {
        var object: Item;
        if (param && typeof (param) == "string")
            object = { name: param };
        else if (!param)
            param = { name: 'that', proper: true };
        else if (typeof param === "object" && !Array.isArray(param))
            object = param;

        var result = "";
        var separator = " and ";
        switch (code) {
            case "You":
            case "you":
                if (!this.thirdPerson)
                    result += "I";
                else
                    result += code;
                break;

            case "me":
                if (!this.thirdPerson)
                    result += code;
                else
                    result += "you";
                break;

            case "Me":
                if (!this.thirdPerson)
                    result += code;
                else
                    result += "You";
                break;

            case "Your":
                if (!this.thirdPerson)
                    result += "My";
                else
                    result += code;
                break;

            case "your":
                if (!this.thirdPerson)
                    result += "my";
                else
                    result += code;
                break;

            case "me":
                if (this.thirdPerson)
                    result += "you";
                else
                    result += code;
                break;

            case "my":
                if (this.thirdPerson)
                    result += "your";
                else
                    result += code;
                break;

            case "mine":
                if (this.thirdPerson)
                    result += "yours";
                else
                    result += code;
                break;

            case "yourself":
                if (!this.thirdPerson)
                    result += "myself";
                else
                    result += code;
                break;

            case "yours":
                if (!this.thirdPerson)
                    result += "mine";
                else
                    result += code;
                break;

            case "Yours":
                if (!this.thirdPerson)
                    result += "Mine";
                else
                    result += code;
                break;

            case "You'd":
            case "you'd":
                if (!this.thirdPerson)
                    result += "I'd";
                else
                    result += code;
                break;

            case "You're":
            case "you're":
                if (!this.thirdPerson)
                    result += "I'm";
                else
                    result += code;
                break;

            case "You were":
            case "you were":
                if (!this.thirdPerson)
                    result += "I was";
                else
                    result += code;
                break;

            case "I am":
                if (this.thirdPerson)
                    result += "You are";
                else
                    result += code;
                break;

            case "You are":
            case "you are":
                if (!this.thirdPerson)
                    result += "I am";
                else
                    result += code;
                break;

            case "the options":
                separator = " or ";

            /* falls through */
            case "list":
            case "a list":
            case "the list":
            case "List":
            case "A list":
            case "The list":
                var pre = code.replace(" list", " object").replace(" options", " object");
                if (Array.isArray(param)) {
                    for (var n = 0; n < param.length; n++) {
                        result += this.parseMessageCode(pre, param[n]);
                        pre = pre.toLowerCase();
                        if (n < param.length - 2)
                            result += ", ";
                        else if (n < param.length - 1)
                            result += separator;
                    }
                }
                break;

            case "object":
                if (object.proper)
                    result += this.parsedProperObjectName(object);
                else
                    result += object.fullName(this.inventoryMode, this);
                object.seen = true;
                break;

            case "A object":
            case "An object":
                if (object.proper)
                    result += capitalizeFirstLetter(this.parsedProperObjectName(object));
                else if (object.many)
                    result += capitalizeFirstLetter(object.fullName(this.inventoryMode, this));
                else if (object.name.substring(0, 1).match(/[aeiou]/i))
                    result += "An " + object.fullName(this.inventoryMode, this);
                else
                    result += "A " + object.fullName(this.inventoryMode, this);
                object.seen = true;
                break;

            /* falls through */
            case "The object":
                if (object.proper)
                    result += capitalizeFirstLetter(this.parsedProperObjectName(object));
                else
                    result += "The " + object.fullName(this.inventoryMode, this);
                object.seen = true;
                break;

            case "a object":
            case "an object":
                if (!object.seen) {
                    if (object.proper)
                        result += this.parsedProperObjectName(object);
                    else if (object.many)
                        result += object.fullName(this.inventoryMode, this);
                    else if (object.name.substring(0, 1).match(/[aeiou]/i))
                        result += "an " + object.fullName(this.inventoryMode, this);
                    else
                        result += "a " + object.fullName(this.inventoryMode, this);
                    object.seen = true;
                    break;
                }

            /* falls through */
            case "the object":
                if (object.proper)
                    result += this.parsedProperObjectName(object);
                else
                    result += "the " + object.fullName(this.inventoryMode, this);
                object.seen = true;
                break;

            default:
                if (code.match(/^[Yy]ou.*\|/)) {
                    var personSplit = code.split("|");
                    if (this.thirdPerson)
                        result += personSplit[0];
                    else
                        result += personSplit[1];
                } else {
                    console.log("Unknown special message code \"" + code + "\"");
                }
                break;
        }

        return result;
    };

    processMessage(text: string): string {
        var previousMessage = this.currentMessage;
        this.currentMessage = "";
        this.mess(text);
        var result = this.currentMessage;
        this.currentMessage = previousMessage;
        return result;
    };

    parseMessage(text: string, param?: Item | Item[]) {
        var from = 0;
        var result = "";
        for (var n = 0; n < text.length; n++) {
            if (text.charAt(n) == '[') {
                result += text.substring(from, n);
                from = n + 1;
                while (n < text.length && text.charAt(n) != ']')
                    n++;
                result += this.parseMessageCode(text.substring(from, n), param);
                from = n + 1;
                continue;
            }
        }
        result += text.substring(from);
        return result;
    };

    waitForKey(callback: (key: string) => State | void) {
        this.waitOrder = this.currentOrder;
        this.output.print(this.currentMessage);
        this.currentMessage = "";
        this.output.getKey((key: string) => {
            let result: State = DONE;
            if (callback) {
                let r = callback(key);
                if (r != undefined)
                    result = r as State;
            }
            if (result != WAIT && result != RESTART) {
                if (result == undefined)
                    result = NOTDONE;
                this.resolveTurn(this.waitOrder, result);
                this.output.print(this.currentMessage);
                this.currentMessage = "";
                this.waitOrder = null;
                this.output.print("\n");
                this.output.input(this.prompt, text => this.processInputText(text));
            }
        });
        return WAIT;
    };

    mess(text: string, param?: Item | Item[]) {
        var textToAdd = this.parseMessage(text, param);
        if (this.currentMessage && this.currentMessage.slice(-1) == '\n' && !this.currentMessage.endsWith("\n" + this.autoIndent + "\n") && !textToAdd.match(/^[<]/))
            textToAdd = textToAdd.replace(/^ */, this.autoIndent);
        this.currentMessage += textToAdd;
        this.currentMessage = this.currentMessage.replace(/([^\n])\n */g, "$1\n" + this.autoIndent);
    }

    message(text: string, param?: Item | Item[]) {
        return this.mess(text + "\n", param);
    }

    clear() {
        this.currentMessage = "";
        this.output.clear();
    }

    findLocation(key: string): Location {
        for (var location of this.locations)
            if (location.key === key)
                return location;
        return null;
    }

    findEntity(key: string): Entity {
        for (var entity of this.entities)
            if (entity.key === key)
                return entity;
        return null;
    }

    objectsHere(): Entity[] {
        var result = [];
        for (var object of this.entities) {
            if (object.location == 'inventory' || this.inReach(object.location))
                result.push(object);
        }
        return result;
    }

    inReach(location: string | Location | Entity): boolean {
        if (location instanceof Entity) {
            location = location.location;
        }
        if (typeof location === 'string') {
            if (location === 'inventory')
                return true;
            var asLocation = this.findLocation(location);
            while (asLocation == null) {
                var entity = this.findEntity(location);
                if (entity == null)
                    return false;
                if (entity.container || (entity.openable && !entity.open))
                    return false;
                location = entity.location;
                if (location === 'inventory')
                    return true;
                if (location === 'destroyed')
                    return false;
                asLocation = this.findLocation(location);
            }
            location = asLocation;
        }
        if (location.key === this.player.location)
            return true;

        var here = this.findLocation(this.player.location);
        var reach = here.reach;
        if (typeof (reach) === "function")
            reach = reach(location, this);
        if (reach && reach.includes(location.key))
            return true;
        return false;
    }

    present(entity: string | Entity): boolean {
        if (typeof entity === 'string')
            entity = this.findEntity(entity);
        if (!entity)
            return false;
        if (entity.location === 'inventory')
            return true;
        return this.inReach(entity);
    }

    objectsAt(location: Location | string): Entity[] {
        if (typeof (location) === "object")
            location = location.key;
        return this.entities.filter(function (o) { return o.location === location; });
    }

    processInputText(text: string) {
        let result = this.execute(text);
        let output = this.output;

        if (result === NOACTION) {
            this.message("[You] can't do that.");
        }
        output.print(this.currentMessage);
        this.currentMessage = "";

        switch (result) {
            case NOACTION:
                output.print("\n");
                output.input(this.prompt, text => this.processInputText(text));
                break;
            case WAIT:
                break;
            case ASK:
                output.input(this.askPrompt, text => {
                    var result = DONE;
                    if (this.askCallback)
                        result = this.askCallback(text);
                    output.print(this.currentMessage);
                    this.currentMessage = "";
                    this.resolveTurn(this.askOrder, result);
                    if (result === DONE || result === NOTDONE) {
                        output.print("\n");
                        output.input(this.prompt, text => this.processInputText(text));
                    }
                });
                break;
            default:
                output.print("\n");
                output.input(this.prompt, text => this.processInputText(text));
                break;
        }
    }

    describe(location?: Location | string) {
        if (!location)
            location = this.player.location;
        if (typeof location === 'string')
            location = this.findLocation(location) as Location;

        var index, module;
        for (index = this.modules.length - 1; index >= 0; index--) {
            module = this.modules[index];
            if (module.conditions && !module.conditions.call(this))
                continue;
            if (module.beforeDescription) {
                if (module.beforeDescription.call(this, location) === State.NOTDONE)
                    return State.NOTDONE;
            }
        }

        if (!location.seen && this.printLocationNames)
            this.message("<b>[object]</b>", location);
        location.seen = true;
        if (typeof location.description == 'function') {
            let result = location.description(this);
            if (result && typeof result == 'string') {
                this.message(result);
            }
        } else {
            this.message(location.description);
        }
        var here = this.player.location;
        if (!location.hideObjects) {
            var objectsHere = this.entities.filter((n: Entity) => { return n.location === here && !n.hidden; });
            if (objectsHere.length > 0)
                this.message("   [You] can see [a list] here.", objectsHere);
        }
        if (location.afterDescription)
            location.afterDescription.call(this);

        for (index = this.modules.length - 1; index >= 0; index--) {
            module = this.modules[index];
            if (module.conditions && !module.conditions.call(this))
                continue;
            if (module.afterDescription)
                module.afterDescription.call(this, location);
        }
        return State.DONE;
    }

    parse(text: string): Order {
        var order = new Order();
        var from = 0;
        var lastKind: WordDefinition = null;
        var nounIsSpecial = false;
        var noun = "";

        text = text.toLowerCase() + ' ';

        for (var n = 0; n < text.length; n++) {
            var c = text.charAt(n);

            if (c == '"' || c == '\'') {
                from = n + 1;
                while (n < text.length - 1) {
                    var next = text.charAt(++n);
                    if (next == c)
                        break;
                }
                order.quotedText = text.substring(from, n);
                from = n + 1;
                continue;
            }
            else if (c.match(/[ .,;:?]/)) {
                if (from == n) {
                    from++;
                } else {

                    var word = text.substring(from, n);
                    from = n + 1;

                    let wordDefinitions = this.vocabulary.findWord(word);
                    if (!wordDefinitions || !wordDefinitions.length) {
                        let number = parseInt(word, 10);
                        if (number > 0) {
                            if (order.noun && !order.noun2)
                                order.noun2 = "" + number;
                            else if (!order.noun)
                                order.noun = "" + number;
                            order.number = number;
                            continue;
                        }
                        console.log("Word '" + word + "' not in vocabulary; ignored");
                        if (!order.unknownWords)
                            order.unknownWords = 0;
                        order.unknownWords++;
                        lastKind = null;
                        continue;
                    }
                    let asWritten = word;
                    let def = wordDefinitions[0];
                    word = def.baseWord;

                    switch (def.type) {
                        case WordType.Conjunction:
                            order.conjuntion = word;
                            order.conjuntionAsWritten = asWritten;
                            order.remainingText = text.substring(n + 1);
                            break;

                        case WordType.Direction:
                            order.direction = word;
                            order.directionAsWritten = asWritten;
                            break;

                        case WordType.Verb:
                            if (order.verb && !order.verb2) {
                                order.verb2 = word;
                                order.verb2AsWritten = asWritten;
                            } else if (!order.verb) {
                                order.verb = word;
                                order.verbAsWritten = asWritten;
                            }
                            break;

                        case WordType.Pronoun:
                            if (order.noun && !order.noun2) {
                                order.noun2 = this.lastNoun;
                                order.noun2AsWritten = this.lastNounAsWritten;
                            } else if (!order.noun) {
                                order.noun = this.lastNoun;
                                order.nounAsWritten = this.lastNounAsWritten;
                            }
                            break;

                        case WordType.ConvertibleNoun:
                            if (!order.verb) {
                                order.verb = word;
                                order.verbAsWritten = asWritten;
                            } else if (order.noun && !order.noun2) {
                                order.noun2 = word;
                                order.noun2AsWritten = asWritten;
                            } else if (!order.noun) {
                                order.noun = word;
                                order.nounAsWritten = asWritten;
                                nounIsSpecial = true;
                            }
                            break;

                        case WordType.Noun:
                            if (order.noun && !order.noun2) {
                                order.noun2 = word;
                                order.noun2AsWritten = asWritten;
                            } else if (!order.noun) {
                                order.noun = word;
                                order.nounAsWritten = asWritten;
                            }
                            break;

                        case WordType.SpecialNoun:
                            if (order.noun && !order.noun2) {
                                order.noun2 = word;
                                order.noun2AsWritten = asWritten;
                            } else if (!order.noun) {
                                nounIsSpecial = true;
                                order.noun = word;
                                order.nounAsWritten = asWritten;
                            }
                            break;

                        case WordType.Preposition:
                            if (!order.preposition) {
                                order.preposition = word;
                                order.prepositionAsWritten = asWritten;
                                order.prepositionAfter = lastKind;
                            }
                            break;

                        case WordType.Adverb:
                            if (!order.adverb) {
                                order.adverb = word;
                                order.adverbAsWritten = asWritten;
                            }
                            break;

                        case WordType.Adjective:
                            if (order.noun2) {
                                if (!order.adjective2) {
                                    order.adjective2 = word;
                                    order.adjective2AsWritten = asWritten;
                                }
                            } else if (order.noun && !order.noun2 && lastKind && lastKind.type == WordType.Noun) {
                                if (!order.adjective) {
                                    order.adjective = word;
                                    order.adjectiveAsWritten = asWritten;
                                } else {
                                    order.adjective2 = word;
                                    order.adjective2AsWritten = asWritten;
                                }
                            } else if (order.noun) {
                                if (!order.adjective2) {
                                    order.adjective2 = word;
                                    order.adjective2AsWritten = asWritten;
                                }
                            } else {
                                if (!order.adjective) {
                                    order.adjective = word;
                                    order.adjectiveAsWritten = asWritten;
                                } else {
                                    order.adjective2 = word;
                                    order.adjective2AsWritten = asWritten;
                                }
                            }
                            break;
                    }
                    if (order.conjuntion)
                        break;
                    lastKind = def;
                }

                if (c == '.' || c == ',' || c == ';' || c == ':') {
                    if (!order.empty()) {
                        order.remainingText = text.substring(n + 1);
                        break;
                    }
                }
            }
        }

        if (order.adjective2 && !order.noun2) {
            order.adjective = order.adjective2;
            order.adjectiveAsWritten = order.adjective2AsWritten;
            order.adjective2 = "";
            order.adjective2AsWritten = "";
        }

        if (order.noun && nounIsSpecial === false) {
            this.lastNoun = order.noun;
            this.lastNounAsWritten = order.nounAsWritten;
        }

        if (order.noun) {
            let candidates = this.findObjectByNoun(order.noun, order.adjective);
            if (candidates.length == 1)
                order.object = candidates[0];
            else if (candidates.length > 0)
                order.ambiguousObjects = candidates;
        }

        if (order.noun2) {
            let candidates = this.findObjectByNoun(order.noun2, order.adjective2);
            if (candidates.length == 1)
                order.object2 = candidates[0];
            else if (candidates.length > 0)
                order.ambiguousObjects2 = candidates;
        }
        return order;
    }

    findObjectByNoun(noun: string, adjective: string): Entity[] {
        var candidates = [];
        for (var object of this.entities) {
            if (object.noun == noun)
                candidates.push(object);
        }
        if (candidates.length == 1)
            return candidates;
        if (adjective && candidates.length > 1) {
            var matches = [];
            for (var n = 0; n < candidates.length; n++)
                if (candidates[n].adjective == adjective)
                    matches.push(candidates[n]);
            if (matches.length > 0)
                return matches;
        }
        return candidates;
    }

    check(order: Order) {
        for (var module of this.modules) {
            if (module.conditions && !module.conditions.call(this))
                continue;
            if (module.check && !module.check.call(this, order))
                return false;
        }
        return true;
    }

    resolveTurn(order: Order, result: State): State {
        if (result === DONE) {
            for (let index = this.modules.length - 1; index >= 0; index--) {
                var module = this.modules[index];
                if (module.conditions && !module.conditions.call(this))
                    continue;
                if (module.after) {
                    let afterResult = module.after.call(this, order);
                    if (afterResult) {
                        result = afterResult;
                        break;
                    }
                }
                if (module.afterTurn) {
                    let afterResult = module.afterTurn.call(this, order);
                    if (afterResult) {
                        result = afterResult;
                    }
                }
            }
        }
        if (result === DONE) {
            var objectsHere = this.objectsHere();
            for (let index in objectsHere) {
                if (objectsHere[index].afterTurn) {
                    let afterResult = objectsHere[index].afterTurn(order, this);
                    if (afterResult) {
                        result = afterResult;
                        break;
                    }
                }
            }
        }
        if (result === DONE) {
            if (order && order.remainingText && !this.partialOrder) {
                return this.execute(order.remainingText);
            }
            return DONE;
        }
        else if (result === NOTDONE) {
            return NOTDONE;
        }
        else if (result == WAIT) {
            this.waitOrder = order;
            this.remainingText = order.remainingText;
            return WAIT;
        }
        else if (result == ASK) {
            this.askOrder = order;
            this.remainingText = order.remainingText;
            return ASK;
        }

        console.log("Invalid turn result: " + result);
        return result;
    }

    execute(order: string | Order, changes?: any, suborder: boolean = false): State {
        if (typeof order === 'string')
            order = this.parse(order);
        if (changes) {
            if (typeof changes === 'string') {
                changes = this.parse(changes);
            }
            changes = Object.keys(changes).reduce((obj: any, key) => { if (changes[key]) obj[key] = changes[key]; return obj; }, {});
            Object.assign(order, changes);
        }
        if (order.empty())
            return NOACTION;

        this.currentOrder = order;

        for (let module of this.modules) {
            if (module.conditions && !module.conditions.call(this))
                continue;
            if (module.before) {
                let beforeResult = module.before.call(this, order);
                if (beforeResult === NOTDONE)
                    return NOTDONE;
            }
            if (module.responses) {
                let result = this.checkResponses(module, order);
                if (result !== NOACTION)
                    return result;
            }
        }

        let location = this.findLocation(this.player.location);
        if (location && location.before) {
            let result = location.before.call(this, order);
            if (result === undefined || result === null)
                result = NOACTION;
            if (result === NOTDONE)
                return result;
        }

        if (order.object && this.present(order.object)) {
            let result = NOACTION;
            if (order.object.before) {
                let beforeResult = order.object.before(order, this);
                if (typeof beforeResult === 'number')
                    result = beforeResult;
                if (result === undefined || result === null)
                    result = NOACTION;
                if (result === NOTDONE)
                    return result;
            }
            if (order.object.execute) {
                let executeResult = order.object.execute(order, this);
                if (typeof executeResult === 'number')
                    result = executeResult;
            }
            if (result === NOACTION)
                result = this.checkResponses(order.object, order);
            if (result !== NOACTION)
                return suborder ? result : this.resolveTurn(order, result);
        }

        if (location) {
            let result = NOACTION;
            if (location.execute)
                result = location.execute.call(this, order);
            if (result === NOACTION)
                result = this.checkResponses(location, order);
            if (result !== NOACTION)
                return suborder ? result : this.resolveTurn(order, result);
        }

        for (let module of this.modules) {
            if (module.conditions && !module.conditions.call(this))
                continue;

            if (module.execute) {
                let result = module.execute.call(this, order);
                if (!result && result !== DONE)
                    result = NOACTION;
                if (result === NOACTION && module.responses)
                    result = this.checkResponses(module, order);
                if (result !== NOACTION)
                    return suborder ? result : this.resolveTurn(order, result);
            }
        }

        this.remainingText = order.remainingText;
        return NOACTION;
    }

    checkResponses(object: Responses, order: Order, isModule = false): State {
        if (this.skipResponses)
            return NOACTION;

        var result = NOACTION;
        var nouns = [order.noun, order.noun2];
        var key;
        if (object.responses) {
            for (key in object.responses) {
                var parts = key.split(",");
                for (var p = 0; p < parts.length; p++) {
                    var words = parts[p].trim().split(" ");
                    if (words.length < 1)
                        continue;
                    for (var n = 0; n < words.length; n++) {
                        let def = this.vocabulary.findWord(words[n]);
                        if (def && def.length > 0)
                            words[n] = def[0].baseWord;
                        else
                            console.error("Word", words[n], "appears in responses but it's not in vocabulary, check object", object);
                    }
                    if (words[0] !== '*' && words[0] !== '_' && words[0] !== order.verb && words[0] !== order.direction)
                        continue;
                    var matches = true;
                    var noun = 0;
                    for (var i = 1; i < words.length; i++) {
                        if (words[i] !== '*' && words[i] !== '_' && (words[i] !== nouns[noun] && words[i] !== order.preposition))
                            matches = false;
                        if (words[i] === '_' || words[i] === '*' || words[i] === nouns[noun])
                            noun++;
                    }
                    if (!matches)
                        continue;
                    var response = object.responses[key];
                    if (typeof response === 'string') {
                        result = DONE;
                        if (response.charAt(0) == '*') {
                            this.message(response.substring(1));
                            result = NOTDONE;
                        } else if (response.charAt(0) == '>') {
                            order.direction = '';
                            result = this.execute(order, response.substring(1), true);
                        } else if (response.charAt(0) == '!') {
                            var savedMessages = this.currentMessage;
                            this.skipResponses = true;
                            result = this.execute(order, undefined, true);
                            this.skipResponses = false;
                            if (result == DONE) {
                                this.currentMessage = savedMessages;
                                this.message(response.substring(1));
                            }
                        } else {
                            this.message(response);
                        }
                    } else {
                        result = response.call(this, order, object);
                        if (result == undefined)
                            result = NOACTION;
                    }
                    if (result != NOACTION)
                        return result;
                }
            }
        }

        if (object instanceof Location) {
            var areas: string[] = object.areas;
            if (!areas && object.area)
                areas = [object.area];
            if (areas) {
                for (var area of areas) {
                    if (!area || !this.areas[area])
                        continue;
                    result = this.checkResponses(this.areas[area], order);
                    if (result != NOACTION)
                        return result;
                }
            }
        }

        return NOACTION;
    }

    serialize(): SaveState {
        let entitiesChanges = this.entities.map(o => o.serializeChanges());
        return ({
            entities: this.entities.map(o => o.serializeChanges()),
            locations: this.locations.map(o => o.serializeChanges()),
            player: this.player.serializeChanges(),
            variables: this.serializeChanges()
        });
    };

    unserialize(data: SaveState) {
        if (!data)
            return;
        data.entities && data.entities.forEach(data => {
            let entity = this.findEntity(data.key);
            if (entity)
                entity.unserializeChanges(data);
        });
        data.locations && data.locations.forEach(data => {
            let location = this.findLocation(data.key);
            if (location)
                location.unserializeChanges(data);
        });
        data.variables && this.unserializeChanges(data.variables);
        data.player && this.player.unserializeChanges(data.player);
    }

    serializeChanges() {
        let results: { [key: string]: any } = {};
        let self = this as any;
        let defaults = this.defaults as any;
        for (let key of Object.keys(AdventureVariables)) {
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

    startGame() {
        this.modules.forEach(module => module.initialize && module.initialize.call(this));
        this.restartGame();
        this.initialState = this.serialize();
    };

    restartGame() {
        Object.assign(this, this.defaults);
        if (this.initialState) {
            this.unserialize(this.initialState);
        }

        this.currentMessage = "";
        this.modules.forEach(module => module.startGame && module.startGame.call(this));
        this.describe(this.player.location);
        this.output.print(this.currentMessage);
        this.currentMessage = "";
        this.output.print("\n");
        this.output.input(this.prompt, text => this.processInputText(text));

        console.log("Game restarted", this);
    }

    showImage(name: string) {
    }
    updateOverlay() {
    }
}