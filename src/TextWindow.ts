import * as PIXI from 'pixi.js';
import { TextStyleSet, default as MultiStyleText } from './MultiStyleText';
import { MultiStyleTextFormatter, ParagraphDrawingData } from './MultiStyleEngine';
import { SSL_OP_NO_QUERY_MTU } from 'constants';

"use strict";

interface Paragraph {
    text: string;
    dirty: boolean;
    block?: MultiStyleText;
    height?: number;
    data?: ParagraphDrawingData;
}

enum TextWindowState {
    Filling,
    ScrollingToBottom,
    ScrollingToTop,
    ClampToTop,
    ClampToBottom,
    Dragging,
    Browsing
}

export default class TextWindow extends PIXI.Container {
    public styles: TextStyleSet;
    public lineHeight: number = 21;
    public totalHeight: number = 0;
    public scrollInertia: number = 0.85;
    public topMargin: number = 0;
    public bottomMargin: number = 0;
    public prompt = "> ";
    public promptQuestion = "";
    public promptStyle = "prompt";
    public inputStyle = "input";
    public cursorStyle = "cursor";
    public inputText = "";
    public inputCursorX = 0;
    public transcript = "";

    private state: TextWindowState = TextWindowState.Filling;

    constructor(styles: TextStyleSet) {
        super();
        this.styles = styles;
        PIXI.ticker.shared.add(this.animate, this);
        this.registerDraggingEvents();
    }

    destroy() {
        PIXI.ticker.shared.remove(this.animate);
    }

    clear() {
        for (let paragraph of this.paragraphs)
            paragraph.block && paragraph.block.destroy();
        this.paragraphs = [];
        this.state = TextWindowState.Filling;
        this._offset = 0;
        this.dirty = true;
    }

    //#region Dragging

    private draggingData: PIXI.interaction.InteractionData;
    private draggingFrom: PIXI.Point;
    private draggingOffset: number;
    private draggingOutOfBounds = false;
    private mouseWheelOffset: number = null;
    private mouseWheelAutoScrollIn: number = 0;
    private static mouseOver: TextWindow;

    private registerDraggingEvents() {
        this.interactive = true;
        this.buttonMode = true;
        this.defaultCursor = 'grab';
        this.on('mousedown', (event) => this.onDragStart(event))
            .on('touchstart', (event) => this.onDragStart(event))
            .on('mouseup', (event) => this.onDragEnd(event))
            .on('mouseupoutside', (event) => this.onDragEnd(event))
            .on('touchend', (event) => this.onDragEnd(event))
            .on('touchendoutside', (event) => this.onDragEnd(event))
            .on('mousemove', (event) => this.onDragMove(event))
            .on('touchmove', (event) => this.onDragMove(event))
            .on('mouseover', () => TextWindow.mouseOver = this)
            .on('mouseout', () => {
                if (TextWindow.mouseOver == this)
                    TextWindow.mouseOver = undefined;
            });
        TextWindow.mouseOver = this;
    }

    public static mouseWheelEvent(delta: number) {
        if (TextWindow.mouseOver) {
            TextWindow.mouseOver.onMouseWheel(delta);
        }
    }

    private onDragStart(event: PIXI.interaction.InteractionEvent) {
        this.draggingData = event.data;
        this.draggingFrom = event.data.getLocalPosition(this);
        this.draggingOffset = this._offset;
        this.state = TextWindowState.Dragging;
        this.draggingOutOfBounds = false;
        TextWindow.mouseOver = this;
    }

    private onDragEnd(event: PIXI.interaction.InteractionEvent) {
        if (this.state === TextWindowState.Dragging) {
            this.draggingData = null;
            let maxHeight = this.totalHeight - this.height;
            if (maxHeight < 0)
                this.state = TextWindowState.ScrollingToTop;
            else if (this._offset > maxHeight)
                this.state = TextWindowState.ScrollingToBottom;
            else if (this._offset < 0)
                this.state = TextWindowState.ScrollingToTop;
            else
                this.state = TextWindowState.Browsing;
        }
    }

    private onDragMove(event: PIXI.interaction.InteractionEvent) {
        if (this.state == TextWindowState.Dragging) {
            let newPosition = this.draggingData.getLocalPosition(this);
            let newOffset = this.draggingOffset - (newPosition.y - this.draggingFrom.y);
            let maxHeight = Math.max(0, this.totalHeight - this.height);
            this.draggingOutOfBounds = false;
            if (newOffset < 0) {
                newOffset = Math.max(-200, -this.dragCurve(-newOffset));
                this.draggingOutOfBounds = true;
            } else if (newOffset > maxHeight) {
                newOffset = Math.min(200, this.dragCurve(newOffset - maxHeight)) + maxHeight;
                this.draggingOutOfBounds = true;
            }
            this.setOffset(newOffset);
        }
        TextWindow.mouseOver = this;
    }

    private onMouseWheel(deltaY: number) {
        if (this.mouseWheelOffset === null) {
            this.mouseWheelOffset = this._offset;
        }
        this.state = TextWindowState.Browsing;
        this.mouseWheelOffset += deltaY;
        let newOffset = this.mouseWheelOffset;
        let maxHeight = Math.max(0, this.totalHeight - this.height);
        if (newOffset < 0) {
            newOffset = -this.dragCurve(-newOffset, 50);
            this.draggingOutOfBounds = true;
            this.mouseWheelAutoScrollIn = 5;
        } else if (newOffset > maxHeight) {
            newOffset = this.dragCurve(newOffset - maxHeight, 50) + maxHeight;
            this.draggingOutOfBounds = true;
            this.mouseWheelAutoScrollIn = 5;
        }
        this.setOffset(newOffset);
    }

    private dragCurve(t: number, factor = 150) {
        return factor * (1 - Math.exp(-t / 325));
    }

    //#endregion

    //#region Input handling

    private input = false;
    private inputCallback: (text: string) => void;
    private static inputWindow: TextWindow;
    private inputHistory: string[] = [];
    private inputHistoryIndex = 0;

    public startInput(callback: (text: string) => void) {
        if (TextWindow.inputWindow)
            TextWindow.inputWindow.input = false;
        this.input = true;
        this.inputText = "";
        this.dirty = true;
        this.inputCursorX = 0;
        this.inputCallback = callback;
        this.inputHistoryIndex = this.inputHistory.length;
        this.inputHistory.push("");
        this.updateInputText();
        TextWindow.inputWindow = this;
    }

    private updateInputText() {
        let lastParagraph = this.paragraphs[this.paragraphs.length - 1];
        let cursorOver = this.inputText.slice(this.inputCursorX, this.inputCursorX + 1);
        lastParagraph.text =
            this.promptQuestion +
            "<" + this.promptStyle + ">" +
            this.prompt +
            "</" + this.promptStyle + ">" +
            "<" + this.inputStyle + ">" +
            this.inputText.slice(0, this.inputCursorX) +
            "<" + this.cursorStyle + ">" +
            cursorOver +
            "</" + this.cursorStyle + ">" +
            this.inputText.slice(this.inputCursorX + 1) +
            "</" + this.inputStyle + ">";
        lastParagraph.dirty = true;
        this.dirty = true;
    }

    //#endregion

    //#region Keyboard input

    private waitForKeyCallback: (key: string) => void;
    private static waitingForKeyWindow: TextWindow;

    public waitForKey(callback: (text: string) => void) {
        this.waitForKeyCallback = callback;
        TextWindow.waitingForKeyWindow = this;
        this.dirty = true;
    }

    public static keyPressed(event: KeyboardEvent) {
        let inputWindow = TextWindow.inputWindow;
        let keyWindow = TextWindow.waitingForKeyWindow;
        if (keyWindow != null) {
            TextWindow.waitingForKeyWindow = null;
            keyWindow.waitForKeyCallback(event.key);
        } else if (inputWindow != null) {
            var key = event.which;
            let text = inputWindow.inputText;
            let cursorX = inputWindow.inputCursorX;
            switch (key) {
                default:
                    if (key >= 32) {
                        inputWindow.inputText = text.slice(0, cursorX) +
                            event.key + text.slice(cursorX);
                        inputWindow.inputCursorX++;
                        inputWindow.updateInputText();
                    }
                    break;
            }
        }
    }

    public static keyDown(event: KeyboardEvent) {
        let inputWindow = TextWindow.inputWindow;
        if (inputWindow != null) {
            if (inputWindow.state == TextWindowState.Browsing || inputWindow.state == TextWindowState.ClampToTop) {
                inputWindow.state = TextWindowState.ScrollingToBottom;
                if (inputWindow.totalHeight < inputWindow.height)
                    inputWindow.state = TextWindowState.ScrollingToTop;
                if (event.which == 13 || event.which == 27) {
                    event.preventDefault();
                    return;
                }
            }
            inputWindow._cursorBlinkElapsed = -inputWindow.cursorWaitAfterKeyPress;
            inputWindow._cursorBlink = false;
            switch (event.which) {
                case 8: // Backspace
                    if (inputWindow.inputCursorX > 0) {
                        inputWindow.inputText = inputWindow.inputText.slice(0, inputWindow.inputCursorX - 1) + inputWindow.inputText.slice(inputWindow.inputCursorX);
                        inputWindow.inputCursorX--;
                    }
                    break;
                case 13: // Return
                    TextWindow.inputWindow = null;
                    inputWindow.inputHistory[inputWindow.inputHistory.length - 1] = inputWindow.inputText;
                    inputWindow.input = false;
                    inputWindow.updateCursor();
                    inputWindow.transcript += "\n> " + inputWindow.inputText;
                    inputWindow.addText("\n");
                    if (inputWindow.inputCallback)
                        inputWindow.inputCallback(inputWindow.inputText);
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    return;

                case 46: // Delete
                    inputWindow.inputText = inputWindow.inputText.slice(0, inputWindow.inputCursorX) + inputWindow.inputText.slice(inputWindow.inputCursorX + 1);
                    break;
                case 27: // Escape
                    inputWindow.inputText = "";
                    inputWindow.inputCursorX = 0;
                    break;
                case 36: // Home
                    inputWindow.inputCursorX = 0;
                    break;
                case 35: // End
                    inputWindow.inputCursorX = inputWindow.inputText.length;
                    break;
                case 37: // Left
                    inputWindow.inputCursorX = Math.max(0, inputWindow.inputCursorX - 1);
                    break;
                case 39: // Right
                    inputWindow.inputCursorX = Math.min(inputWindow.inputText.length, inputWindow.inputCursorX + 1);
                    break;
                case 38: 		// Up
                    inputWindow.inputHistory[inputWindow.inputHistoryIndex] = inputWindow.inputText;
                    if (--inputWindow.inputHistoryIndex < 0)
                        inputWindow.inputHistoryIndex = inputWindow.inputHistory.length - 1;
                    inputWindow.inputText = inputWindow.inputHistory[inputWindow.inputHistoryIndex];
                    inputWindow.inputCursorX = inputWindow.inputText.length;
                    break;
                case 40: 		// Down
                    inputWindow.inputHistory[inputWindow.inputHistoryIndex] = inputWindow.inputText;
                    if (++inputWindow.inputHistoryIndex == inputWindow.inputHistory.length)
                        inputWindow.inputHistoryIndex = 0;
                    inputWindow.inputText = inputWindow.inputHistory[inputWindow.inputHistoryIndex];
                    inputWindow.inputCursorX = inputWindow.inputText.length;
                    break;
                default:
                    return;
            }
            event.preventDefault();
            inputWindow.updateInputText();
        }
    }
    public static keyUp(event: KeyboardEvent) {
    }

    //#endregion

    //#region Cursor handling

    public cursorBlinkRate = 16;
    public cursorWaitAfterBlink = 0;
    public cursorWaitAfterKeyPress = 16;
    public cursorColor = 0xFFFFFF;
    public cursorWidth = 10;
    public cursorHeight = 2;
    public cursorOffset = 1;

    private _focused = true;
    private _cursorBlinkElapsed = 0;
    private _cursorBlink = false;
    private _cursor: PIXI.Graphics;
    private _cursorArea: PIXI.Rectangle;
    private _cursorWidth = -1;
    private _cursorParagraph: PIXI.Container;
    private updateCursor() {
        if (!this.input && TextWindow.waitingForKeyWindow !== this && this._cursor) {
            this._cursor.destroy();
            this._cursor = undefined;
        }
        if (this._cursor && this._cursorArea && this._cursorParagraph) {
            let x = this._cursorArea.x;
            let y = this._cursorArea.y;
            let width = this._cursorWidth == -1 ? this._cursorArea.width : this._cursorWidth;
            let height = this._cursorArea.height;
            this._cursor.clear();
            this._cursor.beginFill(this.cursorColor, this._cursorBlink ? 0 : 1);
            if (this.cursorHeight == -1)
                this._cursor.drawRect(x, y + this.cursorOffset, width, height - this.cursorOffset);
            else
                this._cursor.drawRect(x, y + height - this.cursorHeight + this.cursorOffset, width, this.cursorHeight);
            this._cursor.endFill();
            this._cursor.position = this._cursorParagraph.position;
        }
    }
    private moveCursorTo(paragraph: PIXI.Container, x: number, y: number, width: number, height: number) {
        if (!this._cursor) {
            this._cursor = new PIXI.Graphics();
        }
        if (!width) {
            width = this.cursorWidth;
        }
        this._cursorArea = new PIXI.Rectangle(x, y, width, height);
        this._cursorParagraph = paragraph;
        this._cursorWidth = width;
        if (this._cursor.parent)
            this._cursor.parent.removeChild(this._cursor);
        this.addChildAt(this._cursor, 0);
        this.updateCursor();
    }

    //#endregion

    //#region Size & Mask

    private _maskRect: PIXI.Graphics;
    private _offset = 0;
    private _width = 0;
    private _height = 0;
    get height() {
        return this._height;
    }
    set height(value: number) {
        this._height = value;
        this.dirty = true;
        this.updateMask();
    }
    get width() {
        return this._width;
    }
    set width(value: number) {
        this._width = value;
        for (var paragraph of this.paragraphs) {
            paragraph.dirty = true;
        }
        this.dirty = true;
        this.updateMask();
    }

    private updateMask() {
        if (!this._maskRect) {
            this._maskRect = new PIXI.Graphics();
            this.addChild(this._maskRect);
        } else {
            this._maskRect.clear();
        }
        this._maskRect.drawRect(0, 0, this.width, this.height);
        this.mask = this._maskRect;
        this.hitArea = new PIXI.Rectangle(0, 0, this._width, this._height);
    }

    //#endregion

    //#region Animation

    private setOffset(offset: number) {
        const increment = offset - this._offset;
        for (var paragraph of this.paragraphs) {
            if (paragraph.block) {
                paragraph.block.position.y -= increment;
            }
        }
        this._offset = offset;
        if (this._cursor && this._cursorParagraph) {
            this._cursor.position = this._cursorParagraph.position;
        }
        this.dirty = true;
        this.update();
    }

    public animate(deltaTime: number) {
        if (this.state == TextWindowState.ScrollingToBottom || this.state == TextWindowState.ScrollingToTop) {
            const desiredOffset = this.state == TextWindowState.ScrollingToBottom ? this.totalHeight - this.height : 0;
            this.mouseWheelOffset = null;
            let nextOffset = this._offset * this.scrollInertia + desiredOffset * (1 - this.scrollInertia);
            if (Math.abs(this._offset - desiredOffset) < 2 && !this.dirty) {
                nextOffset = desiredOffset;
                this.state = this.totalHeight < this.height ? TextWindowState.Filling : 
                    (this.state == TextWindowState.ScrollingToBottom ? TextWindowState.ClampToBottom : TextWindowState.ClampToTop);
            }
            const increment = nextOffset - this._offset;
            for (var paragraph of this.paragraphs) {
                if (paragraph.block) {
                    paragraph.block.position.y -= increment;
                }
            }
            this._offset = nextOffset;
            if (this._cursor && this._cursorParagraph)
                this._cursor.position = this._cursorParagraph.position;
            this.dirty = true;
            this.update();
        }
        if (this.mouseWheelAutoScrollIn > 0) {
            if (this.state !== TextWindowState.Browsing) {
                this.mouseWheelAutoScrollIn = 0;
            } else {
                this.mouseWheelAutoScrollIn -= deltaTime;
                if (this.mouseWheelAutoScrollIn < 0) {
                    this.mouseWheelAutoScrollIn = 0;
                    if (this._offset < 0 || this.height > this.totalHeight)
                        this.state = TextWindowState.ScrollingToTop;
                    else
                        this.state = TextWindowState.ScrollingToBottom;
                }
            }
        }
        if (this.input || TextWindow.waitingForKeyWindow == this) {
            if (!document.hasFocus()) {
                this._focused = false;
                if (!this._cursorBlink) {
                    this._cursorBlink = true;
                    this.updateCursor();
                }
            } else {
                if (!this._focused) {
                    this._focused = true;
                    this._cursorBlink = false;
                    this._cursorBlinkElapsed = -this.cursorWaitAfterKeyPress - deltaTime;
                    this.updateCursor();
                }
                this._cursorBlinkElapsed += deltaTime;
                if (this._cursorBlinkElapsed > this.cursorBlinkRate) {
                    this._cursorBlinkElapsed %= this.cursorBlinkRate;
                    this._cursorBlink = !this._cursorBlink;
                    if (!this._cursorBlink)
                        this._cursorBlinkElapsed -= this.cursorWaitAfterBlink;
                    this.updateCursor();
                }
            }
        }
    }

    //#endregion

    //#region Rendering contents

    private paragraphs: Paragraph[] = [];
    private dirty: boolean = false;

    public addText(value: string) {
        this.transcript += value;
        let lines = value.split("\n");
        if (this.paragraphs.length > 0) {
            let lastParagraph = this.paragraphs[this.paragraphs.length - 1];
            lastParagraph.text += lines.shift();
            lastParagraph.dirty = true;
        }
        for (var line of lines) {
            this.paragraphs.push({ text: line, dirty: true });
        }
        this.dirty = true;

        if (this.state == TextWindowState.ClampToBottom) {
            this.state = TextWindowState.ScrollingToBottom;
        }
    }

    public update() {
        if (!this.dirty) {
            return;
        }
        this.dirty = false;

        /* Update dirty paragraphs & compute total height */
        this.totalHeight = this.bottomMargin + this.topMargin;
        let formatter: MultiStyleTextFormatter;
        for (let index = 0; index < this.paragraphs.length; index++) {
            let paragraph = this.paragraphs[index];
            let last = index == this.paragraphs.length - 1;
            if (paragraph.dirty) {
                if (paragraph.block) {
                    paragraph.block.texture.destroy(true);
                    this.removeChild(paragraph.block);
                    paragraph.block = undefined;
                }
                if (!formatter) { 
                    for (var key in this.styles) {
                        this.styles[key].wordWrap = true;
                        this.styles[key].wordWrapWidth = this.width;
                    }
                    formatter = new MultiStyleTextFormatter(this.styles); 
                }
                paragraph.data = formatter.formatText(paragraph.text);
                paragraph.height = Math.max(paragraph.data.height - paragraph.data.padding * 2, this.lineHeight);
                if (!last) {
                    paragraph.height += paragraph.data.bottomMargin;
                }
                paragraph.dirty = false;
            }
            this.totalHeight += paragraph.height;
        }

        /* Update offset position in clamp mode */
        if (this.state == TextWindowState.ClampToBottom || this.state == TextWindowState.ClampToTop) {
            const desiredOffset = this.state == TextWindowState.ClampToBottom ? this.totalHeight - this.height : 0;
            if (this._offset != desiredOffset) {
                const increment = desiredOffset - this._offset;
                for (var paragraph of this.paragraphs) {
                    if (paragraph.block) {
                        paragraph.block.position.y -= increment;
                    }
                }
                this._offset = desiredOffset;
            }
        }

        /* Move paragraphs to final position, update cursor, render visible ones & destroy offscreen ones, update cursor */
        let y = -this._offset + this.topMargin;
        for (let index = 0; index < this.paragraphs.length; index++) {
            let paragraph = this.paragraphs[index];
            let last = index == this.paragraphs.length - 1;
            if (!paragraph.block && y + paragraph.data.height >= 0 && y < this.height) {
                paragraph.block = new MultiStyleText(paragraph.data.text, this.styles);
                paragraph.block.updateFormattedText(paragraph.data);
                this.addChild(paragraph.block);
                paragraph.block.position.set(0, y);
                if (last && (TextWindow.waitingForKeyWindow == this || TextWindow.inputWindow == this)) {
                    let found = false;
                    for (let box of paragraph.block.hitboxes) {
                        if (box.tag.name === 'cursor') {
                            this.moveCursorTo(paragraph.block, box.hitbox.x, box.hitbox.y, box.hitbox.width, box.hitbox.height);
                            found = true;
                        }
                    }
                    if (!found) {
                        let height = paragraph.data.height - paragraph.data.padding*2;
                        let lastText = paragraph.data.drawingData[paragraph.data.drawingData.length-1];
                        let width = lastText ? lastText.x + lastText.width + paragraph.data.padding : 0;
                        this.moveCursorTo(paragraph.block, width - this.cursorWidth, 0, this.cursorWidth, height);
                    }
                }
            } else if (paragraph.block && (y + paragraph.data.height < 0 || y > this.height)) {
                paragraph.block.texture.destroy(true);
                this.removeChild(paragraph.block);
                paragraph.block = undefined;
            }
            y += paragraph.height;
        }
        this.updateTransform();

        /* Enable scrolling if window fills up */
        if (this.state == TextWindowState.Filling && this.totalHeight > this.height) {
            this.state = TextWindowState.ScrollingToBottom;
        }

        //console.log("Text Window updated, current size:", this.width+"x"+this.height, "total height", this.totalHeight, "Paragraphs:", this.paragraphs.length);
    }

    renderWebGL(renderer: PIXI.WebGLRenderer) {
        this.update();
        super.renderWebGL(renderer);
    }

    renderCanvas(renderer: PIXI.CanvasRenderer) {
        this.update();
        super.renderCanvas(renderer);
    }

    //#endregion
}

const pressListener = TextWindow.keyPressed;
const downListener = TextWindow.keyDown;
const upListener = TextWindow.keyUp;

window.addEventListener("keydown", downListener, false);
window.addEventListener("keyup", upListener, false);
window.addEventListener("keypress", pressListener, false);