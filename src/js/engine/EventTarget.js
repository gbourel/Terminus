import { dom, addBtn, prEl, addEl, span, injectProperties, union, almostEqual, addAttrs, objToStr, clone, d, anyStr, aStrArray, rmIdxOf, isStr, isObj, def, ndef, pushDef, cntUp, hdef, randomSort, shuffleStr, randomStr, Seq } from "./js.js";

//Copyright (c) 2010 Nicholas C. Zakas. All rights reserved.
//MIT License
//taken from http://www.nczonline.net/blog/2010/03/09/custom-events-in-javascript/

export function EventTarget() {
	this._listeners = {};
}
EventTarget.prototype = {
	//    constructor: EventTarget,

	addListener: function (type, listener) {
		hdef(this._listeners, type, listener);
		return this;
	},

	fire: function (event) {
		if (typeof event == "string") {
			event = { type: event };
		}
		if (!event.target) {
			event.target = this;
		}

		if (!event.type) {
			//falsy
			throw new Error("Event object missing 'type' property.");
		}

		if (this._listeners[event.type] instanceof Array) {
			const listeners = this._listeners[event.type];
			for (let i = 0, len = listeners.length; i < len; i++) {
				listeners[i].call(this, event);
			}
		}
		return this;
	},

	removeListener: function (type, listener) {
		if (this._listeners[type] instanceof Array) {
			const listeners = this._listeners[type];
			for (let i = 0, len = listeners.length; i < len; i++) {
				if (listeners[i] === listener) {
					listeners.splice(i, 1);
					break;
				}
			}
		}
		return this;
	},
};
