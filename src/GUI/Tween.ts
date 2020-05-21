/**
 * Tween.js - Licensed under the MIT license
 * https://github.com/tweenjs/tween.js
 * ----------------------------------------------
 *
 * See https://github.com/tweenjs/tween.js/graphs/contributors for the full list of contributors.
 * Thank you all, you're awesome!
 */

export const Easing = {

    Linear(k: number): number { return k; },

    Quadratic: {
        In(k: number): number {
            return k * k;
        },
        Out(k: number): number {
            return k * (2 - k);
        },
        InOut(k: number): number {
            if ((k *= 2) < 1) {
                return 0.5 * k * k;
            }
            return - 0.5 * (--k * (k - 2) - 1);
        }
    },

    Cubic: {
        In(k: number): number {
            return k * k * k;
        },
        Out(k: number): number {
            return --k * k * k + 1;
        },
        InOut(k: number): number {
            if ((k *= 2) < 1) {
                return 0.5 * k * k * k;
            }
            return 0.5 * ((k -= 2) * k * k + 2);
        }
    },

    Quartic: {
        In(k: number): number {
            return k * k * k * k;
        },
        Out(k: number): number {
            return 1 - (--k * k * k * k);
        },
        InOut(k: number): number {
            if ((k *= 2) < 1) {
                return 0.5 * k * k * k * k;
            }
            return - 0.5 * ((k -= 2) * k * k * k - 2);
        }
    },

    Quintic: {
        In(k: number): number {
            return k * k * k * k * k;
        },
        Out(k: number): number {
            return --k * k * k * k * k + 1;
        },
        InOut(k: number): number {
            if ((k *= 2) < 1) {
                return 0.5 * k * k * k * k * k;
            }
            return 0.5 * ((k -= 2) * k * k * k * k + 2);
        }
    },

    Sinusoidal: {
        In(k: number): number {
            return 1 - Math.cos(k * Math.PI / 2);
        },
        Out(k: number): number {
            return Math.sin(k * Math.PI / 2);
        },
        InOut(k: number): number {
            return 0.5 * (1 - Math.cos(Math.PI * k));
        }
    },

    Exponential: {
        In(k: number): number {
            return k === 0 ? 0 : Math.pow(1024, k - 1);
        },
        Out(k: number): number {
            return k === 1 ? 1 : 1 - Math.pow(2, - 10 * k);
        },
        InOut(k: number): number {
            if (k === 0) {
                return 0;
            }

            if (k === 1) {
                return 1;
            }

            if ((k *= 2) < 1) {
                return 0.5 * Math.pow(1024, k - 1);
            }
            return 0.5 * (- Math.pow(2, - 10 * (k - 1)) + 2);
        }
    },

    Circular: {
        In(k: number): number {
            return 1 - Math.sqrt(1 - k * k);
        },
        Out(k: number): number {
            return Math.sqrt(1 - (--k * k));
        },
        InOut(k: number): number {
            if ((k *= 2) < 1) {
                return - 0.5 * (Math.sqrt(1 - k * k) - 1);
            }
            return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
        }
    },

    Elastic: {
        In(k: number): number {
            if (k === 0) {
                return 0;
            }

            if (k === 1) {
                return 1;
            }
            return -Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);
        },
        Out(k: number): number {
            if (k === 0) {
                return 0;
            }
            if (k === 1) {
                return 1;
            }
            return Math.pow(2, -10 * k) * Math.sin((k - 0.1) * 5 * Math.PI) + 1;
        },
        InOut(k: number): number {
            if (k === 0) {
                return 0;
            }
            if (k === 1) {
                return 1;
            }
            k *= 2;
            if (k < 1) {
                return -0.5 * Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);
            }
            return 0.5 * Math.pow(2, -10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI) + 1;
        }
    },

    Back: {
        In(k: number): number {
            var s = 1.70158;
            return k * k * ((s + 1) * k - s);
        },
        Out(k: number): number {
            var s = 1.70158;
            return --k * k * ((s + 1) * k + s) + 1;
        },
        InOut(k: number): number {
            var s = 1.70158 * 1.525;

            if ((k *= 2) < 1) {
                return 0.5 * (k * k * ((s + 1) * k - s));
            }
            return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
        }
    },

    Bounce: {
        In(k: number): number {
            return 1 - Easing.Bounce.Out(1 - k);
        },
        Out(k: number): number {
            if (k < (1 / 2.75)) {
                return 7.5625 * k * k;
            } else if (k < (2 / 2.75)) {
                return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
            } else if (k < (2.5 / 2.75)) {
                return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
            } else {
                return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
            }
        },
        InOut(k: number): number {
            if (k < 0.5) {
                return Easing.Bounce.In(k * 2) * 0.5;
            }
            return Easing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;
        }
    }
};

export const Interpolation = {

    Linear(v: number[], k: number) {
        var m = v.length - 1;
        var f = m * k;
        var i = Math.floor(f);
        var fn = Interpolation.Utils.Linear;

        if (k < 0) {
            return fn(v[0], v[1], f);
        }
        if (k > 1) {
            return fn(v[m], v[m - 1], m - f);
        }
        return fn(v[i], v[i + 1 > m ? m : i + 1], f - i);
    },

    Bezier(v: number[], k: number) {
        var b = 0;
        var n = v.length - 1;
        var pw = Math.pow;
        var bn = Interpolation.Utils.Bernstein;

        for (var i = 0; i <= n; i++) {
            b += pw(1 - k, n - i) * pw(k, i) * v[i] * bn(n, i);
        }
        return b;
    },

    CatmullRom(v: number[], k: number) {
        var m = v.length - 1;
        var f = m * k;
        var i = Math.floor(f);
        var fn = Interpolation.Utils.CatmullRom;

        if (v[0] === v[m]) {

            if (k < 0) {
                i = Math.floor(f = m * (1 + k));
            }
            return fn(v[(i - 1 + m) % m], v[i], v[(i + 1) % m], v[(i + 2) % m], f - i);
        } else {
            if (k < 0) {
                return v[0] - (fn(v[0], v[0], v[1], v[1], -f) - v[0]);
            }
            if (k > 1) {
                return v[m] - (fn(v[m], v[m], v[m - 1], v[m - 1], f - m) - v[m]);
            }
            return fn(v[i ? i - 1 : 0], v[i], v[m < i + 1 ? m : i + 1], v[m < i + 2 ? m : i + 2], f - i);
        }
    },

    Utils: {

        Linear(p0: number, p1: number, t: number) {
            return (p1 - p0) * t + p0;
        },

        Bernstein(n: number, i: number) {

            var fc = Interpolation.Utils.Factorial;
            return fc(n) / fc(i) / fc(n - i);
        },

        Factorial: (function () {
            var a = [1];
            return function (n: number) {
                var s = 1;
                if (a[n]) {
                    return a[n];
                }
                for (var i = n; i > 1; i--) {
                    s *= i;
                }
                a[n] = s;
                return s;
            };
        })(),

        CatmullRom(p0: number, p1: number, p2: number, p3: number, t: number) {
            var v0 = (p2 - p0) * 0.5;
            var v1 = (p3 - p1) * 0.5;
            var t2 = t * t;
            var t3 = t * t2;
            return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (- 3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;
        }
    }

};

export class Group {

    _tweens: { [id: string]: ITween } = {};
    _tweensAddedDuringUpdate: { [id: string]: ITween } = {};

    getAll() {
        return Object.keys(this._tweens).map(function (tweenId: string) {
            return this._tweens[tweenId];
        }.bind(this));
    }

    removeAll() {
        this._tweens = {};
    }

    add(tween: ITween) {
        this._tweens[tween.getId()] = tween;
        this._tweensAddedDuringUpdate[tween.getId()] = tween;
    }

    remove(tween: ITween) {
        delete this._tweens[tween.getId()];
        delete this._tweensAddedDuringUpdate[tween.getId()];
    }

    update(time: number, preserve: boolean = false) {

        var tweenIds = Object.keys(this._tweens);

        if (tweenIds.length === 0) {
            return false;
        }

        time = time !== undefined ? time : now();

        // Tweens are updated in "batches". If you add a new tween during an update, then the
        // new tween will be updated in the next batch.
        // If you remove a tween during an update, it may or may not be updated. However,
        // if the removed tween was added during the current batch, then it will not be updated.
        while (tweenIds.length > 0) {
            this._tweensAddedDuringUpdate = {};

            for (var i = 0; i < tweenIds.length; i++) {

                var tween = this._tweens[tweenIds[i]];

                if (tween && tween.update(time) === false) {

                    if (!preserve) {
                        delete this._tweens[tweenIds[i]];
                    }
                }
            }

            tweenIds = Object.keys(this._tweensAddedDuringUpdate);
        }

        return true;
    }
};

type Callback = (object: any) => void;

export interface ITween {
    start(time: number): void;
    stop(): void;
    getId(): string;
    update(time: number): boolean;
}
    
type FilteredKeys<T, U> = { [P in keyof T]: T[P] extends U ? P : never }[keyof T];
type TweenPropertyList<T> =  {
    [K in FilteredKeys<T, number>]?: number|number[];
};

export class Tween<T> implements ITween {

    private static _nextId = 0;
    static nextId() {
        return "" + (Tween._nextId++);
    }

    private _object: T;
    private _valuesStart: TweenPropertyList<T> = {};
    private _valuesEnd: TweenPropertyList<T> = {};
    private _valuesStartRepeat: TweenPropertyList<T> = {};
    private _duration = 1000;
    private _repeat = 0;
    private _repeatDelayTime: number;
    private _yoyo = false;
    private _isPlaying = false;
    private _reversed = false;
    private _delayTime = 0;
    private _startTime: number = null;
    private _easingFunction = Easing.Linear;
    private _interpolationFunction = Interpolation.Linear;
    private _chainedTweens: ITween[] = [];
    private _onStartCallback: Callback = null;
    private _onStartCallbackFired = false;
    private _onUpdateCallback: Callback = null;
    private _onCompleteCallback: Callback = null;
    private _onStopCallback: Callback = null;
    private _group: Group;
    private _id: string;

    constructor(object: T, group?: Group) {
        this._object = object;
        this._group = group || defaultGroup;
        this._id = Tween.nextId();
    };

    getId() {
        return this._id;
    }

    isPlaying() {
        return this._isPlaying;
    }

    to(properties: TweenPropertyList<T>, duration: number) {

        this._valuesEnd = properties;

        if (duration !== undefined) {
            this._duration = duration;
        }

        return this;
    }

    start(time?: number | string) {
        this._group.add(this);
        this._isPlaying = true;
        this._onStartCallbackFired = false;
        this._startTime = time !== undefined ? typeof time === 'string' ? now() + parseFloat(time) : time : now();
        this._startTime += this._delayTime;

        let _valuesEnd = this._valuesEnd as any;
        let _valuesStart = this._valuesStart as any;
        let _valuesStartRepeat = this._valuesStartRepeat as any;
        let _object = this._object as any;

        for (let property in _valuesEnd) {
            let end = _valuesEnd[property];
            // Check if an Array was provided as property value
            if (end instanceof Array) {
                if (end.length === 0) {
                    continue;
                }
                // Create a local copy of the Array with the start value at the front
                _valuesEnd[property] = [_object[property]].concat(_valuesEnd[property]);
            }

            // If `to()` specifies a property that doesn't exist in the source object,
            // we should not set that property in the object
            if (_object[property] === undefined) {
                continue;
            }

            // Save the starting value.
            _valuesStart[property] = _object[property];
            _valuesStartRepeat[property] = _valuesStart[property];
        }
        return this;
    }

    stop() {
        if (!this._isPlaying) {
            return this;
        }
        this._group.remove(this);
        this._isPlaying = false;
        if (this._onStopCallback !== null) {
            this._onStopCallback(this._object);
        }
        this.stopChainedTweens();
        return this;
    }

    end() {
        this.update(this._startTime + this._duration);
        return this;
    }

    stopChainedTweens() {
        for (var i = 0, numChainedTweens = this._chainedTweens.length; i < numChainedTweens; i++) {
            this._chainedTweens[i].stop();
        }
    }

    group(group: Group) {
        this._group = group;
        return this;
    }

    delay(amount: number) {
        this._delayTime = amount;
        return this;
    }

    repeat(times: number) {
        this._repeat = times;
        return this;
    }

    repeatDelay(amount: number) {
        this._repeatDelayTime = amount;
        return this;
    }

    yoyo(yy: boolean) {
        this._yoyo = yy;
        return this;
    }

    easing(eas: (k: number) => number) {
        this._easingFunction = eas;
        return this;
    }

    interpolation(inter: (v: number[], k: number) => number) {
        this._interpolationFunction = inter;
        return this;
    }

    chain(...tweens: ITween[]) {
        this._chainedTweens = tweens;
        return this;
    }

    onStart(callback: Callback) {
        this._onStartCallback = callback;
        return this;
    }

    onUpdate(callback: Callback) {
        this._onUpdateCallback = callback;
        return this;
    }

    onComplete(callback: Callback) {
        this._onCompleteCallback = callback;
        return this;
    }

    onStop(callback: Callback) {
        this._onStopCallback = callback;
        return this;
    }

    update(time: number) {
        var property;
        var elapsed;
        var value;

        if (time < this._startTime) {
            return true;
        }

        if (this._onStartCallbackFired === false) {
            if (this._onStartCallback !== null) {
                this._onStartCallback(this._object);
            }
            this._onStartCallbackFired = true;
        }

        elapsed = (time - this._startTime) / this._duration;
        elapsed = (this._duration === 0 || elapsed > 1) ? 1 : elapsed;

        value = this._easingFunction(elapsed);

        for (property in this._valuesEnd) {

            // Don't update properties that do not exist in the source object
            if ((this._valuesStart as any)[property] === undefined) {
                continue;
            }

            var start = (this._valuesStart as any)[property];
            var end = (this._valuesEnd as any)[property];

            if (end instanceof Array) {
                (this._object as any)[property] = this._interpolationFunction(end, value);
            } else {
                // Parses relative end values with start as base (e.g.: +10, -3)
                if (typeof (end) === 'string') {
                    if (end.charAt(0) === '+' || end.charAt(0) === '-') {
                        end = start + parseFloat(end);
                    } else {
                        end = parseFloat(end);
                    }
                }

                // Protect against non numeric properties.
                if (typeof (end) === 'number') {
                    (this._object as any)[property] = start + (end - start) * value;
                }
            }
        }

        if (this._onUpdateCallback !== null) {
            this._onUpdateCallback(this._object);
        }

        if (elapsed === 1) {
            if (this._repeat > 0) {
                if (isFinite(this._repeat)) {
                    this._repeat--;
                }

                let _valuesStart = this._valuesStart as any;
                let _valuesStartRepeat = this._valuesStartRepeat as any;
                let _valuesEnd = this._valuesEnd as any;

                // Reassign starting values, restart by making startTime = now
                for (property in this._valuesStartRepeat) {
                    if (typeof (_valuesEnd[property]) === 'string') {
                        _valuesStartRepeat[property] = _valuesStartRepeat[property] + parseFloat(_valuesEnd[property]);
                    }
                    if (this._yoyo) {
                        var tmp = _valuesStartRepeat[property];

                        _valuesStartRepeat[property] = _valuesEnd[property];
                        _valuesEnd[property] = tmp;
                    }
                    _valuesStart[property] = _valuesStartRepeat[property];
                }

                if (this._yoyo) {
                    this._reversed = !this._reversed;
                }
                if (this._repeatDelayTime !== undefined) {
                    this._startTime = time + this._repeatDelayTime;
                } else {
                    this._startTime = time + this._delayTime;
                }
                return true;

            } else {
                if (this._onCompleteCallback !== null) {
                    this._onCompleteCallback(this._object);
                }
                for (var i = 0, numChainedTweens = this._chainedTweens.length; i < numChainedTweens; i++) {
                    // Make the chained tweens start exactly at the time they should,
                    // even if the `update()` method was called way past the duration of the tween
                    this._chainedTweens[i].start(this._startTime + this._duration);
                }
                this._isPlaying = false;
                return false;
            }
        }
        return true;
    }
};

const defaultGroup = new Group();
function autoUpdate(time: number) {
    defaultGroup.update(time);
    requestAnimationFrame(autoUpdate);
}
requestAnimationFrame(autoUpdate);


let now: () => number;

// Include a performance.now polyfill.

// In node.js, use process.hrtime.
if (typeof (window) === 'undefined' && typeof (process) !== 'undefined' && process.hrtime) {
    now = function () {
        var time = process.hrtime();

        // Convert [seconds, nanoseconds] to milliseconds.
        return time[0] * 1000 + time[1] / 1000000;
    };
}
// In a browser, use window.performance.now if it is available.
else if (typeof(window) !== 'undefined' &&
    window.performance !== undefined &&
    window.performance.now !== undefined) {
    // This must be bound, because directly assigning this function
    // leads to an invocation exception in Chrome.
    now = window.performance.now.bind(window.performance);
}
// Use Date.now if it is available.
else if (Date.now !== undefined) {
    now = Date.now;
}
// Otherwise, use 'new Date().getTime()'.
else {
    now = function () {
        return new Date().getTime();
    };
}
