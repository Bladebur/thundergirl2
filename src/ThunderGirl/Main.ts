import { Module } from "../Adventure/Module";
import { Adventure, NOACTION, NOTDONE, DONE } from "../Adventure/Adventure";

declare module '../Adventure/Adventure' {
    interface AdventureVariables {
        horny: number,
        previousHorny: number
    }
}

let module: Module = {
	entities: {
		costume: {
			name: "[your] costume",
			description: "Thunder Girl's costume is a two-piece yellow swimsuit with a slightly reflective surface made by a flexible but strong material, complete with gloves, knee-high boots, mask, and cape. Despite the ammount of flesh showing, it is still pretty conservative at this day and age.",
			wearable: true,
			location: 'inventory',
			proper: true,
			worn: true
		},
		belt: {
			name: "[your] utility belt",
			description: "Thunder Girl's all-purpose utility belt is a solid black leather belt filled with a number of pouches designed to contain all kinds of crime-fighting equipment and tools.",
			wearable: true,
			worn: true,
			location: 'inventory',
			proper: true
		}
	},
	adjectives: {
		'first': [],
		'second': [],
		'third': [],
	},
	verbs: {
		'help': [ 'hints' ],
		'transcript': []
	},
	nouns: {
		'costume': ['clothes', 'bikini', 'swimsuit'],
		'pouches': ['pouch', 'tool', 'tools'],
		'gloves': [],
		'glove': [],
		'cape': [],
		'boots': ['boot'],
		'foot': ['feet'],
		'leg': ['legs'],
		'mask': [],
		'you': ['yourself'],
		'me': ['myself', 'superheroine', 'heroine'],
		'person': [],
	},

	after: function(this: Adventure) {
		if (this.horny == this.previousHorny) {
			if (this.horny > 0) {
				this.horny--;
			} else {
				this.horny = 0;
			}
		}
		this.previousHorny = this.horny;
	},

	before: function (this: Adventure, order) {
		switch (order.verb) {
			case 'drop':
			case 'break':
			case 'take':
				var costumePart = (order.noun === 'gloves' || order.noun === 'cape' ||
					order.noun === 'boots' || order.noun === 'mask');
				if (costumePart) {
					order.noun = 'costume';
					order.object = this.findEntity('costume');
				}
				break;
		}
		switch (order.verb) {
			case 'remove':
				if (order.noun == 'costume') {
					this.message("[You'd] rather leave [the object] alone.", order.object);
					return NOTDONE;
				}
				console.log("Removing", order);
				if (order.noun == 'mask') {
					this.message("[You'd] rather leave [your] mask alone.");
					return NOTDONE;
				}
				break;
		}
		return NOACTION;
	},

	execute: function (this: Adventure, order) {

		if (!order.verb && order.noun == 'person') {
			if (order.adjective == 'second' || order.adjective == 'third') {
				this.thirdPerson = true;
				this.message("From now on, [you] will be the protagonist of this adventure.");
				return NOTDONE;
			}
			if (order.adjective == 'first') {
				this.thirdPerson = false;
				this.message("From now on, [you] will be the protagonist of this adventure.");
				return NOTDONE;
			}
		}
		switch (order.verb) {				
			case 'transcript':
				window.document.getElementById('popup').style.visibility = 'visible';
				let area = (window.document.getElementById('text') as HTMLTextAreaElement);
				area.textContent = this.output.transcript();
				area.select();
				window.document.execCommand('copy');
				this.message("A transcript of this playthrough has been copied to your clipboard.");
				return NOTDONE;

			case 'examine':
				if (order.noun === 'me' || order.noun === 'you') {
					this.message("Clara Celestia, or, as [you are] more commonly known as, Thunder Girl. [You are] just a young and aspiring superheroine who pretends to rock the crime world with no powers or abilities other than a sharp mind, considerable resources, and growing fanbase.");
					return DONE;
				}
				if (this.present('costume')) {
					if (order.noun === 'pouches' ||
						(order.preposition == 'into' && order.object.key === 'pouches')) {
						if (this.player.location == 'buried-chained')
							return NOACTION;
						this.message("The pouches are empty. Looks like [your] captors took the precaution of removing all its useful contents.");
						return DONE;
					}
					switch (order.noun) {
						case 'gloves':
							this.message("The gloves are thin and flexible. They are designed for maximum mobility and comfort, comparable to the ones a doctor would wear.");
							return DONE;
						case 'cape':
							this.message("A middle-size plastic purple cape. [You] used to wear a longer one, but it was too prone to accidents and misuse by foes in a fight.");
							return DONE;
						case 'boots':
							this.message("A pair of solid leather boots, same color as the costume. No heels. Made for comfort and performance.");
							return DONE;
						case 'mask':
							this.message("The mask is a simple plastic decoration fixed with theathre glue and an almost invisible string. It won't fall away accidentally, and serves its purpose, although [you're] amazed nobody recognises [me] with it.");
							return DONE;
					}
				}
				break;
		}
		return NOACTION;
	}
};

export default module;