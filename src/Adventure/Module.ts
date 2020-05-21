import { WordTables } from './Vocabulary';
import { Entities } from './Entity';
import { Locations, Location } from './Location';
import { Adventure, State, Responses, ResponseTable } from './Adventure';
import { Order } from './Order';

export interface Module extends WordTables, Responses {
    locations?: Locations;
    entities?: Entities;
    responses?: ResponseTable;
    areas?: { [name: string]: Responses };
    exitNames?: { [exit: string]: string };

    initialize?(this: Adventure): void;
    startGame?(this: Adventure): void;
    conditions?(this: Adventure): boolean;
    after?(this: Adventure, order: Order): void | State;
    afterTurn?(this: Adventure, order: Order): void;
    afterDescription?(this: Adventure, location: Location): void;
    before?(this: Adventure, order: Order): void | State;
    beforeDescription?(this: Adventure, location: Location): void | State;
    check?(this: Adventure, order: Order): boolean;
    execute?(this: Adventure, order: Order): void | State;
}