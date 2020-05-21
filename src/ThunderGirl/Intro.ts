import { images } from "../index";
import { Tween, Easing } from "../GUI/Tween";
import { TextStyleSet } from "../MultiStyleEngine";
import { PlayMusic, EnableMusic, MusicEnabled, EnableFX, StopMusic } from "../audio";
import MultiStyleText from "../MultiStyleText";
import { Menu } from "../GUI/Menu";
import { Adventure } from "../Adventure/Adventure";
import { DefaultLabelStyle } from "../GUI/Button";

var packageJson = require("../../package.json");

const paragraphs: string[] = [
    "It could be a trap. It was, most certainly, a trap.",
    "The venerable Theatre of Illusions, closed and barren for more than forty years after a series of dreadful accidents. It should have been nothing more than a source for spooky legends and a forgotten stockpile of rotting magician props.",
    "If the clues were on point, though, the map revealed it as something far more sinister: the neurological origin of a complex web of criminal abductions, every one of them resulting in a gruesome death and a demented display.",
    "She could be walking right into the den of a psycho, the kind of people who would only enjoy killing in the most abhorrent, agonizing, sick way you can imagine.",
    "It was an easy choice, though.\n    It was a choice she had already made, long ago, the day she came up with her symbolic yellow and black uniform.\n    Facing the cold autumn night, Thunder Girl donned her mask again.",

    "[0,-320] Under a mantle of silence, Thunder Girl descended the rope line, deep into the shadows below. Worried about the easy way in being some kind of an open invitation, she focused on her surroundings.\n    Derelict apparels, boxes, cardboard cutouts and countless gadgets from the world of stage magic piled up and up in dusty neglect, forming an unorganized, seemingly endless maze of shelfs and boards.",
    "Suddenly, a potent flash blinded her. She tensed up, dizzy, ready for some kind of attack. It wouldn't come, though. Instead, there was only laughter.",
    "[1, 420] <black>“Welcome, ladies and gentlemen, to the Theatre of Illusions!”</black>",
    "<black>“Tonight, we are delighted to present you our best all-time special! Daring stunts! Thrilling perils! Breathtaking feats! And last but not least, our most glorious finale, the climax you've been waiting for! The marvelous...! The majestic...! The most anticipated...”</black>",
    "<white>“...death of Thunder Girl!”</white>",

    "The two figures on stage were not familiar to her. Something about the twins crossed the line between the weird and the psychotic: perhaps their mannerism, their dramatic costumes, or the creepy conviction of their speech.\n    <yellow>“And who are you, twits?”</yellow>, she asked, still somewhat disoriented.",
    "<white>“Ouch! So impolite!”</white>",
    "<black>“What do we have here, my beloved audience? Looks like our volunteer has not been diligent in her research. Fear not! We are nothing less than the <grey>Gemini Pair</grey>, the most dazzling escapologist duo of all time, present and future!”",
    "<white>“Yes!”</white>",
    "<black>“...and you, my dear, are nothing more than a mere pretender”.</black>",
    "<black>“You may have been lucky escaping our little underground challenge, bust rest asured, that was nothing more than a meager starter. You will be delicted to see what we have prepared for you next. Grab her, boys!”</black>",

    "Multiple figures openly approached the heroine, seemingly coming from all directions. Thunder Girl readied herself for battle, but she was unprepared for the bizarre nature of her new foes. Instead of the hired henchmen she'd expect, she was surrounded by a number of clumsy looking robot dummies. The 'boys' moved erraticaly, like puppets with broken strings, their eerie apperance completed with cracked skulls, open mouths and some missing eye here and there.",
    "<yellow>“What...?”</yellow>",
    "She was not able to finish the sentence, as the robots suddenly started to shoot a number of fine metal-looking wires from their open mouths. Unnaturaly, coils formed around her body almost instantly, pinning her arms to her body.",
    "<yellow>“Hey! What the hell is this?”</yellow>",
    "The shooting spree continued, as more wires wrangled around her legs and torso and the previous ones tightened up. She desperately tried to push them away, but the constriction force around her body was already too strong. Her attempts, in fact, only seemed to make the damn thing tighter.\n    Finally, under the increasing pressure of metal, Thunder Girl found herself unable to stand anymore and awkardly feel to the floor.",
    "<yellow>“D... Damn! C... Can't get out...”</yellow>",
    "Playful, but assured of their victory, the tweens walked triumphantly towards the heroine's prone figure.",
    "<white>“Oh, my, oh, my! She looks so adorable now, sis!”</white>",
    "<black>“What's the matter, Thunder Girl? Is this the first time you face the strangling wire? I'd advise you not to struggle too much, as it will only accelerate the whole process and make things worse for you. It doesn't really matter, though. The wires won't stop contracting, breaking every bone, digging deep and deeper until eventually your fragile body will be nothing more than a mess of blood and giblets.",
    "<white>“Fun, fun, fun!”</white>",
    "<black>“Worry not, little girl. As much as we'd like to just leave you here to your amusement, we are professionals. What kind of rivals would we be if we didn't give you at least a sporting chance? So we've prepared a much more interesting and fitting challenge especially for you. After all, we have a contract to fulfill.”",
    "<yellow>“W... What kind of contract? With whom?”</yellow>",
    "<black>“Curious until the end, aren't you? Don't let those small details disturb your busy mind. You should worry instead about what we are going to do with you.”</black>",
    "The other villain had produced some kind of dirty rag exuding a strong odor.",
    "<black>“And since we are such a pair of nice girls, we are even going to give you a hand”</black>.",
    "<black>“See this?”</black>.\n    She presented an old-looking small brass key, hanging from a small chain.\n    <black>“It's your way out. Fair game, isn't it? The only thing you have to do is to reach it.”",
    "<black>“But now, it's time to say goodbye. We don't want to spoil the surprise anymore and, as much as we'd like to watch over your struggles, we have precious matters to attend elsewhere. You'll have to excuse us then, as time is of essence”</black>.",
    "Unceremoniously, the white twin pressed the rag down over Thunder Girl's face.",
    "<white>“Aaaaaand now, please, take a deep breath! Oooone, twoooo aaaand....”</white>",
    "<black>“...and now the real fun begins. Farewell, Thunder Girl!”</black>.",
];

const creditsText = `



<help><center><c>Art, music & programming by</c>
Bladebur

<c>Testing & brainstorming</c>
Dudesled
</center>

This game is a text adventure. You can type orders in plain English and the computer will try to describe the results to you. Only a small set of English words and verbs are understood. When in doubt, try to use simple sentences. 

A few commands have a special meaning:
    - <b>INVENTORY</b> will display a list of any objects and clothes you are carrying
    - <b>TAKE</b> to pick up objects (which will then become part of your inventory)
    - <b>LOOK</b> will describe your surroundings again
    - <b>EXAMINE</b> is essential to get hints and discover new objects!
    - <b>HELP</b> will enable the integrated hints system

<b>Warning:</b> the game is very short, but there is a strict time limit. You <b>can</b> get yourself stuck with no hope to escape, and you will die often. Also, be careful: most of your actions will consume at least some in-game time!

Good luck with your escape!`;

const styles: TextStyleSet = {
    "default": {
        fontFamily: "Overlock",
        fontSize: "28px",
        fill: "#cccccc",
        align: "left"
    },
    "center": {
        align: 'center'
    },
    "b": {
        fill: "#FFFF88",
        fontWeight: "bold"
    },
    "c": {
        fill: "#FFFFFF",
        fontWeight: "bold"
    },
    "yellow": {
        fontWeight: "bold",
        fontStyle: "italic",
        fill: "#FFFF88",
    },
    "grey": {
        fontWeight: "bold",
        fontStyle: "italic",
        fill: "#cccccc",
    },
    "black": {
        fontWeight: "bold",
        fontStyle: "italic",
        fill: "#606060",
    },
    "white": {
        fontWeight: "bold",
        fontStyle: "italic",
        fill: "#FFFFFF",
    },
    "title": {
        fill: "#FFFF80",
        fontWeight: "bold",
        fontSize: "30px",
        dropShadow: true,
        dropShadowColor: "#000000FF",
        dropShadowDistance: 4,
        dropShadowBlur: 5,
        dropShadowAngle: 90,
        stroke: "#000000",
        strokeThickness: 6,
    },
    "help": {
        fill: "#E8E8E8",
        strokeThickness: 2,
        dropShadow: true,
        dropShadowColor: "#000000FF",
        dropShadowDistance: 2,
        dropShadowBlur: 3,
        dropShadowAngle: 90,
    }
};

export default class IntroViewer extends PIXI.Container {
    private map: PIXI.Sprite;
    private logo: PIXI.Sprite;
    private photos: PIXI.Sprite[];
    private chatBox: PIXI.Sprite;
    private textBox: MultiStyleText;
    private creditsLabel: MultiStyleText;
    private paragraphIndex = 0;
    private chatBoxY = 0;
    private photoX = 0;
    private photoY = 0;
    private fader: PIXI.Graphics;
    private fader2: PIXI.Graphics;
    private callback: () => void;
    private photoExtraX: number[] = [];
    private started = false;
    private finished = false;
    private chatBoxScale: number = 1;
    private mainMenu: Menu;
    private optionsMenu: Menu;
    private soundMenu: Menu;
    private adventure: Adventure;
    private version: PIXI.Text;

    constructor(adventure: Adventure, callback: () => void) {
        super();
        this.adventure = adventure;
        this.callback = callback;
        this.map = new PIXI.Sprite(images.map);
        this.logo = new PIXI.Sprite(images.logo);
        this.logo.scale.set(0.4, 0.4);
        this.chatBox = new PIXI.Sprite(images.chatBox);
        this.photos = [
            new PIXI.Sprite(images.photo1),
            new PIXI.Sprite(images.photo2),
        ];

        this.version = new PIXI.Text(packageJson.description + " " + packageJson.version, { fontSize: 16, fill: "#c0c0c0", stroke: "#000000", strokeThickness: 2 });
        this.version.anchor.set(1, 1);
        this.version.position.set(window.innerWidth - 2, window.innerHeight - 2);

        this.addChild(this.map);
        this.addChild(this.version);
        this.map.visible = true;
        this.logo.anchor.set(0.5, 0);
        for (var n in this.photos) {
            this.addChild(this.photos[n]);
            this.photos[n].visible = false;
            this.photos[n].anchor.set(0.5, 0);
            this.photos[n].scale.set(0.75, 0.75);
        }
        this.addChild(this.logo);
        this.fader2 = new PIXI.Graphics();
        this.addChild(this.fader2);
        this.fader2.visible = false;

        this.addChild(this.chatBox);
        this.chatBox.visible = false;

        let textBoxStyles: TextStyleSet = Object.assign({}, styles);
        for (var key in textBoxStyles) {
            textBoxStyles[key].wordWrap = true;
            textBoxStyles[key].wordWrapWidth = this.chatBox.width - 160;
        }
        this.textBox = new MultiStyleText("", textBoxStyles);
        this.textBox.position.set(80, 35);
        this.chatBox.addChild(this.textBox);
        
        this.creditsLabel = new MultiStyleText(creditsText, textBoxStyles);
        this.creditsLabel.visible = false;
        this.addChild(this.creditsLabel);

        this.visible = false;

        this.soundMenu = new Menu("Sound Mode", ["Enable Music", "No Music"], (option) => this.soundMenuOption(option));
        this.mainMenu = new Menu("Main Menu", ["Start Game", "Skip Intro", "Options", "Help!"],
            (option) => this.mainMenuOption(option));
        this.optionsMenu = new Menu("Options",
            [
                {
                    label: "Music",
                    textRight: "Yes",
                    stayOpen: true
                },
                {
                    label: "Person Mode",
                    textRight: "2nd",
                    textBelow: "“You will be Thunder Girl”",
                    stayOpen: true
                },
                "Back"
            ],
            (option) => this.optionsOption(option));
        this.updateOptionLabels();
        this.addChild(this.optionsMenu);
        this.addChild(this.mainMenu);

        this.fader = new PIXI.Graphics();
        this.addChild(this.fader);
        this.addChild(this.soundMenu);
        this.resize();

        window.addEventListener("keydown", (event) => this.keydown(event), false);
        window.addEventListener("keydown", (event) => this.keyup(event), false);
    }

    keysOutCallback: () => void;
    keysOutTimeout: any;

    restartKeyOutTimeout() {
        if (this.keysOutTimeout) {
            clearTimeout(this.keysOutTimeout);
            this.keysOutTimeout = undefined;
        }
        if (this.keysOutCallback) {
            this.keysOutTimeout = setTimeout(() => {
                this.keysOutCallback();
                this.keysOutCallback = undefined;
            }, 500);
        }
    }

    keyup(event: KeyboardEvent) {
        this.restartKeyOutTimeout();
    }

    keydown(event: KeyboardEvent) {
        if (this.creditsLabel.visible) {
            new Tween(this.map).to({ alpha: 1 }, 250).start();
            new Tween(this.creditsLabel).to({ alpha: 0 }, 250).onComplete(() => {
                this.mainMenu.show();
                this.creditsLabel.visible = false;
            }).start();
        }
        if (this.visible == false || this.finished || !this.started) {
            return;
        }
        this.restartKeyOutTimeout();

        if (event.key == 'Enter' || event.key == 'ArrowRight' || event.key == ' ') {
            this.showNextParagraph();
        }
    }

    resize() {
        let width = window.innerWidth;
        let height = window.innerHeight;
        let ratio = width / height;
        this.chatBoxScale = Math.min(height / 966, 1);
        console.log(`Aspect ratio: ${ratio} for ${width}x${height}, chatBox scale: ${this.chatBoxScale}`);

        this.version.position.set (width - 40, height - 20);
        
        let mapWidth = this.map.texture.width;
        let mapHeight = this.map.texture.height;
        let mapScale = Math.max(height / mapHeight, width / mapWidth);
        this.map.scale.set(mapScale, mapScale);

        this.logo.scale.set(0.4 * this.chatBoxScale);
        this.logo.x = width / 2;

        this.chatBox.scale.set(this.chatBoxScale);
        this.chatBox.x = width / 2 - this.chatBox.width / 2;
        this.chatBox.y = this.chatBoxY = height - this.chatBox.height;

        if (this.parent != null) {
            this.updateTransform();
        }

        this.photoX = width / 2;
        this.photoY = height - 160 * this.chatBoxScale;
        for (var photoIndex in this.photos) {
            this.photos[photoIndex].anchor.set(0.5, 1);
            this.photos[photoIndex].scale.set(this.chatBoxScale * 0.75);
            this.photos[photoIndex].x = this.photoX + this.photoExtraX[photoIndex] * this.chatBoxScale;
            this.photos[photoIndex].y = this.photoY;
        }

        this.creditsLabel.anchor.set(0.5, 0.5);
        this.creditsLabel.scale.set(this.chatBoxScale);
        this.creditsLabel.position.set(width/2, height/2);

        this.fader.clear();
        this.fader.beginFill(0);
        this.fader.drawRect(0, 0, width, height);
        this.fader.endFill();
        this.fader2.clear();
        this.fader2.beginFill(0);
        this.fader2.drawRect(0, 0, width, height);
        this.fader2.endFill();

        this.soundMenu.x = this.optionsMenu.x = this.mainMenu.x = width / 2;
        this.soundMenu.y = height / 2;
        this.optionsMenu.y = this.mainMenu.y = height*0.8;

        if (this.parent != null) {
            this.updateTransform();
        }
    }

    showPhoto(index: number, x: number) {
        this.photoExtraX[index] = x;
        this.photos[index].visible = true;
        this.photos[index].rotation = x > 0 ? Math.PI / 2 : -Math.PI / 2;
        this.photos[index].x = x > 0 ? this.width + this.photos[index].width : -this.photos[index].width;
        this.photos[index].y = -this.photos[index].height;
        new Tween(this.photos[index]).to({
            x: this.photoX + x * this.chatBoxScale,
            y: this.photoY,
            rotation: 0
        }, 500).easing(Easing.Quadratic.Out).start();
    }

    showText(text: string) {
        this.chatBox.visible = true;
        this.textBox.text = text;
        this.textBox.updateText();
        this.chatBox.y = this.height;
        this.chatBox.alpha = 1;
        new Tween(this.chatBox).to({ y: this.chatBoxY }, 500).easing(Easing.Quartic.Out).start();
    }

    showNextParagraph() {
        if (this.chatBox.visible == false) {
            if (!paragraphs[this.paragraphIndex]) {
                this.finished = true;
                this.keysOutCallback = () => this.hide(250);
                this.restartKeyOutTimeout();
                return;
            }

            let text = paragraphs[this.paragraphIndex++];
            if (text.startsWith('[')) {
                let photoIndex = parseInt(text.substring(1));
                let x = parseInt(text.substring(text.indexOf(',') + 1));
                text = text.replace(/^\[.*\] */g, "");
                if (photoIndex == 1) {
                    PlayMusic('music_gemini');
                    setTimeout(() => { this.showText(text); this.showPhoto(photoIndex, x); }, 500);
                    return;
                }
                this.showPhoto(photoIndex, x);
            }

            this.showText(text);
            if (this.paragraphIndex == paragraphs.length) {
                this.fader2.visible = true;
                this.fader2.alpha = 0;
                new Tween(this.fader2).to({alpha: 1}, 2000).start();
            }
        } else {
            new Tween(this.chatBox).to({ alpha: 0 }, 180).easing(Easing.Exponential.Out).onComplete(() => {
                this.chatBox.visible = false;
                this.showNextParagraph();
            }).start();
        }
    }

    show() {
        this.visible = true;
        this.soundMenu.show();
    }

    hide(fadeTime = 500) {
        new Tween(this.fader).to({ alpha: 1 }, fadeTime).onComplete(() => {
            PlayMusic('music_tension');
            this.visible = false;
            this.callback();
        }).start();
        StopMusic();
    }

    updateOptionLabels() {
        this.optionsMenu.setTextRight(0, MusicEnabled() ? "Yes" : "No");
        this.optionsMenu.setTextRight(1, this.adventure.thirdPerson ? "2nd" : "1st");
        this.optionsMenu.setTextBelow(1, this.adventure.thirdPerson ? "“You will be Thunder Girl”" : "“I will be Thunder Girl”");
    }

    soundMenuOption(option: number) {
        EnableMusic(option == 0);
        EnableFX(option == 0);
        this.updateOptionLabels();
        PlayMusic('music_tension');
        new Tween(this.fader).to({ alpha: 0 }, 500).start();
        setTimeout(() => this.mainMenu.show(), 100);
    }

    optionsOption(option: number) {
        switch (option) {
            case 0:
                EnableMusic(!MusicEnabled());
                EnableFX(MusicEnabled());
                if (MusicEnabled()) {
                    PlayMusic('music_tension');
                } else {
                    StopMusic();
                }
                this.updateOptionLabels();
                break;
            case 1:
                this.adventure.thirdPerson = !this.adventure.thirdPerson;
                this.adventure.saveDefaultVariables();
                this.updateOptionLabels();
                break;
            default:
                this.mainMenu.show();
                break;
        }
    }

    mainMenuOption(option: number) {
        switch (option) {
            case 0:
                this.started = true;
                this.showNextParagraph();
                break;
            case 1:
                this.finished = true;
                this.hide();
                break;
            case 2:
                this.optionsMenu.show();
                break;
            case 3:
                this.creditsLabel.alpha = 0;
                this.creditsLabel.visible = true;
                new Tween(this.map).to({ alpha: 0.25 }, 250).start();
                new Tween(this.creditsLabel).to({ alpha: 1 }, 250).start();
                break;
            default:
                this.mainMenu.show();
                break;
        }
    }
}