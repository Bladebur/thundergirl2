declare module 'pizzicato' {
    export class Effect {
    }

    export namespace Effects {

        // TODO: Missing effects

        class Delay extends Effect {
            constructor(options?: {
                feedback?: number,
                time?: number,
                mix?: number
            });
        }

        class PingPongDelay extends Effect {
            constructor(options?: {
                feedback?: number,
                time?: number,
                mix?: number
            });
        }

        class DubDelay extends Effect {
            constructor(options?: {
                feedback?: number,
                time?: number,
                cutoff?: number,
                mix?: number
            });
        }

        class Distortion extends Effect {
            constructor(options?: {
                gain?: number,
            });
        }

        /** The flanger produces a swirling effect by delaying a "copy" of the sound by a small, gradually changing period.The flanger effect takes the following parameters:
         *  @param time (min: 0, max: 1, defaults to 0.45): Changes the small delay time applied to the copied signal.
         *  @param speed (min: 0, max: 1, defaults to 0.2): Changes the speed at which the flanging occurs.
         *  @param depth (min: 0, max: 1, defaults to 0.1): Changes the depth/intensity of the swirling effect.
         *  @param feedback (min: 0, max: 1, defaults to 0.1): Changes the volume of the delayed sound.
         *  @param mix (min: 0, max: 1, defaults to 0.5): Volume balance between the original audio and the effected output.
         */
        class Flanger extends Effect {
            constructor(options?: {
                time?: number,
                speed?: number,
                depth?: number,
                feedback?: number,
                mix?: number,
            });
        }

        class Compressor extends Effect {
            constructor(options?: {
                threshold?: number,
                knee?: number,
                attack?: number,
                release?: number,
                ratio?: number,
            });
        }

        class LowPassFilter extends Effect {
            constructor(options?: {
                frequency?: string,
                peak?: number
            }, callback?: () => void);
        }

        class HighPassFilter extends Effect {
            constructor(options?: {
                frequency?: string,
                peak?: number
            }, callback?: () => void);
        }

        class StereoPanner extends Effect {
            constructor(options?: {
                pan?: string,
            }, callback?: () => void);
        }

        class Convolver extends Effect {
            constructor(options?: {
                impulse?: string,
                mix?: number
            }, callback?: () => void);
        }

        class Reverb extends Effect {
            constructor(options?: {
                time?: number,
                decay?: number,
                reverse?: boolean,
                mix?: number
            });
        }

        class RingModulator extends Effect {
            constructor(options?: {
                speed?: number,
                distortion?: number,
                mix?: number
            });
        }

        class Tremolo extends Effect {
            constructor(options?: {
                speed?: number,
                depth?: number,
                mix?: number
            });
        }
    }

    export class Group {
        constructor(sounds: Sound[]);

        addSound(sound: Sound): void;
        removeSound(sound: Sound): void;

        addEffect(effect: Effect): void;
        removeEffect(effect: Effect): void;

        play(): void;
        pause(): void;
        stop(): void;

        volume: number;
    }

    type SoundGenerationFunction = (buffer: AudioBuffer) => void;
    type SoundCreationOptions = {
        detached?: boolean,
        attack?: number,
        release?: number,
        volume?: number,
        loop?: boolean,
        
        /** @deprecated Use release */
        sustain?: number,
    }
    type SoundCreationParameters =
        | SoundGenerationFunction
        | {
            source: 'wave',
            options: SoundCreationOptions & {
                path?: string | string[],
                type?: "sine" | "square" | "sawtooth" | "triangle"
            }
        } | {
            source: 'script',
            options: SoundCreationOptions & {
                audioFunction?: () => void,
                bufferSize?: number,
            }
        } | {
            source: 'file',
            options: SoundCreationOptions & {
                path?: string | string[],
            }
        } | {
            source: 'sound',
            options: SoundCreationOptions & {
                sound?: Sound
            }
        } | {
            source: 'input'
            options: SoundCreationOptions
        };

    export class Sound {
        constructor(description: SoundCreationParameters, callback?: () => void);

        loop: boolean;
        playing: boolean;
        volume: number;
        effects: Effect[];
        effectConnectors: any[];
        lastTimePlayed: number;
        detached: boolean;

        addEffect(effect: Effect): void;
        removeEffect(effect: Effect): void;

        pause(): void;
        play(): void;
        stop(): void;
        clone(): Sound;

        getRawSourceNode(): AudioNode;
    }

    export let context: AudioContext;
}