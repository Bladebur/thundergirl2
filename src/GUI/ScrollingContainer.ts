import * as PIXI from 'pixi.js';
import { Tween, Easing, ITween } from './Tween';

function dragCurve(t: number, factor = 150) {
    return factor * (1 - Math.exp(-t / 325));
}

export default class ScrollContainer extends PIXI.Container {
    public contents: PIXI.Container;
    public items: PIXI.DisplayObject[];

    private lastPos: PIXI.Point;
    private lastDiff: number;
    private scrollTween: Tween<PIXI.Container>;
    private dragging: boolean;
    private dragFrom: number;
    private dragFromY: number;

    private rectWidth: number;
    private rectHeight: number;

    public contentHeight: number;
    public itemHeight: number;

    public get height() {
        return this.rectHeight;
    }
    public get width() {
        return this.rectWidth;
    }

    constructor(x: number, y: number, width: number, height: number, itemHeight?: number) {
        super();
        this.x = x;
        this.y = y;
        this.contents = new PIXI.Container();
        this.addChild(this.contents);
        this.items = [];
        this.rectWidth = width;
        this.rectHeight = height;
        this.contentHeight = 0;
        this.itemHeight = itemHeight;
        this.mask = new PIXI.Graphics();
        this.mask
            .beginFill(0xFFFFFF)
            .drawRect(0, 0, width, height)
            .endFill();
        this.addChild(this.mask);
        this.contents.mask = this.mask;
        this.dragging = false;
        this.lastPos = null;
        this.lastDiff = null;
        this.scrollTween = null;
        this.interactive = true;
        this.on('mousedown', e => this.onMouseDown(e));
        this.on('mousemove', e => this.onMouseMove(e));
        this.on('mouseup', e => this.onMouseUp());
        this.on('mouseupoutside', e => this.onMouseUp());
        this.on('touchmove', e => this.onMouseMove(e));
        this.on('touchstart', e => this.onMouseDown(e));
        this.on('touchend', e => this.onMouseUp());
        this.on('touchendoutside', e => this.onMouseUp());
    }

    onMouseMove(e: PIXI.interaction.InteractionEvent) {
        var clientY = e.data.getLocalPosition(this).y;
        if (this.dragging) {
            this.lastDiff = clientY - this.lastPos.y;
            this.lastPos.y = clientY;
            this.contents.y = this.dragFrom + clientY - this.dragFromY;
            if (this.contents.y > 0)
                this.contents.y = dragCurve(this.contents.y);
            let minPos = this.rectHeight - this.contentHeight;
            if (this.contents.y < minPos)
                this.contents.y = minPos - dragCurve(minPos - this.contents.y);
        }
    }

    onMouseDown(e: PIXI.interaction.InteractionEvent) {
        var clientY = e.data.getLocalPosition(this).y;
        this.dragging = true;
        if (this.scrollTween) {
            this.scrollTween.stop();
            this.scrollTween = null;
        }
        this.lastPos = new PIXI.Point(0, clientY);
        this.dragFrom = this.contents.y;
        this.dragFromY = clientY;
    }

    onMouseUp() {
        let goY = this.contents.y + this.lastDiff * 10;
        let ease = Easing.Quadratic.Out;
        let time = 0.5 + Math.abs(this.lastDiff / 150);
        if (goY < -this.contentHeight + this.rectHeight) {
            goY = -this.contentHeight + this.rectHeight;
            ease = Easing.Back.Out;
            time = 0.5 + Math.abs(this.lastDiff / 150);
        }
        if (goY > 0) {
            goY = 0;
            ease = Easing.Back.Out;
            time = 0.5 + Math.abs(this.lastDiff / 150);
        }
        this.scrollTween = new Tween(this.contents).to({ y: goY }, time*1000).easing(ease).start();
        this.dragging = false;
        this.lastPos = null;
        this.lastDiff = null;
    }

    private lastHideY: number;
    hideOffscreenElements() {
        if (this.lastHideY === this.contents.y)
            return;
        
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            let y0 = this.contents.y + item.y;
            let y1 = y0 + (item instanceof PIXI.Container ?
                (item as PIXI.Container).height : this.itemHeight);
            item.visible = !(y0 > this.rectHeight || y1 < 0);
        }
        this.updateTransform();
        //console.log("Items visible:", this.items.reduce((count, n) => n.visible ? count + 1 : count, 0));
    }

    addItem(item: PIXI.DisplayObject) {
        this.contents.addChild(item);
        this.items.push(item);
        item.y = this.contentHeight;
        if (item instanceof PIXI.Container) {
            this.contentHeight += (item as PIXI.Container).height;
        } else if (this.itemHeight) {
            this.contentHeight += this.itemHeight;
        }
        this.lastHideY = undefined;
    }

    renderWebGL(renderer: PIXI.WebGLRenderer): void {
        this.hideOffscreenElements();
        super.renderWebGL(renderer);
    }
    renderAdvancedWebGL(renderer: PIXI.WebGLRenderer): void {
        this.hideOffscreenElements();
        super.renderAdvancedWebGL(renderer);
    }
    renderCanvas(renderer: PIXI.CanvasRenderer): void {
        this.hideOffscreenElements();
        super.renderCanvas(renderer);
    }
}