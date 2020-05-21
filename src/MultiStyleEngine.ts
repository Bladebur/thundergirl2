import * as PIXI from 'pixi.js';

export interface TagData {
	name: string;
	properties: { [key: string]: string };
}

export interface FontProperties {
	ascent: number;
	descent: number;
	fontSize: number;
}

export interface TextData {
	text: string;
	style: ExtendedTextStyle;
	width: number;
	height: number;
	fontProperties: FontProperties;
	tag: TagData;
}

export interface TextDrawingData {
	text: string;
	style: ExtendedTextStyle;
	x: number;
	y: number;
	width: number;
	ascent: number;
	descent: number;
	tag: TagData;
}

export interface ParagraphDrawingData {
	text: string;
    bottomMargin: number;
    width: number;
	height: number;
	padding: number;
    hitboxes: { tag: TagData, hitbox: PIXI.Rectangle }[];
    drawingData: TextDrawingData[];
}

export interface ExtendedTextStyle extends PIXI.TextStyleOptions {
	valign?: "top" | "middle" | "bottom" | "baseline" | number;
	extraLineHeight?: number;
	bottomMargin?: number;
	debug?: boolean;
}

export interface TextStyleSet {
	[key: string]: ExtendedTextStyle;
}

export let DEFAULT_TAG_STYLE: ExtendedTextStyle = {
    align: "left",
    breakWords: false,
    // debug intentionally not included
    dropShadow: false,
    dropShadowAngle: Math.PI / 6,
    dropShadowBlur: 0,
    dropShadowColor: "#000000",
    dropShadowDistance: 5,
    fill: "black",
    fillGradientType: PIXI.TEXT_GRADIENT.LINEAR_VERTICAL,
    fontFamily: "Arial",
    fontSize: 26,
    fontStyle: "normal",
    fontVariant: "normal",
    fontWeight: "normal",
    letterSpacing: 0,
    lineHeight: 0,
    lineJoin: "miter",
    miterLimit: 10,
    padding: 0,
    stroke: "black",
    strokeThickness: 0,
    textBaseline: "alphabetic",
    valign: "baseline",
    wordWrap: false,
    wordWrapWidth: 100
};

export class MultiStyleTextFormatter 
{
	public context: CanvasRenderingContext2D;
	public canvas: HTMLCanvasElement;
    public defaultStyle: PIXI.TextStyle;

    private _textStyles: TextStyleSet;

	public get textStyles() {
        return this._textStyles;
    }

	public set textStyles(styles: TextStyleSet) {
		this._textStyles = {};
		this._textStyles["default"] = Object.assign({}, DEFAULT_TAG_STYLE);

		for (let style in styles) {
			if (style === "default") {
				Object.assign(this.textStyles["default"], styles[style]);
			} else {
				this.textStyles[style] = Object.assign({}, styles[style]);
			}
		}
		this.defaultStyle = new PIXI.TextStyle(this.textStyles["default"]);
	}

	public setTagStyle(tag: string, style: ExtendedTextStyle): void {
		if (tag in this.textStyles) {
			Object.assign(this.textStyles[tag], style);
		} else {
			this.textStyles[tag] = Object.assign({}, style);
		}

		this.defaultStyle = new PIXI.TextStyle(this.textStyles["default"]);
	}

	public deleteTagStyle(tag: string): void {
		if (tag === "default") {
			this.textStyles["default"] = Object.assign({}, DEFAULT_TAG_STYLE);
		} else {
			delete this.textStyles[tag];
		}

		this.defaultStyle = new PIXI.TextStyle(this.textStyles["default"]);
	}
    
    constructor(textStyles: TextStyleSet, canvas?: HTMLCanvasElement) {
		this.textStyles = textStyles;
		this.canvas = canvas || document.createElement('canvas');
		this.context = this.canvas.getContext('2d');
    }

	private createTextData(text: string, style: ExtendedTextStyle, tag: TagData): TextData {
		return {
			text,
			style,
			width: 0,
			height: 0,
			fontProperties: undefined,
			tag
		};
    }
    
	private getDropShadowPadding(): number {
		let maxDistance = 0;
		let maxBlur = 0;

		 Object.keys(this.textStyles).forEach((styleKey) => {
			let { dropShadowDistance, dropShadowBlur } = this.textStyles[styleKey];
			maxDistance = Math.max(maxDistance, dropShadowDistance || 0);
			maxBlur = Math.max(maxBlur, dropShadowBlur || 0);
		});

		return maxDistance + maxBlur;
	}

	private getPropertyRegex(): RegExp {
		return new RegExp(`([A-Za-z0-9_\\-]+)=(?:"((?:[^"]+|\\\\")*)"|'((?:[^']+|\\\\')*)')`, "g");
	}

	private getTagRegex(captureName: boolean, captureMatch: boolean): RegExp {
		let tagAlternation = Object.keys(this.textStyles).join("|");

		if (captureName) {
			tagAlternation = `(${tagAlternation})`;
		} else {
			tagAlternation = `(?:${tagAlternation})`;
		}

		let reStr = `<${tagAlternation}(?:\\s+[A-Za-z0-9_\\-]+=(?:"(?:[^"]+|\\\\")*"|'(?:[^']+|\\\\')*'))*\\s*>|</${tagAlternation}\\s*>`;

		if (captureMatch) {
			reStr = `(${reStr})`;
		}

		return new RegExp(reStr, "g");
	}

	private getFontString(style: ExtendedTextStyle): string {
		return new PIXI.TextStyle(style).toFontString();
	}

	private _getTextDataPerLine (lines: string[]) {
		let outputTextData: TextData[][] = [];
		let re = this.getTagRegex(true, false);

		let styleStack = [Object.assign({}, this.textStyles["default"])];
		let tagStack: TagData[] = [{ name: "default", properties: {} }];

		// determine the group of word for each line
		for (let i = 0; i < lines.length; i++) {
			let lineTextData: TextData[] = [];

			// find tags inside the string
			let matches: RegExpExecArray[] = [];
			let matchArray: RegExpExecArray;

			while (matchArray = re.exec(lines[i])) {
				matches.push(matchArray);
			}

			// if there is no match, we still need to add the line with the default style
			if (matches.length === 0) {
				lineTextData.push(this.createTextData(lines[i], styleStack[styleStack.length - 1], tagStack[tagStack.length - 1]));
			}
			else {
				// We got a match! add the text with the needed style
				let currentSearchIdx = 0;
				for (let j = 0; j < matches.length; j++) {
					// if index > 0, it means we have characters before the match,
					// so we need to add it with the default style
					if (matches[j].index > currentSearchIdx) {
						lineTextData.push(this.createTextData(
							lines[i].substring(currentSearchIdx, matches[j].index),
							styleStack[styleStack.length - 1],
							tagStack[tagStack.length - 1]
						));
					}

					if (matches[j][0][1] === "/") { // reset the style if end of tag
						if (styleStack.length > 1) {
							styleStack.pop();
							tagStack.pop();
						}
					} else { // set the current style
						styleStack.push(Object.assign({}, styleStack[styleStack.length - 1], this.textStyles[matches[j][1]]));

						let properties: { [key: string]: string } = {};
						let propertyRegex = this.getPropertyRegex();
						let propertyMatch: RegExpMatchArray;

						while (propertyMatch = propertyRegex.exec(matches[j][0])) {
							properties[propertyMatch[1]] = propertyMatch[2] || propertyMatch[3];
						}

						tagStack.push({ name: matches[j][1], properties });
					}

					// update the current search index
					currentSearchIdx = matches[j].index + matches[j][0].length;
				}

				// is there any character left?
				if (currentSearchIdx < lines[i].length) {
					lineTextData.push(this.createTextData(
						lines[i].substring(currentSearchIdx),
						styleStack[styleStack.length - 1],
						tagStack[tagStack.length - 1]
					));
				}
			}

			outputTextData.push(lineTextData);
		}

		return outputTextData;
	}

	protected wordWrap(text: string): string {
		// Greedy wrapping algorithm that will wrap words as the line grows longer than its horizontal bounds.
		let result = "";
		let re = this.getTagRegex(true, true);

		const lines = text.split("\n");
		const wordWrapWidth = this.defaultStyle.wordWrapWidth;
		let styleStack = [Object.assign({}, this.textStyles["default"])];
		this.context.font = this.getFontString(this.textStyles["default"]);

		for (let i = 0; i < lines.length; i++) {
			let spaceLeft = wordWrapWidth;
			const tagSplit = lines[i].split(re);
			let firstWordOfLine = true;

			for (let j = 0; j < tagSplit.length; j++) {
				if (re.test(tagSplit[j])) {
					result += tagSplit[j];
					if (tagSplit[j][1] === "/") {
						j += 2;
						styleStack.pop();
					} else {
						j++;
						styleStack.push(Object.assign({}, styleStack[styleStack.length - 1], this.textStyles[tagSplit[j]]));
						j++;
					}
					this.context.font = this.getFontString(styleStack[styleStack.length - 1]);
				} else {
					const words = tagSplit[j].split(" ");

					for (let k = 0; k < words.length; k++) {
						const wordWidth = this.context.measureText(words[k]).width;

						if (this.defaultStyle.breakWords && wordWidth > spaceLeft) {
							// Part should be split in the middle
							const characters = words[k].split('');

							if (k > 0) {
								result += " ";
								spaceLeft -= this.context.measureText(" ").width;
							}

							for (let c = 0; c < characters.length; c++) {
								const characterWidth = this.context.measureText(characters[c]).width;

								if (characterWidth > spaceLeft) {
									result += `\n${characters[c]}`;
									spaceLeft = wordWrapWidth - characterWidth;
								} else {
									result += characters[c];
									spaceLeft -= characterWidth;
								}
							}
						} else if(this.defaultStyle.breakWords) {
							result += words[k];
							spaceLeft -= wordWidth;
						} else {
							const paddedWordWidth =
								wordWidth + (k > 0 ? this.context.measureText(" ").width : 0);

							if (paddedWordWidth > spaceLeft) {
								// Skip printing the newline if it's the first word of the line that is
								// greater than the word wrap width.
								if (!firstWordOfLine) {
									result += "\n";
								}

								result += words[k];
								spaceLeft = wordWrapWidth - wordWidth;
							} else {
								spaceLeft -= paddedWordWidth;

								if (k > 0) {
									result += " ";
								}

								result += words[k];
							}
						}
						firstWordOfLine = false;
					}
				}
			}

			if (i < lines.length - 1) {
				result += '\n';
			}
		}

		return result;
	}

	public formatText(text: string): ParagraphDrawingData {
        let result: ParagraphDrawingData = {
			text,
			bottomMargin: 0,
            width: 0,
			height: 0,
			padding: this.defaultStyle.padding + this.getDropShadowPadding(),
            hitboxes: [],
		    drawingData: []
        };

		let textStyles = this.textStyles;
		let outputText = text;

		if (this.defaultStyle.wordWrap) {
            outputText = this.wordWrap(text);
		}

		// split text into lines
		let lines = outputText.split(/(?:\r\n|\r|\n)/);

		// get the text data with specific styles
		let outputTextData = this._getTextDataPerLine(lines);

		// calculate text width and height
		let lineWidths: number[] = [];
		let lineYMins: number[] = [];
		let lineYMaxs: number[] = [];
		let baselines: number[] = [];
		let maxLineWidth = 0;
		let wordWrapWidth = 0;

		for (let i = 0; i < lines.length; i++) {
			let lineWidth = 0;
			let lineYMin = 0;
			let lineYMax = 0;
			let baseline = 0;
			for (let j = 0; j < outputTextData[i].length; j++) {
				let sty = outputTextData[i][j].style;
				let extraHeight = sty.extraLineHeight || 0;
				if (sty.bottomMargin) {
					result.bottomMargin = Math.max(result.bottomMargin, sty.bottomMargin);
				}
				if (sty.wordWrap && sty.wordWrapWidth > 0) {
					wordWrapWidth = Math.max(wordWrapWidth, sty.wordWrapWidth);
				}

				this.context.font = this.getFontString(sty);

				// save the width
				outputTextData[i][j].width = this.context.measureText(outputTextData[i][j].text).width;

				if (outputTextData[i][j].text.length !== 0) {
					outputTextData[i][j].width += (outputTextData[i][j].text.length - 1) * sty.letterSpacing;

					if (j > 0) {
						lineWidth += sty.letterSpacing / 2; // spacing before first character
					}

					if (j < outputTextData[i].length - 1) {
						lineWidth += sty.letterSpacing / 2; // spacing after last character
					}
				}

				lineWidth += outputTextData[i][j].width;

				// save the font properties
				outputTextData[i][j].fontProperties = PIXI.TextMetrics.measureFont(this.context.font);

				// save the height
				outputTextData[i][j].height = outputTextData[i][j].fontProperties.fontSize;

				if (typeof sty.valign === "number") {
					lineYMin =
						Math.min(
							lineYMin,
							sty.valign
								- extraHeight
								- outputTextData[i][j].fontProperties.descent);
					lineYMax =
						Math.max(
							lineYMax,
							sty.valign
								+ outputTextData[i][j].fontProperties.ascent);
				} else {
					lineYMin =
						Math.min(
							lineYMin,
							-extraHeight-outputTextData[i][j].fontProperties.descent);
					lineYMax =
						Math.max(
							lineYMax,
							outputTextData[i][j].fontProperties.ascent);
				}
			}

			lineWidths[i] = lineWidth;
			lineYMins[i] = lineYMin;
			lineYMaxs[i] = lineYMax;
			maxLineWidth = Math.max(maxLineWidth, lineWidth);
		}

		// Use word wrap line width for center/right
		maxLineWidth = Math.max(maxLineWidth, wordWrapWidth);

		// transform styles in array
		let stylesArray = Object.keys(textStyles).map((key) => textStyles[key]);

		let maxStrokeThickness = stylesArray.reduce((prev, cur) => Math.max(prev, cur.strokeThickness || 0), 0);

		let dropShadowPadding = this.getDropShadowPadding();

		let totalHeight = lineYMaxs.reduce((prev, cur) => prev + cur, 0) - lineYMins.reduce((prev, cur) => prev + cur, 0);

		// define the right width and height
		result.width = maxLineWidth + 2 * maxStrokeThickness + 2 * dropShadowPadding;
		result.height = totalHeight + 2 * maxStrokeThickness + 2 * dropShadowPadding;

		this.context.textBaseline = "alphabetic";
		this.context.lineJoin = "round";

		let basePositionY = dropShadowPadding + maxStrokeThickness;

		// Compute the drawing data
		for (let i = 0; i < outputTextData.length; i++) {

			// TODO: Support multiple alignments on same line (i.e. left+right)

			let line = outputTextData[i];
			let sty = outputTextData[i].length > 0 ? outputTextData[i][0].style : this.defaultStyle;
			let linePositionX: number;

			switch (sty.align) {
				case "left":
					linePositionX = dropShadowPadding + maxStrokeThickness;
					break;

				case "center":
					linePositionX = dropShadowPadding + maxStrokeThickness + (maxLineWidth - lineWidths[i]) / 2;
					break;

				case "right":
					linePositionX = dropShadowPadding + maxStrokeThickness + maxLineWidth - lineWidths[i];
					break;
			}

			for (let j = 0; j < line.length; j++) {
				let { style, text, fontProperties, width, height, tag } = line[j];

				let linePositionY = basePositionY + fontProperties.ascent;

				switch (style.valign) {
					case "top":
						// no need to do anything
						break;

					case "baseline":
						linePositionY += lineYMaxs[i] - fontProperties.ascent;
						break;

					case "middle":
						linePositionY += (lineYMaxs[i] - lineYMins[i] - fontProperties.ascent - fontProperties.descent) / 2;
						break;

					case "bottom":
						linePositionY += lineYMaxs[i] - lineYMins[i] - fontProperties.ascent - fontProperties.descent;
						break;

					default:
						// A number - offset from baseline, positive is higher
						linePositionY += lineYMaxs[i] - fontProperties.ascent - style.valign;
						break;
				}

				if (style.letterSpacing === 0) {
					result.drawingData.push({
						text,
						style,
						x: linePositionX,
						y: linePositionY,
						width,
						ascent: fontProperties.ascent,
						descent: fontProperties.descent,
						tag
					});

					linePositionX += line[j].width;
				} else {
					this.context.font = this.getFontString(line[j].style);

					for (let k = 0; k < text.length; k++) {
						if (k > 0 || j > 0) {
							linePositionX += style.letterSpacing / 2;
						}

						let charWidth = this.context.measureText(text.charAt(k)).width;
						result.drawingData.push({
							text: text.charAt(k),
							style,
							x: linePositionX,
							y: linePositionY,
							width: charWidth,
							ascent: fontProperties.ascent,
							descent: fontProperties.descent,
							tag
						});

						linePositionX += charWidth;
						if (k < text.length - 1 || j < line.length - 1) {
							linePositionX += style.letterSpacing / 2;
						}
					}
				}
			}

			basePositionY += lineYMaxs[i] - lineYMins[i];
		}

		// Collect the bounding boxes
		result.drawingData.forEach(({ style, text, x, y, width, ascent, descent, tag }) => {
			let offset = -this.defaultStyle.padding - this.getDropShadowPadding();
			let box = new PIXI.Rectangle(x + offset, y - ascent + offset, width, ascent + descent);
			result.hitboxes.push({
				tag,
				hitbox: box
			});
        });
        
        return result;
	}
}