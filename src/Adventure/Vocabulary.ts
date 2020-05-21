
export enum WordType {
    Adjective,
    Preposition,
    Noun,
    Verb,
    Conjunction,
    Direction,
    Pronoun,
    ConvertibleNoun,
    Adverb,

    /** Special nouns are ignored by pronouns */
    SpecialNoun,
}

export class WordDefinition {
    public type: WordType;
    public baseWord: string;
}

type WordTable = { [word: string]: WordDefinition[] };

/** A words dictionary, with base words as keys and an array of synonyms for each one.
  ```
  { 
     'red':     [], 
     'magenta': ['rose','violet'] 
     ...
  }
  ```
 */
export type Words = { [word: string]: string[] };

export class WordTables {
    adjectives?: Words;
    adverbs?: Words;
    conjunctions?: Words;
    convertibleNouns?: Words;
    directions?: Words;
    nouns?: Words;
    prepositions?: Words;
    pronouns?: Words;
    specialNouns?: Words;
    verbs?: Words;
}

export class Vocabulary {

    private words: WordTable;

    constructor(tables?: WordTables) {
        this.words = {};
        this.addWords(tables);
    }

    findWord(word: string) {
        let result = this.words[word];
        if (result && result.length == 0)
            return undefined;
        else
            return result;
    }

    addWord(word: string, type: WordType) {
        if (word) {
            let def = this.words[word];
            if (!def) {
                this.words[word] = [{ type, baseWord: word }];
            } else if (!def.find(n => n.type == type)) {
                def.push({ type, baseWord: word });
            }
        }
    }

    addWords(tables: WordTables) {
        if (tables) {
            this.addWordsOfType(tables.adjectives, WordType.Adjective);
            this.addWordsOfType(tables.adverbs, WordType.Adverb);
            this.addWordsOfType(tables.conjunctions, WordType.Conjunction);
            this.addWordsOfType(tables.convertibleNouns, WordType.ConvertibleNoun);
            this.addWordsOfType(tables.directions, WordType.Direction);
            this.addWordsOfType(tables.nouns, WordType.Noun);
            this.addWordsOfType(tables.prepositions, WordType.Preposition);
            this.addWordsOfType(tables.specialNouns, WordType.SpecialNoun);
            this.addWordsOfType(tables.verbs, WordType.Verb);
        }
    }

    addWordsOfType(table: Words, type: WordType) {
        for (var word in table) {

            // Ensure that the base word exists, add it otherwise
            if (!this.words[word] || this.words[word].length == 0)
                this.words[word] = [{ baseWord: word, type }];
            else if (this.words[word].find(n => n.type === type && n.baseWord !== word))
                console.error(`Dictionary collision: word ${word} already exists as a synonym of ${this.words[word][0].baseWord}`);

            // Add synonyms to the vocabulary
            for (var synonym of table[word]) {
                if (!this.words[synonym])
                    this.words[synonym] = [];
                else {
                    let dup = this.words[synonym].find(n => n.type == type);
                    if (dup) {
                        if (dup.baseWord !== word)
                            console.error(`Dictionary collision between words "${dup.baseWord}" and "${word}"`);
                        continue;
                    }
                }
                this.words[synonym].push({ type, baseWord: word });
            }
        }
    }
}