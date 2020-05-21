import { images } from "../index";
import { Tween, Easing } from "./Tween";
import { PlayFX } from "../audio";

type Option = string | {
    label: string,
    extraHeight?: number,
    textBelow? : string,
    textRight? : string
    stayOpen?: boolean
};

let LabelStyle = new PIXI.TextStyle({
    fontFamily: "Permanent Marker",
    fill: "#ffe32b",
    fontSize: "32px",
    dropShadow: true,
    dropShadowColor: "#000000FF",
    dropShadowDistance: 2,
    dropShadowBlur: 5,
    dropShadowAngle: 90,
    stroke: "#000000",
    strokeThickness: 1,
});

let TextBelowStyle = new PIXI.TextStyle({
    fontFamily: "Overlock",
    fontWeight: "bold",
    fontSize: "24px",
    wordWrap: true,
    fill: "#423b0b",
});

let SelectedLabelStyle = new PIXI.TextStyle({
    fontFamily: "Permanent Marker",
    fill: "#ffffff",
    fontSize: "32px",
    dropShadow: true,
    dropShadowColor: "#000000FF",
    dropShadowDistance: 2,
    dropShadowBlur: 5,
    dropShadowAngle: 90,
    stroke: "#000000",
    strokeThickness: 1,
});

let TitleStyle = new PIXI.TextStyle({
    fontFamily: "Permanent Marker",
    fill: "#423b0b",
    fontWeight: "bold",
    fontSize: "40px",
});

const lineHeight = 45;

export class Menu extends PIXI.Container {
    private optionLabels: PIXI.Text[] = [];
    private optionLabelsBelow: PIXI.Text[] = [];
    private optionLabelsRight: PIXI.Text[] = [];
    private stayOpen: boolean[] = [];
    private bg: PIXI.mesh.NineSlicePlane;
    private titleLabel: PIXI.Text;
    private bar: PIXI.Graphics;
    private selectedOption = 0;
    callback: (option: number) => void;

    constructor(title: string, options: Option[], callback: (option: number) => void) {
        super();

        this.callback = callback;

        this.bg = new PIXI.mesh.NineSlicePlane(images.menu, 380, 200, 240, 130);
        this.bg.scale.set(0.5);
        this.addChild(this.bg);

        this.titleLabel = new PIXI.Text(title, TitleStyle);
        this.titleLabel.anchor.set(0.5, 0);
        this.titleLabel.position.set(0, 10);
        this.addChild(this.titleLabel);

        this.bar = new PIXI.Graphics();
        this.addChild(this.bar);

        let maxWidth = 0;
        let maxLabelWidth = 0;
        let y = 80;
        for (let option of options) {
            let label = new PIXI.Text(typeof option == 'string' ? option : option.label, LabelStyle);
            this.optionLabels.push(label);
            this.optionLabelsRight.push(null);
            this.optionLabelsBelow.push(null);
            this.stayOpen.push(false);
            label.anchor.set(0, 0);
            label.position.set(0, y);
            this.addChild(label)
            maxLabelWidth = Math.max(maxLabelWidth, label.width);
            maxWidth = Math.max(maxWidth, label.width);
            y += lineHeight;

            if (typeof option != 'string') {
                if (option.extraHeight) {
                    y += option.extraHeight;
                }
                if (option.textBelow) {
                    let label2 = new PIXI.Text(option.textBelow, TextBelowStyle);
                    label2.position.set(0, lineHeight + 5);
                    label.addChild(label2);
                    this.optionLabelsBelow[this.optionLabels.length-1] = label2;
                }
                if (option.textRight) {
                    let label2 = new PIXI.Text(option.textRight, LabelStyle);
                    label2.position.set(400, 0);
                    label.addChild(label2);
                    this.optionLabelsRight[this.optionLabels.length-1] = label2;
                    maxWidth = Math.max(maxWidth, label.width + 40 + label2.width);
                }
                if (option.stayOpen) {
                    this.stayOpen[this.stayOpen.length-1] = true;
                }
            }
        }
        TextBelowStyle.wordWrapWidth = maxWidth;

        let width = maxWidth + 200;
        let height = y + 50;
        let extraHeight = 0;
        for (let i = 0; i < this.optionLabels.length; i++) {
            this.optionLabels[i].position.x = width/2 - maxWidth/2 + 30;
            this.optionLabels[i].y += extraHeight;
            if (this.optionLabelsRight[i]) {
                this.optionLabelsRight[i].position.x = maxLabelWidth + 40;
            }
            if (this.optionLabelsBelow[i]) {
                this.optionLabelsBelow[i].style = TextBelowStyle;
                this.optionLabelsBelow[i].updateTransform();
                extraHeight += this.optionLabelsBelow[i].height + 10;
            }
        }
        height += extraHeight;
        this.bg.width = 2*width;
        this.bg.height = 2*height;
        this.titleLabel.position.x = width/2;

        this.bar.position.set(width/2, 82);
        this.bar.beginFill(0, 0.5);
        this.bar.drawRect(-width/2+50, 0, width-100, lineHeight);
        this.bar.endFill();

        let hand = new PIXI.Sprite(images.hand);
        hand.scale.set(0.5);
        hand.position.set(-width/2 + 60, lineHeight/2 - hand.height/2);
        this.bar.addChild(hand);
        new Tween(hand).to({ x: -width/2 + 65 }, 500).easing(Easing.Sinusoidal.InOut).yoyo(true).repeat(Infinity).start();

        this.width = width;
        this.height = height;
        this.pivot.set(width/2, height/2);
        this.visible = false;

        window.addEventListener("keydown", (event) => this.keydown(event), false);
        this.selectOption(0);
    }

    show() {
        this.scale.set(0, 0);
        new Tween(this.scale).to({ x: 1, y: 1 }, 1000).easing(Easing.Elastic.Out).delay(125).onStart(() => {
            this.visible = true;
            this.alpha = 1;
        }).start();
    }

    setTextRight(index: number, text: string) {
        if (this.optionLabelsRight[index]) {
            this.optionLabelsRight[index].text = text;
        }
    }

    setTextBelow(index: number, text: string) {
        if (this.optionLabelsBelow[index]) {
            this.optionLabelsBelow[index].text = text;
        }
    }

    selectOption(index: number) {
        if (this.optionLabels.length == 0) return;
        if (this.optionLabelsRight[this.selectedOption])
            this.optionLabelsRight[this.selectedOption].style = LabelStyle;
        this.optionLabels[this.selectedOption].style = LabelStyle;
        index = Math.floor(index % this.optionLabels.length);
        if (index < 0)
            index += this.optionLabels.length;
        this.bar.position.y = this.optionLabels[index].y + 2;
        this.selectedOption = index;
        this.optionLabels[index].style = SelectedLabelStyle;
        if (this.optionLabelsRight[this.selectedOption])
            this.optionLabelsRight[this.selectedOption].style = SelectedLabelStyle;
    }

    keydown(this: Menu, event: KeyboardEvent) {
        if (!this.visible) {
            return;
        }
        if (event.key == 'ArrowDown') {
            PlayFX('button');
            this.selectOption(this.selectedOption+1);
        } else if (event.key == 'ArrowUp') {
            PlayFX('button');
            this.selectOption(this.selectedOption-1);
        } else if (event.key == ' ' || event.key == 'Enter') {
            PlayFX('button');
            if (this.stayOpen[this.selectedOption]) {
                if (this.callback != null) {
                    this.callback(this.selectedOption);
                }
                return;
            }
            new Tween(this.scale).to({x: 1.5, y: 1.5 }, 500).easing(Easing.Exponential.Out).start();
            new Tween(this).to({ alpha: 0 }, 125).onComplete(() => {
                this.visible = false;
                if (this.callback != null) {
                    this.callback(this.selectedOption);
                }
            }).start();
        }
    }
}