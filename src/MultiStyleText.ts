import * as PIXI from 'pixi.js';
import { TextStyleSet, ExtendedTextStyle, TagData, MultiStyleTextFormatter, ParagraphDrawingData } from './MultiStyleEngine';
export { TextStyleSet } from './MultiStyleEngine';

"use strict";

export interface MstDebugOptions {
	spans: {
		enabled?: boolean;
		baseline?: string;
		top?: string;
		bottom?: string;
		bounding?: string;
		text?: boolean;
	};
	objects: {
		enabled?: boolean;
		bounding?: string;
		text?: boolean;
	}
}

export interface MstInteractionEvent extends PIXI.interaction.InteractionEvent {
	targetTag: TagData;
}

const INTERACTION_EVENTS = [
	"pointerover",
	"pointerenter",
	"pointerdown",
	"pointermove",
	"pointerup",
	"pointercancel",
	"pointerout",
	"pointerleave",
	"gotpointercapture",
	"lostpointercapture",
	"mouseover",
	"mouseenter",
	"mousedown",
	"mousemove",
	"mouseup",
	"mousecancel",
	"mouseout",
	"mouseleave",
	"touchover",
	"touchenter",
	"touchdown",
	"touchmove",
	"touchup",
	"touchcancel",
	"touchout",
	"touchleave"
];

export default class MultiStyleText extends PIXI.Text {

	public static debugOptions: MstDebugOptions = {
		spans: {
			enabled: false,
			baseline: "#44BB44",
			top: "#BB4444",
			bottom: "#4444BB",
			bounding: "rgba(255, 255, 255, 0.1)",
			text: true
		},
		objects: {
			enabled: false,
			bounding: "rgba(255, 255, 255, 0.05)",
			text: true
		}
	};

	public hitboxes: { tag: TagData, hitbox: PIXI.Rectangle }[];

	private formatter: MultiStyleTextFormatter;
	private padding: number;

	constructor(text: string, styles: TextStyleSet) {
		super(text);
		this.formatter = new MultiStyleTextFormatter(styles, this.canvas);
		INTERACTION_EVENTS.forEach((event) => {
			this.on(event, (e: PIXI.interaction.InteractionEvent) => this.handleInteraction(e));
		});
	}

	private handleInteraction(e: PIXI.interaction.InteractionEvent) {
		let ev = e as MstInteractionEvent;

		let localPoint = e.data.getLocalPosition(this);
		let targetTag = this.hitboxes.reduce((prev, hitbox) => prev !== undefined ? prev : (hitbox.hitbox.contains(localPoint.x, localPoint.y) ? hitbox : undefined), undefined);
		ev.targetTag = targetTag === undefined ? undefined : targetTag.tag;
	}

	public get textStyles() {
		return this.formatter.textStyles;
	}

	public set textStyles(styles: TextStyleSet) {
		this.formatter.textStyles = styles;
		this.dirty = true;
	}

	public setTagStyle(tag: string, style: ExtendedTextStyle): void {
		this.formatter.setTagStyle(tag, style);
		this.dirty = true;
	}

	public deleteTagStyle(tag: string): void {
		this.formatter.deleteTagStyle(tag);
		this.dirty = true;
	}

	private getFontString(style: ExtendedTextStyle): string {
		return new PIXI.TextStyle(style).toFontString();
	}

	public updateText() {
		if (!this.dirty) {
			return;
		}
		this.formatter.context = this.context;
		let result = this.formatter.formatText(this.text);
		this.updateFormattedText(result);
	}

	public updateFormattedText(data: ParagraphDrawingData) {
		this.hitboxes = [];
		this.padding = data.padding;
		this.texture.baseTexture.resolution = this.resolution;

		// define the right width and height
		let width = data.width;
		let height = data.height;

		this.canvas.width = width * this.resolution;
		this.canvas.height = height * this.resolution;

		this.context.scale(this.resolution, this.resolution);

		this.context.textBaseline = "alphabetic";
		this.context.lineJoin = "round";

		this.context.save();

		// First pass: draw the shadows only
		data.drawingData.forEach(({ style, text, x, y }) => {
			if (!style.dropShadow) {
				return; // This text doesn't have a shadow
			}

			this.context.font = this.getFontString(style);

			let dropFillStyle = style.dropShadowColor;
			if (typeof dropFillStyle === "number") {
				dropFillStyle = PIXI.utils.hex2string(dropFillStyle);
			}
			this.context.shadowColor = dropFillStyle;
			this.context.shadowBlur = style.dropShadowBlur;
			this.context.shadowOffsetX = Math.cos(style.dropShadowAngle) * style.dropShadowDistance * this.resolution;
			this.context.shadowOffsetY = Math.sin(style.dropShadowAngle) * style.dropShadowDistance * this.resolution;

			this.context.fillText(text, x, y);
		});

		this.context.restore();

		// Second pass: draw the strokes only
		data.drawingData.forEach(({ style, text, x, y, width, ascent, descent, tag }) => {
			if (style.stroke === undefined || !style.strokeThickness) {
				return; // Skip this step if we have no stroke
			}

			this.context.font = this.getFontString(style);

			let strokeStyle = style.stroke;
			if (typeof strokeStyle === "number") {
				strokeStyle = PIXI.utils.hex2string(strokeStyle);
			}

			this.context.strokeStyle = strokeStyle;
			this.context.lineWidth = style.strokeThickness;

			this.context.strokeText(text, x, y);
		});

		// Third pass: draw the fills only
		data.drawingData.forEach(({ style, text, x, y, width, ascent, descent, tag }) => {
			if (style.fill === undefined) {
				return; // Skip this step if we have no fill
			}

			this.context.font = this.getFontString(style);

			// set canvas text styles
			let fillStyle = style.fill;
			if (typeof fillStyle === "number") {
				fillStyle = PIXI.utils.hex2string(fillStyle);
			} else if (Array.isArray(fillStyle)) {
				for (let i = 0; i < fillStyle.length; i++) {
					let fill = fillStyle[i];
					if (typeof fill === "number") {
						fillStyle[i] = PIXI.utils.hex2string(fill);
					}
				}
			}
			this.context.fillStyle = this._generateFillStyle(new PIXI.TextStyle(style), [text]) as string | CanvasGradient;
			// Typecast required for proper typechecking

			this.context.fillText(text, x, y);
		});

		// Fourth pass: collect the bounding boxes and draw the debug information
		data.drawingData.forEach(({ style, text, x, y, width, ascent, descent, tag }) => {
			let offset = -data.padding;

			let box = new PIXI.Rectangle(x + offset, y - ascent + offset, width, ascent + descent);
			this.hitboxes.push({
				tag,
				hitbox: box
			});

			let debugSpan = style.debug === undefined
				? MultiStyleText.debugOptions.spans.enabled
				: style.debug;

			if (debugSpan) {
				this.context.lineWidth = 1;

				if (MultiStyleText.debugOptions.spans.bounding) {
					this.context.fillStyle = MultiStyleText.debugOptions.spans.bounding;
					this.context.strokeStyle = MultiStyleText.debugOptions.spans.bounding;
					this.context.beginPath();
					this.context.rect(x, y - ascent, width, ascent + descent);
					this.context.fill();
					this.context.stroke();
					this.context.stroke(); // yes, twice
				}

				if (MultiStyleText.debugOptions.spans.baseline) {
					this.context.strokeStyle = MultiStyleText.debugOptions.spans.baseline;
					this.context.beginPath();
					this.context.moveTo(x, y);
					this.context.lineTo(x + width, y);
					this.context.closePath();
					this.context.stroke();
				}

				if (MultiStyleText.debugOptions.spans.top) {
					this.context.strokeStyle = MultiStyleText.debugOptions.spans.top;
					this.context.beginPath();
					this.context.moveTo(x, y - ascent);
					this.context.lineTo(x + width, y - ascent);
					this.context.closePath();
					this.context.stroke();
				}

				if (MultiStyleText.debugOptions.spans.bottom) {
					this.context.strokeStyle = MultiStyleText.debugOptions.spans.bottom;
					this.context.beginPath();
					this.context.moveTo(x, y + descent);
					this.context.lineTo(x + width, y + descent);
					this.context.closePath();
					this.context.stroke();
				}

				if (MultiStyleText.debugOptions.spans.text) {
					this.context.fillStyle = "#ffffff";
					this.context.strokeStyle = "#000000";
					this.context.lineWidth = 2;
					this.context.font = "8px monospace";
					this.context.strokeText(tag.name, x, y - ascent + 8);
					this.context.fillText(tag.name, x, y - ascent + 8);
					this.context.strokeText(`${width.toFixed(2)}x${(ascent + descent).toFixed(2)}`, x, y - ascent + 16);
					this.context.fillText(`${width.toFixed(2)}x${(ascent + descent).toFixed(2)}`, x, y - ascent + 16);
				}
			}
		});

		if (MultiStyleText.debugOptions.objects.enabled) {
			if (MultiStyleText.debugOptions.objects.bounding) {
				this.context.fillStyle = MultiStyleText.debugOptions.objects.bounding;
				this.context.beginPath();
				this.context.rect(0, 0, width, height);
				this.context.fill();
			}

			if (MultiStyleText.debugOptions.objects.text) {
				this.context.fillStyle = "#ffffff";
				this.context.strokeStyle = "#000000";
				this.context.lineWidth = 2;
				this.context.font = "8px monospace";
				this.context.strokeText(`${width.toFixed(2)}x${height.toFixed(2)}`, 0, 8, width);
				this.context.fillText(`${width.toFixed(2)}x${height.toFixed(2)}`, 0, 8, width);
			}
		}

		this.updateTexture();
	}

	protected updateTexture() {
		const texture = this._texture;

		texture.baseTexture.hasLoaded = true;
		texture.baseTexture.resolution = this.resolution;

		texture.baseTexture.realWidth = this.canvas.width;
		texture.baseTexture.realHeight = this.canvas.height;
		texture.baseTexture.width = this.canvas.width / this.resolution;
		texture.baseTexture.height = this.canvas.height / this.resolution;
		texture.trim.width = texture.frame.width = this.canvas.width / this.resolution;
		texture.trim.height = texture.frame.height = this.canvas.height / this.resolution;

		texture.trim.x = -this.padding;
		texture.trim.y = -this.padding;

		texture.orig.width = texture.frame.width - (this.padding * 2);
		texture.orig.height = texture.frame.height - (this.padding * 2);

		// call sprite onTextureUpdate to update scale if _width or _height were set
		this._onTextureUpdate();

		texture.baseTexture.emit('update', texture.baseTexture);

		this.dirty = false;
	}

	// Lazy fill for Object.assign
	private assign(destination: any, ...sources: any[]): any {
		for (let source of sources) {
			for (let key in source) {
				destination[key] = source[key];
			}
		}

		return destination;
	}
}