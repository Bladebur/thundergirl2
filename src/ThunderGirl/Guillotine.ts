import { Module } from "../Adventure/Module";
import { Location } from "../Adventure/Location";
import { Adventure, DONE, NOTDONE, NOACTION, WAIT, ASK, DefaultAdventureVariables, RESTART } from "../Adventure/Adventure";
import { Order } from "../Adventure/Order";
import { sprintf } from 'sprintf-js';
import { Entity } from "../Adventure/Entity";

var hintsActive = false;
var daringFeatHint = 0;

class NewVariables {
    dead = false;
    doomCounter = 60;
    handOut = false;
    feetOut = false;
    tableMoved = false;
    slideHandNoticed = false;
    slideFeetNoticed = false;
    lockpickNoticed = false;
    barNoticed = false;
    slideHandCounter = 0;
    slideFeetCounter = 0;
    showCounter = false;
    extraTime = false;
    padlockKeyTurns = 0;
    padlockOpen = false;
    stocksOpen = false;
    fallingBlade = false;
    batmanManeuver = 0;
    batmanManeuverPerformed = false;
    barUnderBlade = false;
    bladePosition = 0;
    ropesLoose = false;
    extraSpeed = 0;
    escaped = false;
    rightOrLeftQuestion = false;
    upOrDownQuestion = false;
    barHint = 0;
    lastHint = 0;
}

declare module '../Adventure/Adventure' {
    interface AdventureVariables extends NewVariables {}
}

Object.assign(DefaultAdventureVariables, new NewVariables());

var guillotine : Module = {
    
	startGame: function(this: Adventure) {
        this.player.location = 'guillotine-start';
        this.findEntity('belt').location = 'destroyed';

        this.message("As the veil of darkness fades away and disorientation slowly comes to pass, [your] eyes finally open, only to reveal the most grotesque scene [you] could imagine.");
    },

    entities: {
        "key": {
            name: "key",
            location: "guillotine-start",
            description: "A large brass key attached to a small chain. It looks like it could fit the padlock there over the stocks."
        },
        "table": {
            name: "table",
            location: "guillotine-start",
            scenery: true,
            hidden: true,
            description: function(this: Entity, adventure: Adventure) {
                let result =  "A small and dirty accessory table, rusty and battered like an abandoned prop. It has a a top, a steel frame, a stretcher and some wheels.";
                if (adventure.findEntity('key').location == 'guillotine-start')
                    result += "\nThere is a small brass key on it.";
                if (adventure.tableMoved)
                    result += "\nThe table rests now close to [your] head.";
                else   
                    result += "\nPerhaps as a form of cruelty, the table has been placed some distance away from [me]. Close enough to make its presence apparent, far enought to be completely unreachable. “You only have to take it”.";
                return result;
            },
            responses: {
                'lift, take': function(this: Adventure, order: Order) {
                    if (this.tableMoved && this.handOut) {
                        this.message("[You] reach the table only to find it surprisingly heavy. [You] wonder what kind of weight has it attached? It has wheels, but sliding it across the floor is as far as [you] can go.");
                        return DONE;
                    } else if (this.tableMoved) {
                        this.message("[You] can't reach the table with [your] hands in the stocks.");
                        return NOTDONE;
                    }
                    this.message("The table is completely out of reach.");
                    return NOTDONE;
                },
            }
        },
        "lamp": {
            location: "guillotine-start",
            scenery: true,
            hidden: true,
            description: "Some kind of ceiling lamp, directly focused on [your] ordeal. Everything else is mostly in darkness."
        },
        "shapes": {
            location: "guillotine-start",
            scenery: true,
            hidden: true,
            many: true,
            noun: "shapes",
            description: "Due to the poor lightning, [you are] not sure about the many shapes the darkness outline at a distance. Boxes and props, perhaps. Any useful tools out there would be completely out of reach, though.",
        },
        "bar": {
            location: "destroyed",
            adjective: "metal",
            description: "A small metal bar, less than one inch in diameter and about one feet long. It is no longer part of the table's shabby frame.",
            responses: {
                'break': "[You] try to bend or twist the bar, with zero success. It's still bare metal, after all."
            }
        }
    },
    
    adjectives: {
        'right': [],
        'left': []
    },

    verbs: {
		'type': ['press'],
        'struggle': ['fight'],
        'slide': [],
        'stop': ['disable'],
        'raise': ['elevate'],
    },

    nouns: {
        'r': [],
        't': [],
        'neck': [],
        'torso': [],
        'chest': [],
        'stomach': [],
        'back': [],
        'crotch': [],
        'knots': ['knot'],
        'key': [ 'key', 'keychain', 'chain' ],
        'board': [ 'plank', 'bed', 'wood' ],
        'blade': [ '' ],
        'guillotine': [ 'machine', 'trap', 'deathtrap', 'mechanism', 'construction' ],
        'counter': [ 'box', 'trigger', 'timer' ],
        'stock': [ 'stocks', 'lunethe' ],
        'room': [ 'backstage', 'stage', 'place', 'area', 'surroundings' ],
        'shapes': [ 'figures', 'shadows', 'silhouettes', 'boxes', 'props' ],
    },

    afterDescription(this: Adventure, location: Location) {
        this.showImage('guillotine');
        if (this.tableMoved) {
            if (this.findEntity('key').location == 'guillotine-start') {
                this.message("The table, and its precious contents, rest close to [me], at an arm's length.");
            } else {
                this.message("The table still rests closer to [me], at an arm's length.");
            }
        } else {
            this.message("A small, grimy table rests at the feet of the machine. On the table, a brass key shines.");
        }
        this.message("Other than that, [you] don't really know where [you are]. Some kind of backstage, perhaps. The lightning is poor, and focused on the machine, so there is only hints of shapes in the darkness beyond.");
    },

    afterTurn(this: Adventure, order: Order) {

        if (this.fallingBlade) 
        {
            if (this.batmanManeuver > 0) {
                switch (++this.batmanManeuver) {
                    case 2:
                        this.message("Damn, this thing weights far too much! [Your] legs shake under the pressure.");
                        break;
                    case 3:
                        this.message("[You] feel the heavy blade slipping out of your feet. [You] need to do something, and do it fast!");
                        break;
                    case 5:
                        this.message("The blade is slipping! [You] can't hold it up there any longer!");
                        break;
                    case 6:
                        this.message("Finally, your tired body betrays [you] and [your] legs give up, unable to keep pushing such a heavy weight any longer.");
                        this.batmanManeuver = 0;
                        break;
                }
            }
            if (this.batmanManeuver == 0) {
                this.dead = true;
                this.message("As the massive metal blade falls over [your] neck with full force, [you] seem to recall every moment of the last day of [your] life. [You] remember the Gemini Pair's bizarre antics, their sick bravado, and the weird puppet robot army.\nAnd then, there is only silence.");
                return this.waitForKey(() => {
                    this.showImage('guillotine');
                    this.message("\n[You] have failed to escape the Gemini Pair's gruesome deathtrap. As expert escapologists themselves, looks like they were able to cover every possible way out with false promises, ultimately leading only to further despair.\nOr are they?");

                    if (hintsActive) {
                        this.mess("\n<center><white>⎯⎯⎯⎯⎯⎯   Hint   ⎯⎯⎯⎯⎯⎯</white></center>\n\n");
                        hint.call(this);
                    }

                    this.mess("\nPress any key to restart... ");
                    return this.waitForKey(() => {
                        this.clear();
                        this.restartGame();
                        return RESTART;
                    });
                });
            }
        } 
        else 
        {
            let previousPart = Math.floor((this.doomCounter+1)/6);
            let previousCounter = this.doomCounter;
            if (order.verb == 'examine' || order.verb == 'look' || order.verb == 'inventory') {
                this.doomCounter += 2;
            }
            if (this.extraTime) {
                this.doomCounter--;
                this.extraTime = false;
            }
            this.doomCounter = Math.max(0, this.doomCounter - 3 - this.extraSpeed);
            let currentPart = Math.floor((this.doomCounter+1)/6);
            if (Math.floor((this.doomCounter-1)/12) != Math.floor((previousCounter-1)/12) || this.showCounter) {
                if (this.doomCounter == 0) {
                    this.message("There is a sudden alarm, and something clicks inside the trigger box.");
                    this.mess("The text <green>" + sprintf("%02d:%02d", (this.doomCounter * 5) / 60, (this.doomCounter * 5) % 60) + "</green> blinks in the box's display.");
                    return this.waitForKey(() => {
                        this.fallingBlade = true;
                        this.showImage('guillotine');
                        this.message("\nSuddenly, the massive blade falls down towards [your] head with full force!");
                        return NOTDONE;
                    });
                } else {
                    this.message("The text <green>" + sprintf("%02d:%02d", (this.doomCounter * 5) / 60, (this.doomCounter * 5) % 60) + "</green> blinks in the trigger box's display.");
                }
                this.showCounter = false;
            }
            if (currentPart != previousPart) 
            {
                switch (currentPart)
                {
                    case 1:
                        this.message("Anxiety grows as [your] fate grows closer. There is barely any time left. The blade looks heavier by the second.");
                        break;
                    case 2:
                        this.message("The air is cold and dusty. Despite that, [you] are sweating considerably.");
                        break;
                    case 3:
                        this.message("The ropes seem to screech and moan. Are they really getting tighter as [you] struggle? [You] can't be sure, but considering the Gemini Pair's frolics, those kind of sick jokes are far from impossible. [You] need to get out of this one, and soon.");
                        break;
                    case 4:
                        this.message("[You] have to appreciate the extreme, sick design that went into this thing. [You] can't but wonder if every small leeway, every possible way out is nothing but a misleading distraction, left there by the Gemini Pair for their amusement and [your] despair.");
                        break;
                    case 5:
                        this.message("The ropes seem to have tightened and are clinching [your] body quite harshly. Is this the effect of [your] struggles, or perhaps the result of some nefarious ropework? Breathing is becoming harder and harder.");
                        break;
                    case 6:
                        this.message("The machine creaks slightly, following [you] struggles. Rope and wood embraces you firmly, like some kind of psychotic lover.");
                        break;
                    case 7:
                        this.message("[Your] heart races as you ponder [your] next step. There is a way out, of that [you are] sure. There is always a way out. The Gemini Pair will regret not killing [you] when they had the chance.");
                        break;
                    case 8:
                        this.message("For a moment, the light dims and flickers, as you'd expect for such a old installation. Unfortunately, the digital counter is completely unaffected, and continues its evil descent towards [your] impending fate.");
                        break;
                    case 9:
                        this.message("The ominous blade shines against the erratic lightning, its corroded metal giving it a sense of cruelty and diabolical character.");
                        break;
                }
            }
            this.updateOverlay();
        }

        if (order.verb == 'examine' && order.noun == 'costume') {
            this.message("Both the cape and the utility belt are completely missing, though.");
        }
    },

    before(this: Adventure, order: Order) {
        if (order.verb == 'type') {
            if (!this.handOut) {
                this.message("[You] can't reach the keypad with [your] hands in the stocks.");
                return NOTDONE;
            }
            if (order.directionAsWritten == 'n') {
                order.noun = 'n';
            }
            if (order.noun == 'button' && order.noun2) {
                order.noun = order.noun2;
            }
        }
        if (!order.noun && !order.verb && !this.handOut && (order.adjective == 'left' || order.adjective == 'right') && this.rightOrLeftQuestion) {
            order.verb = 'pull';
            order.noun = 'hand';
        }
        if (!order.verb && (order.direction == 'up' || order.direction == 'down') && this.upOrDownQuestion) {
            order.verb = 'move';
            order.noun = 'blade';
        }
        if (order.verb == 'get' && order.noun == 'glove' && this.handOut) {
            order.verb = 'examine';
        }
        if (order.verb == 'remove' && order.noun == 'boots') {
            order.verb = 'slide';
            order.noun = 'leg';
        }

        this.rightOrLeftQuestion = false;
    },

    check(this: Adventure, order: Order): boolean {
        if (order.verb == 'take' && order.noun == 'key') {
            if (!this.handOut) {
                if (this.feetOut && order.noun2 == 'foot') {
                    this.message("Good idea, but taking the key with [your] feet is way too risky, due to the way it rests on the table and the distance involved. [You] will just end up losing it. There must be a better way.");
                } else if (this.tableMoved || this.feetOut) {
                    this.message("[You] can't reach the table with [your] hands in the stocks.");
                } else {
                    this.message("That would be quite the feat, considering [your] current predicament.");
                }
                return false;
            } else if (!this.tableMoved) {
                this.message("The table is, unfortunately, completely out of reach.");
                return false;
            }
        }
        return true;
    },

    after(this: Adventure, order: Order) {
        if (order.verb == 'take' && order.noun == 'key') {
            this.showImage('guillotine');
        }
        if (order.verb == 'examine' && order.noun == 'key') {
            if (this.tableMoved) {
                this.message("You've managed to move the table close, so the key is now just at an arm's length.");
            } else {
                this.message("The key rests in a small table, out of reach.");
            }
        }
    },

    locations: {
        'guillotine-start': {
            name: "Tied to the guillotine",
            hideObjects: true,
            description: function(adventure: Adventure) {
                let result = adventure.handOut ? 
                    "[I am] lying face up over a wood plank, head and left hand tightly stuck inside cruel stocks alongside ." :
                    "[I am] lying face up over a wood plank, [my] hands and head tightly stuck inside cruel stocks.";
                result += " Multiple loops of rope, expertly bound, dig disturbingly all around [my] body and pin [me] firmly to the board."; 
                if (adventure.feetOut)
                    result += " Metal shackles pull [my] feet far below, keeping [me] uncomfortably stretched.";
                result += "\nThe true evil of this situation, however, is the guillotine's massive blade, resting precariously a distance from [my] head."
                return result;
            },
            responses: {
                'ex blade': "It's an imposing chunk of metal, sharp like hell with no doubt. Strong uprights guide its way towards [your] impending doom.\n[You are] not able to see the full mechanism from this position, but a rope comes down from there and passes through a mechanical box.",
                'ex uprights': "They are just two strong metal poles with a rail inside.",
                'ex rail, ex rails': "The blade should fall through them. [You] can see no apparent way to block them or tamper with them.",
                'ex machine': function(this: Adventure) {
                    this.message("The fiendish construction has a full size wood bed (where [you're] lying), a stock, a blade, and two uprights.\nThere is no handle. The trigger mechanism seems to be a small metal box featuring an electronic counter. A rope comes down from the blade mechanism and passes through a hole in the trigger box.");
                    return NOTDONE;
                },

                'take counter': "The trigger mechanism is out of reach.",
                'ex counter': function(this: Adventure, order) {
                    this.message("The trigger box is a massive lump of metal securely screwed to the guillotine. Some kind of rope connects the mechanism to the box, but [you] can't see or access that area from this position. There is a digital display showing a timer, which continuously races towards [your] impending doom. Next to that, there is also a keypad.");
                    this.showCounter = true;
                    return DONE;
                },
                'stop counter': "*[You]'d have to figure a way to do that. [You] notice a digital keypad to the side of the counter. It seems to be expecting some kind of password.",
                'break counter': function(order) {
                    if (this.handOut) {
                        this.message("[You] can't reach the trigger box.");
                        return NOTDONE;
                    }
                    this.message("The trigger box is solid metal and [you] can barely reach it. [You] have no chance to disable it through violence alone.");
                    return NOTDONE;
                },
                'ex keypad': "The keypad has ten digits you'd expect, an ENTER button, and four one-letter buttons labeled R, T, and N, and a red button.",
                'type password': "*But [you] don't know the password!",
                'press': function(order) {
                    if (order.number) {
                        this.mess("You type the number " + order.number + " and press the ENTER button... ");
                        return this.waitForKey(() => {
                            this.message("Suddenly, there is a deep sound, and the time counter starts to go faster!");
                            this.extraSpeed++;
                            return DONE;
                        });
                    } else switch (order.noun) {
                        case 'r':
                        case 't':
                        case 'n':
                            this.message("You reach out to the keypad and press the " + order.noun.toUpperCase() + " button. It doesn't seem to do anything, though.");
                            return DONE;
                        default:
                            this.message("What do you want to type, exactly?" + order.noun);
                            return NOTDONE;
                    }
                },

                'ex legs, ex feet': ">ex boots",
                'ex boots': function(this: Adventure, order) {
                    if (this.feetOut) {
                        this.message("[You] have been able to get [your] feet out of the shackles. [Your] body is tied to the board, but at least [your] legs have some mobility.");
                    } else {
                        this.message("[You] don't have a good view, but by the feel of it, [your] feet are secured by a pair of shackles, which seem to have been bolted to the wood board [you are] lying on.\nThe shackles are just a bit too large for [your] legs. [You] may be able to slide [your] feet out of [your] boots given enough time and effort.");
                    }
                    return DONE;
                },
                'open shackles, remove shackles': function(this: Adventure, order) {
                    if (this.feetOut) {
                        this.message("Both [your] feet are already free.")
                        return NOTDONE;
                    }
                    this.message("[You] try to force the shackles open with all [your] might, but the bulky steel is far too strong to be forced open.");
                    return DONE;
                } ,
                
                'remove foot': ">remove boots",
                'remove boots': ">pull leg",
                'slide foot, slide legs, pull foot': ">pull leg",
                'pull leg': function(this: Adventure, order: Order) {
                    if (this.feetOut) {
                        this.message("Both [your] feet are already free.")
                        return NOTDONE;
                    }
                    this.extraTime = true;
                    switch (++this.slideFeetCounter)
                    {
                        case 1: this.message("[You] pull both [your] feet with all [your] strength, trying to get them out of the embrace of the cold, implacable steel. For the moment, though, [you] achieve nothing else than hurting [yourself]."); break;
                        case 2: this.message("[You] embrace [yourself] and pull again the feet out of the boots. The shackles won't budge."); break;
                        case 3: this.message("[You] continue [your] efforts. [Your] legs shake under the effort, and the steel won't give up."); break;
                        case 4: this.message("[You are] almost out of breath from [your] struggles, but [you] finally notice some leeway. At least one foot is almost out. Come on!"); break;
                        case 5:
                            this.message("Finally! One foot slides out of the boot, and shortly follows the other one. Both [your] feet hurt like hell, but they are at least free of the cruel shackles.");
                            this.message("Both [your] boots seem to have fallen from the table after the efforts.");
                            this.feetOut = true;
                            this.showImage('guillotine');
                            break;
                    }
                    return DONE;
                },

                'ex shackles': "A pair of steel shackles, bolted to the wood board. [You] don't have a good view from here.",
                
                'ex rope': ">ex ropes",
                'pull rope': ">take rope",
                'take rope': "*The rope is out of reach.",

                'ex board': "The board [you are] lying on is sturdy, thick and old.",
                'break board': "[You] briefly test the strenght of the wood board, only to find it thick and as solid as a rock.",

                'ex crotch': ">ex ropes crotch",
                'ex neck': ">ex ropes neck",
                'ex torso': ">ex ropes torso",
                'ex back': ">ex ropes back",
                'ex ropes': function(this: Adventure, order) {
                    let where = order.noun2;
                    if (this.handOut) {
                        switch (where) {
                            case 'crotch':
                                this.message("The crotch rope uncomfortably digs between [your] legs, perhaps as some form of sick humililiation. It's quite distracting... And something [you] are sure [you]'ll remember when it's time for payback.");
                                break;
                            case 'torso':
                                this.message("Tight ropes pin your torso to the table. The bondage looks complicated and there is probably no easy access to the knots from this position.");
                                break;
                            case 'chest':
                                this.message("[Your] breasts are uncomfortably tied. Another form of sick humilliation, perhaps.");
                                break;
                            case 'back':
                                this.message("[You] are sure at least of the knots tying your torso down are on [your] back, but others may be under the table and out of reach.");
                                break;
                            case 'neck':
                                this.message("A few ropes around [your] neck pin it to the table. Careful! [You]'ll need to get rid of those ropes or [you]'ll never be able to raise up [your] head out of those damn stocks, even if [you are] able to open them somehow.");
                                break;
                            default:
                                this.message("[You] check the ropes around [your] body using [your] free hand. They seem to be expertly tied, with no room for comfort, and they go all around the board [you are] lying on. They are pinning [you] so hard, even if [you are] able to open the stocks, [you'd] still need to do something about them or [you] won't be able to get out of the way of the blade. But how?");
                                this.message("Close examination reveals dozens of knots, carefully interwined between them. Even finding them is going to take time. There are knots around [your] neck, behind [your] back, all around [your] torso, and over [your] chest and [your] crotch.");
                                return DONE;
                        }
                    } else {
                        this.message("[You] have no good view of the ropes tying [your] body, but they seem to be really tight and solid. They are pinning [you] hard down to the table, offering no leeway at all, so even if [you] get rid of the stocks somehow, they may still present an obstacle of their own.\nIf [you] had some freedom of movement, perhaps [you] could do something about them, though.");
                    }
                    return DONE;
                },
                'remove ropes, cut ropes, break ropes': ">untie ropes",
                'untie': function (this: Adventure, order) {
                    if (this.handOut == false) {
                        this.message("Mangling with the ropes is pretty much impossible from this position.");
                        return NOTDONE;
                    }
                    let where = order.noun;
                    if (order.noun == 'ropes' || order.noun == 'knots')
                        where = order.noun2;
                    switch (where) {
                        case 'crotch':
                            this.message("[You] fumble around the ropes around [your] crotch. Ouch! They don't seem to fulfill any purpose, other than presenting some kind of... unwanted distraction.");
                            break;
                        case 'torso':
                            this.message("[You] fumble around the ropes tying [your] torso to the board. Most of the knots are under the table, out of view, so there is no way to untie them at the moment.");
                            break;
                        case 'chest':
                            this.message("[You] fumble around the ropes tying [your] breasts. Ouch! Why are those be so tight? Removing those would take too much time, and it would serve no useful purpose at the moment.")
                            break;
                        case 'back':
                            this.message("[You] fumble around the ropes behind [your] back. [You] find one knot and untie it, easing some pressure, but there are dozens of them. [You]'d need a lot of time to even find them all.");
                            break;
                        case 'neck':
                            this.message("[You] fumble around the ropes tying [your] neck to the table, finding one knot and untying it dillingently.");
                            if (!this.ropesLoose) {
                                this.ropesLoose = true;
                                this.message("[You] probably don't have time to remove all the knots, but at least [your] neck is somewhat loose. This could be enough to get [your] neck out of the blade's path... Or at least [you] hope so.")
                            }
                            break;
                        default:
                            this.message("[You] fight against the ropes for a little while, but are not able to get any progress. On closer inspection, there are knots around [your] neck, behind [your] back, all around [your] torso, and over [your] chest and [your] crotch. Perhaps by focusing on any specific area, [you] could have better luck.");
                            return DONE;
                    }
                    return DONE;
                },

                'break stock': ">open stock",
                'remove stock': ">open stock",
                'open stock': function(order) {
                    if (this.padlockOpen) {
                        if (this.bladePosition < 0) {
                            this.message("[You] try to push the stocks up, but with the blade so close to [your] neck, there is just no room! Damn!");
                            return DONE;
                        }
                        this.stocksOpen = true;
                        this.message("At last, you push the stocks open. The heavy wood falls down to the floor. Now [you] can get up, and leave forever this cursed contraption!");
                        this.batmanManeuver--;
                        this.showImage('guillotine');
                        return DONE;
                    }
                    if (order.noun2 == 'bar' && this.findEntity('bar').location == 'inventory') {
                        this.message("[You] try to pry open the stocks using the small bar. It's completely fruitless due to the strength of the padlock, though.")
                    } else if (!this.handOut) {
                        this.message("[You] push the stocks, trying to force them open somehow. Despite struggling with all [your] might, as far as [you] can go, [you] achieve nothing. The stocks are securely locked with a padlock and they won't bulge even a quarter of an inch.");
                    } else {
                        this.message("[You] try to force open the stocks using all [your] strength using [your] free hand, but the task is simply impossible while that damn padlock remains closed.");
                    }
                    return DONE;
                },
                'ex stock': function(this: Adventure, order) {
                    this.message("The stocks are made from two sturdy pieces of wood, and they are closed and locked with an imposing padlock. It seems to be hollow in the middle, so the blade can pass through it.");
                    if (this.handOut) {
                        this.message("[Your] head and [your] left hand are still stuck in the stock. [You]'ve been able to slid [your] right hand out of the stock and it's now free.");
                    } else {
                        this.message("[Your] head and both [your] hands are stuck inside.");
                        noticeSlideHand(this);
                    }
                    return DONE;
                },

                'take glove': function(order) {
                    if (this.handOut) {
                        return this.execute(order, "ex glove", true);
                    } else {
                        this.message("[You] can't remove [your] gloves while [your] hands remain in the stocks.");
                        return NOTDONE;
                    }
                },
                'ex glove': ">ex gloves",
                'ex gloves': function(order) {
                    if (this.handOut) {
                        if (order.adjective == 'left') {
                            this.message("Unfortunately, the lockpick was in [your] right glove, not the left one.")
                        } else {
                            this.message("[Your] right glove has fallen out to the floor and is completely out of reach.");
                        }
                    } else {
                        this.message("[Your] trusty lockpick, which has saved [you] from multiple dire situations, is still safely concealed in [your] right glove. [You] could use it to pick the padlock and get out of there. [You] won't be able to do anything of the sort, though, while those damn stocks constraint any of [your] movements.");
                    }
                    return NOTDONE;
                },

                'remove glove': ">pull hand",
                'remove hand, remove hands, pull hands': function(order: Order) {
                    return this.execute(order, this.slideHandNoticed || order.noun2 == 'glove' ? "pull hand" : "open stocks", true);
                },
                'slide hand': ">pull hand",
                'slide glove': ">pull hand",
                'pull hand': function(order: Order) {
                    if (order.adjective == 'left') {
                        this.message("[You] fight the stocks for a moment, only to find [your] left hand has effectively no leeway at all. There is no way [you]'ll be able to get it out without opening them first.");
                        return DONE;
                    }
                    if (order.adjective != 'right') {
                        this.message("Which one?");
                        this.rightOrLeftQuestion = true;
                        return NOTDONE;
                    }
                    if (this.handOut) {
                        this.message("[Your] right hand is already free.");
                        return NOTDONE;
                    }
                    this.extraTime = true;
                    switch (++this.slideHandCounter)
                    {
                        case 1: this.message("[You] pull [your] hand with full force, trying to slide it out of its glove, and finding just the tiny bit of leeway. Ouch! [You're] not sure if [you are] getting some progress done, but it's certainly hurting."); break;
                        case 2: this.message("[You] grind [your] teeth and pull again with all [your] might. The pain grows, as [you] try to fit the hand through a hole way too small for its size. The damn thing may as well be full of needles."); break;
                        case 3: this.message("Forcing [yourself] to ignore the pain, [you] redouble [your] efforts. [Your] hand feels almost completely numb, and [you] can't but wonder if [you]'ve broken something."); break;
                        case 4: this.message("[You are] almost out of breath from [your] struggles. The hand finally moves, if just a little... Yes, it's now finally sliding out of the glove. Just... Just a little more..."); break;
                        case 5:
                            this.message("Finally! [Your] hand finally slides out of the glove, free from those fiendish stocks. It's completely dumb and [your] thumb looks like a mess, but a wound is preferable to death.");
                            this.message("As soon as it's free from the hand, the glove falls out at the other side of the stocks.");
                            this.handOut = true;
                            this.showImage('guillotine');
                            break;
                        default:
                            this.message("Hand counter " + this.slideHandCounter);
                            break;
                    }
                    return DONE;
                },
                'ex hand, ex hands': function(this: Adventure, order) {
                    if (this.handOut) {
                        this.message("[Your] hand looks bloody and nasty, and hurts quite a bit. One or more fingers are probably dislocated or broken. [You] can't see [yourself] doing any kind of proper finesse task any time soon, and [you] can forget about exercising any serious force, too.");
                    } else {
                        this.message("[Your] hands are stuck inside those wicked stocks, with barely any room to struggle.");
                        noticeSlideHand(this);
                    }
                    return DONE;
                },
                'ex head': "[Your] head is stuck inside those wicked stocks, with barely any room to move.",

                'ex padlock': "The padlock looks pretty big and sturdy. It binds the two pieces of the stocks closely together.",
                'break padlock': function(order) { 
                    let hasBar = this.findEntity('bar').location == 'inventory';
                    return hasBar ? this.execute(order, "open padlock with bar", true) : this.execute(order, "open padlock", true);
                },
                'take padlock, pull padlock': ">open padlock",
                'turn key': function(this: Adventure, order) {
                    if (this.padlockKeyTurns >= 2) {
                        return this.execute(order, "open padlock", true);
                    }
                    return NOACTION;
                },
                "open padlock, remove padlock, unlock padlock": function (this: Adventure, order) {
                    let hasKey = this.findEntity('key').location == 'inventory';
                    let hasBar = this.findEntity('bar').location == 'inventory';
                    let method: 'key'|'bar'|'none' = 'none';
                    if (order.noun2 == 'bar')
                        method = 'bar';
                    else if (order.noun2 == 'key')
                        method = 'key';
                    if (method == 'none' && hasKey)
                        method = 'key';
                    if (method == 'none' && hasBar && !hasKey)
                        method = 'bar';
                    if (method == 'key') {
                        if (!hasKey) {
                            this.message("[You] don't have the key.");
                            return NOTDONE;
                        }
                        switch (++this.padlockKeyTurns) {
                            case 1:
                                this.message("[You] clumsily fail to insert the key into the padlock. Damn! [Your] hand hurts like hell, which doesn't make things any easier. Let's try this again...");
                                break;
                            case 2:
                                this.message("After several further attempts, [you are] able to insert the key into the padlock. It's a surprisingly tight fit. Now, [you] only need to turn it and freedom will be [yours].");
                                break;
                            case 3:
                                this.message("Damn! The key is stuck. No matter how much [you] turn it one way or another, it doesn't budge at all.");
                                break;
                            default:
                                this.message("[You] try once and again, to no avail. The realization reels like pure ice inside [your] skin. This is not the right key for the padlock, it never was. What a cruel, sad joke... True despair can only be felt by those who see the rays of hope crumbling before them. Damn you!");
                                break;
                            }
                        return DONE;
                    } else if (method == 'bar') {
                        if (!hasBar) {
                            this.message("[You] don't have that.");
                            return NOTDONE;
                        }
                        this.extraTime = true;
                        this.message("[You] try to force the padlock using the metal bar. There is room to fit the bar between the shank and the padlock body, so [you] pass the bar through the hole and try to pry it open with all [your] strength. Unfortunately, the latch is way too strong for [me], not to mention [your] hand is a mess.");
                        return DONE;
                    } else if (this.handOut) {
                        this.message("[You] reach the padlock and tamper with it for a while, to no avail. It's an ancient model and [you're] confident [you] would be able to pick it open with the appropiate tool, but unfortunately [you] lost [your] lockpick when [your] right glove felt to the floor a moment ago.");
                    } else {
                        this.message("The padlock is close enough, so [you] try to stretch [your] hand as much as [you] can, but there is no luck. The damn thing is just out of [your] reach. [You are] not touching it, at least not while the hands remain in the stocks.");
                    }
                    return DONE;
                },

                'turn head, move head, dodge': function (this: Adventure, order: Order) {
                    if (this.stocksOpen)
                        return this.execute(order, "struggle", true);
                },

                'escape': ">struggle",
                'leave': ">struggle",
                'stand': ">struggle",
                'struggle': function(this: Adventure, order: Order) {
                    if (this.stocksOpen) {
                        if (!this.ropesLoose) {
                            this.message("As soon as [you] try to get up, [you] find [your] effort aborted. The ropes are pinning [you] to the table far too tightly, even reaching [your] neck! [You] can't move your head out of the way of the blade!");
                            return DONE;
                        }
                        this.message("With no stocks to limit [you] movements, [you] move [your] head just enough to stay out of the way of the blade.");
                        return this.waitForKey(() => {
                            this.message("...And not a second too soon! The blade finally slips and falls down, crashing against the lower stock, but luckily finding nothing in its way. Now, only a few knots remain in [your] way, and [you] have all the time in the world to get rid of them.");
                            this.escaped = true;
                            this.showImage('guillotine');
                            return this.waitForKey(() => {
                                this.clear();
                                this.message("[You]'ve escaped one deathtrap more, but this time it has been a close one. Way too close. Boiling thoughts of justified revenge cross [your] mind. Hidden from both the public and the authorities's knowledge, the Gemini Pair have been seeding chaos and mayhem, unhinged by justice and retribution. But now that [you] have a target, their murdering spree is as good as finished.");
                                this.message("\nThank you for playing Thunder Girl 2. Press any key to restart.");
                                return this.waitForKey(() => {
                                    this.clear();
                                    this.restartGame();
                                    return RESTART;
                                });
                            });
                        });
                    }
                    this.message("[You] struggle with all [your] might for a few moments, to no avail. The stocks won't bulge even a quarter of an inch. In addition, [your] body is uncomfortably tied to the board, leaving [you] no room for movement at all.");
                    return DONE;
                },

                // ------------------------------------------------------------------------
                //  Table & key

                'ex wheels': "The accessory table seems to have wheels. It can be pushed around easily.",
                'kick table, pull table, drag table, move table, take table, bring table, push table, slide table': function(this: Adventure, order: Order) {
                    if (this.tableMoved) {
                        this.message("The table is already close enough.");
                        return NOTDONE;
                    }
                    if (!this.feetOut) {
                        this.message("The table is, unfortunately, completely out of reach.");
                        return NOTDONE;
                    }
                    if (this.batmanManeuver) {
                        this.message("[You] need [your] legs in order to reach the table, but [you] need both [your] legs just to barely keep the blade up!");
                        return NOTDONE;
                    }
                    this.message("Using [your] foot, [you are] able to pull the table closer, helped by the fact that it has wheels. It comes to rest close to [your] head.");
                    this.tableMoved = true;
                    this.showImage('guillotine');
                    return DONE;
                },
                'break table': function(this: Adventure, order: Order) {
                    if (this.tableMoved || !this.handOut) {
                        this.message("The table is out of reach.");
                        return NOTDONE;
                    }
                    this.message("But how? The table looks certainly old and battered and the frame looks like its missing some screws at least, but it's not as if punching the thing would accomplish anything useful.");
                    return NOTDONE;
                },
                'ex stretcher': "Just a slab of wood at the bottom of the table. It looks heavy. There is nothing on it.",
                'ex weight, take weight': "*The stretcher at the bottom of the table is barely out of reach. In addition, it seems to be securely screwed to the frame.",
                'ex frame': function(this: Adventure, order: Order) {
                    if (this.tableMoved) {
                        this.message("The small table is supported by a robust metal frame, made from multiple parts welded and screwed together. It has seen better days, though: some of the screws are missing and a few of the bars seem to be severely damaged.");
                    } else {
                        this.message("The small table seems to be supported by some kind of metal frame, as far as [you] can see at a distance.");
                    }
                    return DONE;
                },
                'ex bars, ex parts': function(this: Adventure, order: Order) {
                    if (this.tableMoved) {
                        if (this.findEntity('bar').location == 'destroyed') {
                            if (!this.handOut) {
                                this.message("[You]'d like to take a closer look at that frame, but [you] have no way to do that with [your] hands stuck.");
                                return NOTDONE;
                            }
                            this.barNoticed = true;
                            this.message("[You] reach for the table frame and check it out thoroughly. One of the bars is seemingly loose, has no screws anymore, and could probably be pulled out of the whole ensamble with some effort.");
                            return DONE;
                        }
                        this.message("The rest of the frame ensemble looks solid.");
                        return DONE;
                    }
                },
                'take bar, pull bar': function(this: Adventure, ordeR: Order) {
                    if (this.barNoticed) {
                        let bar = this.findEntity('bar');
                        if (bar.location == 'destroyed') {
                            this.message("It takes [me] some time, but [you are] able to get the bar out of the frame ensemble. It is just a small chunk of metal, but perhaps it could be useful somehow.");
                            bar.location = 'inventory';
                            this.message("Now [you] have [the object].", bar);
                            this.extraTime = true;
                            return DONE;
                        } else {
                            this.message("[You] already pulled out the metal bar.");
                            return NOTDONE;
                        }
                    }
                },
                'put bar, drop bar': function(this: Adventure, order: Order) {
                    if (this.present('bar')) {
                        if (this.batmanManeuver > 0 && (order.noun2 == 'blade' || order.noun2 == 'padlock')) {
                            this.message("[You] don't have enough strength to force open the padlock, but another way has just been presented.");
                            this.message("Carefully, [you] insert the metal bar in the padlock hole and move the body of the bar over the stocks, under the hulking blade. Now, the next step is going to decide [your] fate.");
                            this.barUnderBlade = true;
                            this.showImage('guillotine');
                            return DONE;
                        }
                        if (order.noun2 == 'blade') {
                            this.message("[You] could put the bar in the blade's path, and that could be useful, but the small bar would do nothing to stop the falling blade from continuing its evil path towards [your] neck. It will just fly off after the impact.");
                            return NOTDONE;
                        } else if (order.noun2 == 'padlock') {
                            this.message("There is room to fit the bar between the shank and the padlock body. [You] could try to force open the padlock this way. [You] could also try to get the bar in the blade's path, perhaps as a way to force open the padlock.");
                            return NOTDONE;
                        }
                    }
                },

                // ------------------------------------------------------------------------
                //  Falling blade

                'stop blade': function(this: Adventure, order: Order) {
                    if (this.fallingBlade) {
                        if (this.batmanManeuver > 0) {
                            this.message("[You] are already stopping the blade. This position is excruciatingly hard, though. [You] are not going to last long.");
                            return NOTDONE;
                        }
                        if (this.findEntity('bar').location == 'inventory' && order.noun2 == 'bar') {
                            this.message("Desperately, [you] try to stop the immense hunk of metal using the small metal bar. But due to the strength of the impact, and the feeble state of [your] aching hand, the bar bounces off easily, and the hulking metal passes through unimpeded.");
                            return DONE;
                        } else if (this.handOut && (!this.feetOut || order.noun2 != "foot")) {
                            this.message("Desperately, [you] try to catch the immense hunk of metal with [your] free hand. [Your] precarious position and [your] wounds make the whole endeavor fruitless. The hulking metal completely slips pass [your] hand after [you]'ve barely touched it.");
                            return DONE;
                        } else if (this.feetOut && order.noun2 == 'foot') {
                            this.message("Desperately, [you] bring [your] feet up towards the blade. Catching the hunk of metal as it falls, exerting enough leg force to stop it in place and prevent its fall to continue, is a feat very few could perform. But there is only one Thunder Girl.");
                            this.message("[You] did it! But this position is extremely precarious. The blade weights quite a lot, and [you] can only keep this position for very short time. [Your] legs shudder under the effort required. [You] need to do something, and do it fast!");
                            this.batmanManeuver = 1;
                            this.batmanManeuverPerformed = true;
                            this.showImage('guillotine');
                            return DONE;
                        }
                        this.message("[You] try to force [your] hands out with a last second struggle, but there is just no more time.");
                        return DONE;
                    }
                    if (order.noun2 == 'bar' && this.present('bar')) {
                        this.message("There is no way such a small chunk of metal could do anything against a hulking blade falling down with its full weight.");
                    } else {
                        this.message("The blade is a hefty piece of metal. There is no saving [your] neck if this thing comes down with full force.");
                    }
                    return NOTDONE;
                },
                'drop blade': function(this: Adventure, order: Order) {
                    if (this.batmanManeuver > 0) {
                        this.message("[You] have just let the blade go.");
                        if (this.barUnderBlade) {
                            this.message("The brutal impact prys open the padlock with full violence, its parts flying out who knows where alongside the bar.");
                            this.barUnderBlade = false;
                            this.padlockOpen = true;
                            this.showImage('guillotine');
                            this.findEntity('bar').location = 'guillotine-floor';
                        }
                        this.message("Unfortunately, there is nothing else to stop the blade and the only thing in its path is [yourself].");
                        this.batmanManeuver = 0;
                        return DONE;
                    }
                },
                'lower blade': ">move blade down",
                'raise blade, rise blade': ">move blade up",
                'pull blade, move blade, push blade': function(this: Adventure, order: Order) {
                    if (this.batmanManeuver > 0) {
                        if (order.direction == 'down') {
                            if (this.bladePosition < 0) {
                                this.message("The blade is already way too close for comfort!");
                                return NOTDONE;
                            }
                            this.bladePosition--;
                            this.message("Carefully, [you] relieve some pressure from your legs, bringing the blade down, dangerously close to [your] neck.");
                            if (this.barUnderBlade) {
                                this.message("The blade finds the metal bar in its path, and the weight is more than enough to pry the padlock open. Both the bar and the padlock fall to the floor.");
                                this.barUnderBlade = false;
                                this.padlockOpen = true;
                            }
                            this.showImage('guillotine');
                            return DONE;
                        } else if (order.direction == 'up') {
                            this.bladePosition++;
                            this.message("Forcing [your] muscles pass the point of pain, [you] exert more force to [your] legs, moving the blade slightly up, even if just a few inches.");
                            this.showImage('guillotine');
                            return DONE;
                        } else {
                            this.message("In which direction?");
                            this.upOrDownQuestion = true;
                            return NOTDONE;
                        }
                    }
                },

                // ------------------------------------------------------------------------
                //  Scenery

                'ex light, ex lightning': ">ex lamp",
                'ex room': "The air is a humid, with a metallic scent, and quite dusty. [You] think [you are] in some big and neglected room, probably undergound, inside the Theatre of Illusions. [You] can't see anything more than a few feet away, so [you] have no way to be sure about [your] surroundings.",

                'wait': "[You] rest for a few seconds, catching [your] breath.",
                'help': function(order) {
                    if (hintsActive) {
                        hint.call(this);
                    } else {
                        this.askPrompt = "Do you want hints?| ";
                        this.askCallback = (text) => {
                            if (text.substring(0, 1).toLowerCase() == 'y') {
                                hintsActive = true;
                                this.message("Ok. Hints will be shown after you die. If you really want them, just ask for help and I'll give you one immediately.")
                            } else {
                                this.message("Ok. Ask again if you change your mind.");
                            }
                            return NOTDONE;
                        };
                        return ASK;
                    }
                    return NOTDONE;
                }
            }
        }
    }
};

function noticeSlideHand(adventure: Adventure) {
    if (!adventure.slideHandNoticed) {
        adventure.slideHandNoticed = true;
        adventure.message("[You] can't but notice that, while [your] left hand is completely stuck, [your] right one has a tiny bit of leeway. Given enough time and force, [you] may be able to slid it out of the glove. It will hurt like hell, though. It may not be a good idea.");
    }
}

function hint(this: Adventure) {
    if (!this.tableMoved && this.handOut && !this.feetOut) {
        if (this.slideFeetCounter > 0) {
            this.message("You are on the right track, but some actions need perseverance. If something looks promising, try to do it again.");
        } else {
            this.message("The key is right there! [You] can't reach it, though. What about [your] legs? Aren't they a bit loose, too?");
        }
    } else if (!this.handOut) {
        if (this.slideHandCounter > 0) {
            this.message("You are on the right track, but some actions need perseverance. If something looks promising, try to do it again.");
        } else if (this.slideHandNoticed) {
            this.message("One of [your] hands seems to be a bit loose, didn't you notice?");
        } else if (this.feetOut){
            this.message("The key is right there! [You] should check out [your] hands. [You are] sure they may be a bit loose, too.");
        } else {
            this.message("This is not the first time Thunder Girl faces a death trap. Just recently, she would have been death if it were not for her trusty lockpick, which she always hides in her right glove.");
        }
    } else if (!this.tableMoved)  {
        this.message("The key is right there! Have you tried to pull the table using [your] legs?");
    } else if (!this.batmanManeuverPerformed) {
        daringFeatHint++;
        if (daringFeatHint == 1) {
            this.message("There is not enought time! In order to survive, you'll need to perform a daring feat in the nick of time. But how?")
        } else if (daringFeatHint == 2) {
            this.message("[You] need to stop the blade! There is no way to reach it while it is up there, though.");
        } else if (daringFeatHint == 3) {
            this.message("[You] need to stop the blade precisely when it falls, and not a second before! [You] will only have one chance.");
        } else if (daringFeatHint == 4) {
            this.message("[You]'ll never be able to stop the blade with [your] hand's strength alone. Is there another way?");
        } else {
            this.message("[You]'ll need to stop the blade with [your] feet just at the last second. It looks like an extreme feat, but [you] can do it!");
        }
    } else if (!this.barNoticed) {
        this.barHint++;
        if (this.barHint == 1) {
            this.message("Is Thunder Girl doomed? There is always a way out! You'll need a new object in order to triumph. Examine the surroundings carefully, you have missed something.");
        } else if (this.barHint == 2) {
            this.message("Is there nothing useful nearby? What about the table?");
        } else if (this.barHint == 3) {
            this.message("The table doesn't seem useful by itself. Perhaps one part of it may be.");
        } else {
            this.message("Check out that table's frame once it is nearby. Did you check the bars? You may be able to get one free.");
        }
    } else if (!this.ropesLoose) {
        this.message("[You] need better preparation if [you] want to leave this trap alive. [You] need to do something about those damn ropes!");
    } else {
        this.lastHint++;
        if (this.lastHint == 1) {
            this.message("Where can the metal bar be useful? [You] don't have enough strength to pry open the padlock. Or perhaps...?\n")
        } else if (this.lastHint == 2) {
            this.message("[You] can put the bar into the padlock, but [you] should do that only after [you] have been able to stop the blade.");
        } else if (this.lastHint == 3) {
            this.message("[You] don't have any strength to pry open the padlock, but the blade's weight should be able to do it.");
        } else if (this.lastHint == 4) {
            this.message("Once the bar is in position, try to push the blade down.");
        } else {
            this.message("[You]'ll need to push the blade up again to open the stocks. Other than that, you're all set. Good luck with your escape!");
        }
    }
}

export default guillotine;
