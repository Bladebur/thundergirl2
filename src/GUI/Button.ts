import * as PIXI from 'pixi.js';

export interface ImageSet {
    default: PIXI.Texture;
    disabled?: PIXI.Texture;
    hover?: PIXI.Texture;
    pressed?: PIXI.Texture;
}

export class Options {
    paddingX = 24;
    paddingY = 8;
    tint = 0xFFFF80;
    hoverTint:number;
    disabledTint:number;
    pressedLabelDeltaX = 2; 
    pressedLabelDeltaY = 2; 
    pressedScale = 1;
    pressedTint: number;
    scale = 1;
    images: ImageSet;

    constructor(options?: Partial<Options>) {
        if (options) {
            Object.assign(this, options);
        }
    }
}

export let DefaultOptions = new Options({
    images: {
        default: PIXI.Texture.from(require('./ButtonDefault.png')),
        disabled: PIXI.Texture.from(require('./ButtonDisabled.png')),
        hover: PIXI.Texture.from(require('./ButtonHighlight.png')),
        pressed: PIXI.Texture.from(require('./ButtonPressed.png'))
    }
});

export let DefaultLabelStyle = new PIXI.TextStyle({
    fontFamily: "Segoe",
    fontSize: "36px",
    fill: "black",
    align: "center",
});

function fitText(text: PIXI.Text, rect: PIXI.Rectangle, align: 'left' | 'center' | 'right' = 'center') {
    switch (align) {
        case 'left':
            text.anchor.set(0, 0.5);
            text.position.set(rect.x, rect.y + rect.height / 2);
            break;
        case 'center':
            text.anchor.set(0.5, 0.5);
            text.position.set(rect.x + rect.width / 2, rect.y + rect.height / 2);
            break;
        case 'right':
            text.anchor.set(1, 0.5);
            text.position.set(rect.x + rect.width, rect.y + rect.height / 2);
            break;
    }
    text.scale.set(1);
    text.updateTransform();
    console.log("Text size", text.width, "rect", rect.width);
    text.scale.set(Math.min(1, Math.min(rect.height / text.height, rect.width / text.width)));
}

export enum State {
    Default,
    Disabled,
    Hovered,
    Pressed
}

export class Button extends PIXI.Sprite {
    private text: PIXI.Text;
    private state: State = State.Default;
    private textPosition: PIXI.Point;
    private options: Options;

    public callback: (button: Button) => void;

    public get disabled() { return this.state == State.Disabled; }
    public set disabled(value: boolean) { 
        if (value) {
            this.state = State.Disabled;
            this.updateButtonTexture();
        } else if (this.state == State.Disabled) {
            this.state = State.Default;
            this.updateButtonTexture();
        }
    }

    constructor(x: number, y: number, label: string, options?: Options) {
        super((options && options.images && options.images.default) || DefaultOptions.images.default);
        this.options = Object.assign(new Options(), DefaultOptions, options);
        this.label = label;

        this
            .on('mouseover', () => this.hover())
            .on('mouseout', () => this.exit())
            .on('mousedown', () => this.press())
            .on('mouseup', () => this.release());
        
        this.interactive = true;
        this.buttonMode = true;
        this.anchor.set(0.5, 0.5);
        this.position.set(x, y);
    }

    private updateButtonTexture() {
        let image = this.options.images.default;
        let scale = this.options.scale || 1;
        let textPosition = this.textPosition.clone();
        let tint = this.options.tint;
        switch (this.state) {
            case State.Pressed:
                image = this.options.images.pressed || this.options.images.hover || image;
                textPosition.x += this.options.pressedLabelDeltaX;
                textPosition.y += this.options.pressedLabelDeltaY;
                scale *= this.options.pressedScale || 1;
                tint = this.options.pressedTint || this.options.hoverTint || this.options.tint;
                break;
            case State.Hovered:
                image = this.options.images.hover || image;
                tint = this.options.hoverTint || this.options.tint;
                break;
            case State.Disabled:
                image = this.options.images.disabled || image;
                tint = this.options.disabledTint;
                break;
        }
        this.texture = image;
        this.text.position = textPosition;
        this.scale.set(scale);
        this.tint = tint;
    }

    public set images(images: ImageSet) {
        if (this.options.images !== images) {
            this.options.images = images;
            this.updateButtonTexture();
        }
    }

    public set label(value: string) {
        if (this.text) {
            this.text.destroy();
        }
        this.text = new PIXI.Text(value, DefaultLabelStyle);
        this.text.anchor.set(0.5, 0.5);
        this.addChild(this.text);

        let w = this.width/2 - this.options.paddingX;
        let h = this.height/2 - this.options.paddingY;
        let align: 'left' | 'center' | 'right' = 'center';
        if (DefaultLabelStyle.align === 'left' || DefaultLabelStyle.align == 'right')
            align = DefaultLabelStyle.align;
        fitText(this.text, new PIXI.Rectangle(-w, -h, 2*w, 2*h), align);
        this.textPosition = this.text.position.clone();
        this.updateButtonTexture();
    }

    private hover() {
        if (this.state !== State.Disabled && this.state !== State.Pressed) {
            this.state = State.Hovered;
            this.updateButtonTexture();
        }
    }

    private exit() {
        if (this.state === State.Hovered || this.state === State.Pressed) {
            this.state = State.Default;
            this.updateButtonTexture();
        }
    }

    private press() {
        if (this.state !== State.Disabled) {
            this.state = State.Pressed;
            this.updateButtonTexture();
        }
    }

    private release() {
        if (this.state === State.Pressed) {
            this.state = State.Hovered;
            this.updateButtonTexture();
            if (this.callback) {
                this.callback(this);
            } else {
                console.error(`Button "${this.text.text}" has no callback defined`);
            }
        }
    }
}