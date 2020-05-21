import * as PIXI from 'pixi.js';
import * as WebFont from 'webfontloader';
import TextWindow from './TextWindow';

import * as Button from './GUI/Button';

import MainModule from './ThunderGirl/Main';
import GuillotineModule from './ThunderGirl/Guillotine';
import Intro from './ThunderGirl/Intro';

import { Adventure, WAIT, NOTDONE, DefaultAdventureVariables } from './Adventure/Adventure';
import { Output as ATOutput } from './Adventure/Output';
import ScrollContainer from './GUI/ScrollingContainer';
import { sprintf } from 'sprintf-js';
import { TextStyleSet } from './MultiStyleEngine';
import { imageSources } from './images';
import { Tween } from './GUI/Tween';

export const fontFace = "Overlock"; // "Bitter"
export const promptFontFace = "Permanent Marker";

export const styles: TextStyleSet = {
	"default": {
		fontFamily: fontFace,
		fontSize: "28px",
		fill: "#cccccc",
		align: "left"
	},
	"center": {
		align: "center"
	},
	"right": {
		align: "right"
	},
	"i": {
		fontStyle: "italic",
	},
	"b": {
		fontWeight: "bold",
	},
	"yellow": {
		fontWeight: "bold",
		fill: "#FFFF88",
	},
	"white": {
		fontWeight: "bold",
		fill: "#FFFF",
	},
	"grey": {
		fontWeight: "bold",
		fontStyle: "italic",
		fill: "#cccccc",
	},
	"green": {
		fontWeight: "bold",
		fill: "#00FF00",
	},
	"caption": {
		fontWeight: "bold",
		fill: "white",
		bottomMargin: 8
	},
	"prompt": {
		fontFamily: promptFontFace,
		fontSize: "28px",
		fill: "#FFFF88",
		bottomMargin: 12
	},
	"cursor": {
	},
	"input": {
		fontFamily: promptFontFace,
		fontSize: "28px",
		fill: "#FFFF88"
	},
};

var app: PIXI.Application;
var locationImage: PIXI.Sprite;
var locationOverlay: PIXI.Sprite;
var frameLeft: PIXI.Sprite;
var frameRight: PIXI.Sprite;
var fader: PIXI.Graphics;

var intro: Intro;

var atlasDots: PIXI.Spritesheet;
var atlasNoDots: PIXI.Spritesheet;
var noKeyOverlay: PIXI.Sprite;

type Retype<T,N> = { [P in keyof T]?: N; };
export var images: Retype<typeof imageSources, PIXI.Texture> = {}

function loadFonts() {
	WebFont.load({
		google: {
			families: [fontFace, promptFontFace]
		},
		active: () => {
			test();
		}
	});
}

var textWindow: TextWindow;
var adventure: Adventure;

class Output implements ATOutput {
	print(message: string): void {
		textWindow.addText(message);
	}
	input(prompt: string, callback: (text: string) => void): void {
		let parts = prompt.split('|');
		textWindow.promptQuestion = parts.slice(0, parts.length - 1).join('|');
		textWindow.prompt = parts[parts.length - 1];
		textWindow.startInput(callback);
	}
	getKey(callback: (key: string) => void): void {
		textWindow.waitForKey(callback);
	}
	clear() {
		textWindow.clear();
	}
	transcript(): string {
		return textWindow.transcript;
	}
}

function startIntro() {
	adventure = new Adventure();
	intro = new Intro(adventure, () => startGame());
	app.stage.addChild(intro);
	intro.resize();
	intro.show();
}

function startGame() {
	console.log("Starting game, third person is", adventure.thirdPerson);

	new Tween(fader).to({ alpha: 0 }, 1000).onComplete(() => fader.visible = false).start();
	adventure.addModule(MainModule);
	adventure.addModule(GuillotineModule);

	var mustShowOverlay = false;
	var showDots = false;
	var showWait = false;
	
	adventure.updateOverlay = function(this: Adventure) {
		if (locationOverlay != null) {
			locationOverlay.destroy();
			locationOverlay = null;
		}
		if (mustShowOverlay) {
			let imageName = sprintf("%04d.png", Math.min(61, 1 + Math.floor(this.doomCounter)));
			locationOverlay = new PIXI.Sprite(showDots ? atlasDots.textures[imageName] : atlasNoDots.textures[imageName]);
			locationOverlay.anchor.set(0.5, 0);
			locationImage.addChild(locationOverlay);
		}
	}

	setInterval(() => {
		showWait = !showWait;
		if (adventure.extraSpeed > 0 || showWait) {
			showDots = !showDots;
			adventure.updateOverlay();
		}
	}, 250);

	adventure.output = new Output();
	adventure.showImage = function(this: Adventure, image: string) {
		mustShowOverlay = (image == 'guillotine');
		if (image == 'guillotine') {
			if (this.escaped) {
				image = 'guillotineEscape';
			} else if (this.dead) {
				image = this.feetOut ? 'guillotineDeadF' : 'guillotineDead';
			} else if (this.batmanManeuver) {
				if (!this.tableMoved) {
					image = this.handOut ? 'guillotineBatmanH' : 'guillotineBatman';
				} else {
					image =	
							this.stocksOpen ? 		'guillotineBatmanStocksOpen' :
							this.padlockOpen ? 		(this.bladePosition < 0 ? 'guillotineBatmanPadlockOpenDown':'guillotineBatmanPadlockOpenUp') :
							this.barUnderBlade ? 	'guillotineBatmanBarInPadlock' :
							this.handOut ? 			'guillotineBatmanTableH' :
													'guillotineBatmanTable';
				}
			} else if (this.fallingBlade) {
				image = 'guillotineFalling';
				if (this.tableMoved) {
					image = this.handOut ? 'guillotineTableFallingHF' : 'guillotineTableFallingF';
				} else {
					if (this.handOut) {
						image = this.feetOut ? 'guillotineFallingHF' : 'guillotineFallingH';
					} else if (this.feetOut) {
						image = 'guillotineFallingF';
					}
				}
			} else {
				if (this.tableMoved) {
					image = this.handOut ? 'guillotineTableHF' : 'guillotineTableF';
				} else {
					if (this.handOut) {
						image = this.feetOut ? 'guillotineHF' : 'guillotineH';
					} else if (this.feetOut) {
						image = 'guillotineF';
					}
				}
			}
			noKeyOverlay.visible = adventure.findEntity('key').location == 'inventory';
		}
		if (!images[image]) {
			console.error("Image", image, "not found");
		}
		locationImage.texture = images[image];
		this.updateOverlay();
	}

	adventure.startGame();
}


function test() {
	app = new PIXI.Application({
		resolution: 2,
		width: 1200,
		height: 960,
		autoResize: true
	});
	app.renderer.view.style.position = "absolute";
	app.renderer.view.style.display = "block";
	app.renderer.autoResize = true;
	app.renderer.resize(window.innerWidth, window.innerHeight);
	document.body.appendChild(app.view);

	textWindow = new TextWindow(styles);
	textWindow.position.set(32, 32);
	textWindow.height = window.innerHeight - 64;
	textWindow.width = window.innerWidth - 64;
	textWindow.cursorColor = 0xFFFF88;
	textWindow.bottomMargin = 0;
	app.stage.addChild(textWindow);

	function fitSprite(sprite: PIXI.Sprite, x: number, y: number, width: number, height: number,
		halign: 'left' | 'center' | 'right' = 'center',
		valign: 'top' | 'middle' | 'bottom' = 'middle') {
		if (sprite) {
			let scaleW = width / sprite.texture.width;
			let scaleH = height / sprite.texture.height;
			sprite.scale.set(Math.min(scaleW, scaleH));
			sprite.anchor.set(0.5, 0.5);
			let bx: number;
			let by: number;
			switch (halign) {
				case 'left': bx = x + sprite.width * 0.5; break;
				case 'center': bx = x + width * 0.5; break;
				case 'right': bx = x + width - sprite.width * 0.5; break;
			}
			switch (valign) {
				case 'bottom': by = y + height - sprite.height * 0.5; break;
				case 'top': by = y + sprite.height * 0.5; break;
				case 'middle': by = y + height * 0.5; break;
			}
			sprite.position.set(bx, by);
			sprite.updateTransform();
		}
	}

	function resize() {
		const minTextWindowWidth = 300;
		const maxTextWindowWidth = 900;

		fader.clear();
		fader.beginFill(0);
		fader.drawRect(0, 0, window.innerWidth, window.innerHeight);
		fader.endFill();

		let withRightFrame = true;
		let h = window.innerHeight;
		let fs = h / 2160;
		let imgw = Math.min(window.innerWidth * 0.5625, window.innerHeight);
		let midx = imgw - 40*fs;
		let x = midx + 300*fs + 50*fs;
		let textWidth = window.innerWidth - x - 280*fs;
		console.log("Text width", textWidth);
		if (textWidth < 400) {
			withRightFrame = false;
			textWidth += 100;
		}
		let desiredWidth = Math.min(maxTextWindowWidth, Math.max(minTextWindowWidth, textWidth));
		let textScale =
			textWidth < desiredWidth ? Math.min(1, textWidth / minTextWindowWidth) :
				textWidth > desiredWidth ? Math.max(1, textWidth / maxTextWindowWidth) : 1;
		textWindow.width = desiredWidth;
		textWindow.height = (window.innerHeight - 32) / textScale;
		textWindow.scale.set(textScale);
		textWindow.x = x;
		textWindow.y = (window.innerHeight - textWindow.height * textScale)/2;

		let is = h / 1600;
		locationImage.scale.set(is);
		locationImage.anchor.set(0.5, 0);
		locationImage.position.set(imgw - window.innerHeight/2, 0);

		frameLeft.scale.set(fs);
		frameLeft.anchor.set(0, 0);
		frameLeft.position.set(midx, 0);
		frameRight.scale.set(fs);
		frameRight.anchor.set(1, 0);
		frameRight.position.set(window.innerWidth, 0);
		frameRight.visible = withRightFrame;

		if (intro) { intro.resize(); }
	}

	window.onresize = () => {
		app.renderer.resize(window.innerWidth, window.innerHeight);
		resize();
	}

	let loading = new PIXI.Text("Loading ThunderGirl2...", { fill: "#FFFFFF", fontWeight: "bold" });
	loading.anchor.set(1, 1);
	loading.position.set(window.innerWidth - 80, window.innerHeight - 40);
	app.stage.addChild(loading);

	PIXI.loader
		.add('frameLeft',   require("../images/FrameSqLeft.png"))
		.add('frameRight',  require("../images/FrameSqRight.png"))
		.add('atlasDots',   require("../images/Animation_Dots.png"))
		.add('atlasNoDots', require("../images/Animation_NoDots.png"));
	for (var imageName of Object.keys(imageSources)) {
		console.log("Adding", imageName, imageSources[imageName]);
		PIXI.loader.add(imageName, imageSources[imageName]);
	}

	PIXI.loader.on('progress', loader => {
		loading.text = sprintf("Loading %d%%...", Math.floor(loader.progress));
	}).load(loader => {
		console.log(loader.resources);
			locationImage = new PIXI.Sprite(loader.resources["guillotine"].texture);
			frameLeft = new PIXI.Sprite(loader.resources["frameLeft"].texture);
			frameRight = new PIXI.Sprite(loader.resources["frameRight"].texture);
			atlasDots = new PIXI.Spritesheet(loader.resources["atlasDots"].texture.baseTexture, require("../images/Animation_Dots.json"));
			atlasNoDots = new PIXI.Spritesheet(loader.resources["atlasNoDots"].texture.baseTexture, require("../images/Animation_NoDots.json"));
			app.stage.addChild(locationImage);
			app.stage.addChild(frameLeft);
			app.stage.addChild(frameRight);
			fader = new PIXI.Graphics();
			app.stage.addChild(fader);
			for (var imageName in imageSources) {
				images[imageName] = loader.resources[imageName].texture as PIXI.Texture;
			}
			noKeyOverlay = new PIXI.Sprite(images.noKeyOverlay);
			noKeyOverlay.anchor.set(1,1);
			noKeyOverlay.position.set(800, 1600);
			locationImage.addChild(noKeyOverlay);
			resize();

			loading.destroy();

			/*
			Button.DefaultOptions.scale = 0.75;
			Button.DefaultLabelStyle.fontFamily = fontFace;
			Button.DefaultLabelStyle.fontWeight = 'bold';
			let button = new Button.Button(138, 42, "Help");
			app.stage.addChild(button);

			let container = new ScrollContainer(128, 128, 256, 128);
			let paragraph = new PIXI.Text("This is some text which is expected to be multiple lines long, but perhaps I'm goign too far. If you are interested, you can always sing aloud. Lorem ipsum is a nice set of things which could always expand your text for some time.",
				{ wordWrap: true, wordWrapWidth: 256, fill: 'white' });
			app.stage.addChild(container);
			container.addItem(paragraph);
			*/

			Promise.all(
				[
					new Promise(resolve => atlasDots.parse(resolve)),
					new Promise(resolve => atlasNoDots.parse(resolve)),
				]
			).then(startIntro);
		});

	document.addEventListener('wheel', (event) => {
		if (event.ctrlKey) {
			event.preventDefault();
			event.stopImmediatePropagation();
		}
		TextWindow.mouseWheelEvent(event.deltaY);
	});
}

window.onload = loadFonts;