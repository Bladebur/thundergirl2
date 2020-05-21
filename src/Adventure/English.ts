import { Module } from "./Module";
import { Location } from './Location';
import { Adventure, State, NOACTION, NOTDONE, DONE, WAIT, ASK } from "./Adventure";
import { Order } from "./Order";
import { WordType, Words } from "./Vocabulary";

export var English: Module = {

	directions: {
		'north': ['n'],
		'south': ['s'],
		'east': ['e'],
		'west': ['w'],
		'northeast': ['ne'],
		'northwest': ['nw'],
		'southeast': ['se'],
		'southwest': ['sw'],
		'up': [],
		'down': [],
		'enter': ['in', 'inside'],
		'leave': ['out', 'outside']
	},

	convertibleNouns: {
		'inventory': ['i'],
		'exits': ['x']
	},

	prepositions: {
		'into': ['inside', 'in'],
		'on': ['over'],
		'under': [],
		'off': [],
		'at': []
	},

	exitNames: {
		'enter': 'inside',
		'leave': 'outside',
		'north': 'North',
		'south': 'South',
		'east': 'East',
		'west': 'West',
		'northeast': 'Northeast',
		'northwest': 'Northwest',
		'southeast': 'Southeast',
		'southwest': 'Southwest',
	},

	verbs: {
		'break': ['destroy', 'split', 'force', 'smash'],
		'close': [],
		'drop': ['throw'],
		'enter': [],
		'examine': ['ex', 'check', 'read', 'search', 'find', 'scan', 'investigate', 'inspect'],
		'exit': ['leave'],
		'lay': ['lie', 'crouch'],
		'load': ['restore'],
		'look': ['re-describe', 'l'],
		'make': [],
		'open': [],
		'pick': [],
		'punch': ['strike', 'punch', 'kick', 'attack'],
		'put': [],
		'quit': ['end', 'quitf'],
		'remove': ['disrobe', 'unwear', 'doff'],
		'restart': [],
		'save': [],
		'say': ['speak', 'talk', 'tell'],
		'sit': [],
		'stand': ['rise'],
		'take': ['get'],
		'wear': ['don'],
		'use': [],
	},

	// Won't affect pronouns
	specialNouns: {
		'all': ['everything'],
		'ram': [],
		'floor': []
	},

	pronouns: {
		'it': [],
		'them': []
	},

	conjunctions: {
		'and': [],
		'then': []
	},

	// ----------------------------------------------------------------------

	afterDescription(this: Adventure, location: Location): void {
		if (this.player.sitting === true)
			this.message("   [You are] " + this.player.sittingMode + " down on the floor.");
		else if (this.player.sitting)
			this.message("   [You are] " + this.player.sittingMode + " down on [the object].", this.findEntity(this.player.sitting));
	},

	before(this: Adventure, order: Order) {
		console.log(order);
		if (order.verbAsWritten === 'pick' && order.direction == 'up') {
			order.verb = 'take';
			order.direction = '';
			order.directionAsWritten = '';
		}
		if (order.verbAsWritten === 'put' && order.preposition == 'on' && order.prepositionAfter.type === WordType.Verb)
			order.verb = 'wear';
		if (order.verbAsWritten === 'put' && !order.noun2)
			order.verb = 'wear';
		if (order.verbAsWritten === 'take' && order.noun == 'off' && order.object2) {
			order.verb = 'remove';
			order.object = order.object2;
		}
		if (order.verbAsWritten == 'make' && order.noun == 'inventory')
			order.verb = 'inventory';
		if (order.verbAsWritten == 'x' && (order.noun || order.unknownWords))
			order.verb = 'examine';

		if (order.verb == 'enter') {
			order.direction = 'enter';
			order.directionAsWritten = order.verbAsWritten;
			order.verb = order.verbAsWritten = undefined;
		}
		if (order.verb == 'exit') {
			order.direction = 'leave';
			order.directionAsWritten = order.verbAsWritten;
			order.verb = order.verbAsWritten = undefined;
		}
		if (order.preposition == 'into' && (!order.noun && !order.verb && !order.unknownWords)) {
			order.direction = 'enter';
			order.directionAsWritten = order.prepositionAsWritten;
			order.preposition = order.prepositionAsWritten = undefined;
		}

		if (order.verb == 'sit' && order.direction == 'down') {
			order.direction = '';
		}
		if (order.verbAsWritten == 'get' && order.direction == 'up') {
			order.verb = 'stand';
			order.direction = '';
		}
	},

	execute(this: Adventure, order: Order): State {
		var player = this.player;
		var here = this.findLocation(player.location);
		var object = order.object;
		var index, entities, result, savedMessage, sittingMode: string;

		if (order.direction && !order.verb) {
			if (here.exits && order.direction in here.exits) {
				if (!this.check(order))
					return NOTDONE;
				var locationName = here.exits[order.direction];
				var location = this.findLocation(locationName);
				if (!location) {
					this.message("[You] can't go " + order.direction + ".");
					return NOTDONE;
				}
				if (this.player.sitting) {
					result = this.execute("stand up");
					if (result !== DONE)
						return result;
				}
				player.location = locationName;
				if (location.seen)
					this.mess("<b>" + (location.brief || location.name) + "</b>\n");
				else {
					result = this.describe(player.location);
					if (result)
						return result;
				}
				return DONE;
			}
			if (order.direction == 'up' && this.player.sitting)
				return this.execute("stand up");
			this.mess("[You] can't go that way. ");
			if (!here.exits)
				this.message("There is no exit.");
			else if (Object.keys(here.exits).length == 1)
				this.message("[You] can only go [the options].", this.exitsFrom(here));
			else
				this.message("[You] can go [the options].", this.exitsFrom(here));
			return NOTDONE;
		}

		switch (order.verb) {
			case 'exits':
				var exits = this.exitsFrom(here);
				if (!exits || !exits.length)
					this.message("There is no exit.");
				else if (exits.length == 1)
					this.message("[You] can only go [the options].", exits);
				else
					this.message("[You] can go [the options].", exits);
				return NOTDONE;

			case 'restart':
				this.askPrompt = "Are you sure?| ";
				this.askCallback = (text) => {
					if (text.substring(0, 1).toLowerCase() == 'y') {
						this.clear();
						this.restartGame();
						return WAIT;
					}
					return NOTDONE;
				};
				return ASK;

			case 'load':
				var savedState = window.localStorage.getItem("savedState");
				if (!savedState)
					this.message("Your progress hasn't been saved yet.");
				else {
					this.reset();
					this.unserialize(JSON.parse(savedState));
					this.clear();
					result = this.describe(player.location);
					if (result)
						return result;
				}
				return NOTDONE;

			case 'save':
				var previousState = window.localStorage.getItem("savedState");
				if (previousState) {
					this.message("This will overwrite your previous save.");
					this.askPrompt = "Are you sure?| ";
					this.askCallback = (text) => {
						if (text.substring(0, 1).toLowerCase() == 'y') {
							window.localStorage.setItem("savedState", JSON.stringify(this.serialize()));
							this.message("Progress saved.");
						}
						console.log(JSON.parse(window.localStorage.getItem("savedState")));
						return NOTDONE;
					};
					return ASK;
				} else {
					window.localStorage.setItem("savedState", JSON.stringify(this.serialize()));
					console.log(JSON.parse(window.localStorage.getItem("savedState")));
					this.message("Progress saved.");
					return NOTDONE;
				}
				break;

			case 'inventory':
				this.inventoryMode = true;
				var carrying = this.entities.filter(o => o.location === 'inventory' && !o.hidden && !o.worn);
				var wearing = this.entities.filter(o => o.location === 'inventory' && !o.hidden && o.worn);
				if (carrying.length === 0 && wearing.length === 0)
					this.message("[You are] not carrying anything.");
				if (carrying.length > 0)
					this.message("[You are] carrying [a list].", carrying);
				if (wearing.length > 0)
					this.message("[You are] wearing [a list].", wearing);
				this.inventoryMode = false;
				return DONE;

			case 'look':
				if (!order.noun) {
					result = this.describe(player.location);
					if (result)
						return result;
					return DONE;
				}
				if (order.noun == 'exits')
					return this.execute("exits");
				return this.execute(order, { verb: 'examine' });

			case 'use':
				this.message([
					"How?",
					"What do you want to do, exactly?",
					"You'd have to be more specific."
				][Math.floor(Math.random()*3)]);
				return NOTDONE;

			case 'examine':
				if (object) {
					if (this.present(object)) {
						if (!this.check(order))
							return NOTDONE;
						if (object.description) {
							if (typeof (object.description) == "function") {
								var fullDescription = object.description.call(object, this);
								if (fullDescription)
									this.message(fullDescription);
							} else {
								this.message(object.description);
							}
						} else
							this.message("[The object] has nothing special.", object);
						return DONE;
					}
					if (object.seen) {
						this.message("[You] can't see [the object] here.", object);
						return NOTDONE;
					}
				}
				this.message("[You] can see nothing special.");
				return NOTDONE;

			case 'drop':
				if (object) {
					if (object.location == 'inventory') {
						if (object.worn) {
							savedMessage = this.currentMessage;
							result = this.execute(order, { verb: 'remove' });
							if (result != DONE)
								return result;
							this.currentMessage = savedMessage;
						}
						if (!this.check(order)) {
							object.worn = false;
							return NOTDONE;
						}
						object.location = player.location;
						if (!this.partialOrder)
							this.message("[You drop|I've dropped] [the object].", object);
						return DONE;
					}
					if (this.present(object)) {
						this.message("[You are] not carrying [the object].", object);
						return NOTDONE;
					}
				} else if (order.noun === 'all') {
					entities = this.entities.filter(o => {
						return o.location === 'inventory' && !o.worn && !o.hidden;
					});
					if (entities.length === 0) {
						this.message("[You are] not carrying anything.");
						return NOTDONE;
					}
					this.partialOrder = true;
					for (let index = 0; index < entities.length; index++) {
						order.noun = entities[index].noun;
						order.adjective = entities[index].adjective;
						order.object = entities[index];
						let result = this.execute(order);
						if (result !== DONE || entities[index].location !== player.location) {
							entities.splice(index--, 1);
						}
					}
					this.partialOrder = false;
					if (entities.length == 0) {
						return NOTDONE;
					}
					this.message("[You drop|I've dropped] [the list].", entities);
					return DONE;
				}
				this.message("[You are] not carrying that.");
				return NOTDONE;

			case 'take':
				if (object) {
					if (object.location == 'inventory') {
						this.message("[You are] already carrying [the object].", object);
						return NOTDONE;
					}
					if (this.present(object)) {
						if (object.scenery) {
							this.message("That's hardly something [you]'d be able to pick up, considering the current situation.");
							return NOTDONE;
						}
						if (this.entities.filter(n => n.location === 'inventory')
							.length >= player.maxObjectsCarried) {
							this.message("[You are] carrying too many things.");
							return NOTDONE;
						}
						if (!this.check(order))
							return NOTDONE;
						if (!this.partialOrder)
							this.message("[You] now have [the object].", object);
						object.location = 'inventory';
						return DONE;
					}
					this.message("[You] can't see that.");
					return NOTDONE;
				} else if (order.noun == 'all') {
					entities = this.entities.filter(function (o) { return o.location === player.location && !o.scenery && !o.hidden; });
					let carried = this.entities.filter(function (n) { return n.location === 'inventory'; });
					if (entities.length === 0) {
						this.message("[You] can see nothing suitable.");
						return NOTDONE;
					}
					if (carried.length + entities.length > player.maxObjectsCarried) {
						this.message("[You are] carrying too many things.");
						return NOTDONE;
					}
					for (let index = 0; index < entities.length; index++) {
						order.noun = entities[index].noun;
						order.adjective = entities[index].adjective;
						order.object = entities[index];
						this.partialOrder = true;
						let result = this.execute(order);
						if (result !== DONE || entities[index].location !== 'inventory') {
							entities.splice(index, 1);
							index--;
						} 
						this.partialOrder = false;
					}
					if (!entities.length) {
						return NOTDONE;
					}
					for (index in entities) {
						var o = entities[index];
						o.location = 'inventory';
					}
					console.log(entities);
					this.message("[You] now have [the list].", entities);
					return DONE;
				}

				if (order.noun || order.unknownWords)
					this.message("[You] can't pick up that.");
				else
					this.message("[You] can't see that.");
				return NOTDONE;

			case 'remove':
				if (object && object.location == 'inventory' && object.worn) {
					// Handle objects being worn
					if (!this.check(order))
						return NOTDONE;
					object.worn = false;
					this.message("[You] remove [the object].", object);
					return DONE;
				} else if (object && (object.location == 'inventory' || object.location === player.location)) {
					// Handle objects here or carried, but not being worn
					if (object.wearable)
						this.message("You are not wearing [the object].", object);
					else
						this.message("[You] can't wear [the object].", object);
					return NOTDONE;
				} else if (order.noun == 'clothes' || order.noun == 'all') {
					// Handle 'remove all' or 'remove clothes' special cases
					var list = this.entities.filter(function (o) {
						return o.location == 'inventory' && o.worn && !o.hidden;
					});
					if (list.length === 0) {
						// ...if not wearing anything
						this.message("[You are] not wearing anything.");
						return NOTDONE;
					}
					for (index in list) {
						order.noun = list[index].noun;
						order.adjective = list[index].adjective;
						order.object = list[index];
						// Check for every object before executing the order
						if (!this.check(order))
							return NOTDONE;
					}
					for (index in list)
						list[index].worn = false;
					this.message("[You] remove [the list].", list);
					return DONE;
				} else {
					// Show an error message for any other cases
					this.message("[You are] not wearing that.");
					return NOTDONE;
				}
				break;

			case 'wear':
				if (object && object.location == 'inventory' && object.wearable) {
					if (object.worn) {
						this.message("[You are] already wearing [the object].", object);
						return NOTDONE;
					}
					if (!this.check(order))
						return NOTDONE;
					object.worn = true;
					this.message("[You] put on [the object].", object);
					return DONE;
				} else if (object && this.inReach(object.location) && object.wearable) {
					savedMessage = this.currentMessage;
					result = this.execute(order, { verb: 'take' });
					if (result != DONE)
						return result;
					this.currentMessage = savedMessage;
					if (!this.check(order)) {
						object.location = player.location;
						return NOTDONE;
					}
					this.message("[You] put on [the object].", object);
					object.worn = true;
					return DONE;
				} else if (object && (object.location === 'inventory' || object.location === player.location)) {
					if (object.worn)
						this.message("[You are] already wearing [the object].", object);
					else
						this.message("[You] can't wear [the object].", object);
					return NOTDONE;
				} else if (order.noun == 'all') {
					entities = this.entities.filter(function (n) {
						return n.location === 'inventory' && n.wearable && !n.hidden;
					});
					if (entities.length === 0) {
						this.message("[You] can see nothing suitable.");
						return NOTDONE;
					}
					for (index in entities) {
						order.noun = entities[index].name;
						order.adjective = entities[index].adjective;
						if (!this.check(order))
							return NOTDONE;
					}
					for (index in entities)
						entities[index].worn = true;
					this.message("[You are] now wearing [the list].", entities);
					return DONE;
				} else {
					this.message("[You] can't wear that.");
					return NOTDONE;
				}
				break;

			case 'sit':
			case 'lay':
				sittingMode = (order.verb == 'sit' ? 'sitting' : 'laying');
				if (!order.noun && !order.unknownWords) {
					entities = this.entities.filter(n =>
						n.location === this.player.location && (sittingMode == 'sitting' ? n.sitting : n.laying)
					);
					if (entities.length == 1) {
						order.noun = entities[0].noun;
						order.object = object = entities[0];
					}
				}
				if (!object && this.player.sitting && this.player.sitting !== true && this.findEntity(this.player.sitting).laying)
					object = this.findEntity(this.player.sitting);
				if (this.player.sitting) {
					if (((this.player.sitting === true && !object) || this.player.sitting == object.key) && this.player.sittingMode == sittingMode) {
						if (object)
							this.message("[You are] already " + sittingMode + " on [the object].", object);
						else
							this.message("[You are] already " + sittingMode + " down.");
						return NOTDONE;
					}
					if (!object || this.player.sitting != object.key) {
						result = this.execute("stand up");
						if (result !== DONE)
							return result;
						this.currentMessage = "";
					}
				}
				if (object && this.present(object)) {
					if (!object.sitting && sittingMode == 'sitting') {
						this.message("[The object] is not suitable for sitting.", object);
						return NOTDONE;
					}
					if (!object.laying && sittingMode == 'laying') {
						this.message("[The object] is not suitable for laying down.", object);
						return NOTDONE;
					}
					this.player.sitting = object.key;
					this.player.sittingMode = sittingMode;
					this.message("[You] " + (sittingMode == 'sitting' ? "sit" : "lay down") + " on [the object].", object);
					return DONE;
				}
				if ((order.noun && order.noun != 'floor') || order.unknownWords) {
					this.message("That's not suitable for sitting.");
					return NOTDONE;
				}
				this.player.sitting = true;
				this.player.sittingMode = sittingMode;
				this.message("[You] " + (sittingMode == 'sitting' ? "sit" : "lay") + " down on the floor.");
				return DONE;

			case 'stand':
				if (this.player.sitting) {
					this.player.sitting = null;
					this.message("[You] stand up.");
					return DONE;
				}
				this.message("[You are] already standing.");
				return DONE;
		}
		return NOACTION;
	}
}