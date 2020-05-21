import { Entity } from './Entity';
import { WordDefinition } from './Vocabulary';

export class Order {
	direction = "";
	directionAsWritten = "";
	verb = "";
	verbAsWritten = "";
	verb2 = "";
	verb2AsWritten = "";
	adjective = "";
	adjectiveAsWritten = "";
	noun = "";
	nounAsWritten = "";
	noun2 = "";
	noun2AsWritten = "";
	number: number = null;;
	adjective2 = "";
	adjective2AsWritten = "";
	adverb = "";
	adverbAsWritten = "";
	preposition = "";
	prepositionAsWritten = "";
	prepositionAfter: WordDefinition;
	conjuntion = "";
	conjuntionAsWritten = "";
	quotedText = "";
	remainingText = "";
	unknownWords = 0;
	object: Entity;
	object2: Entity;
    ambiguousObjects: Entity[];
    ambiguousObjects2: Entity[];

	empty() {
		return !this.direction && !this.verb && !this.noun && !this.adverb && !this.adjective;
	}
}