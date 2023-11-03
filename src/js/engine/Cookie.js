import { dom, addBtn, prEl, addEl, span, injectProperties, union, almostEqual, addAttrs, objToStr, clone, d, anyStr, aStrArray, rmIdxOf, isStr, isObj, def, ndef, pushDef, cntUp, hdef, randomSort, shuffleStr, randomStr, Seq } from "./js.js";
import { debug } from "../terminus.utils.js";

export function Cookie(name, minutes) {
	debug("Cookie", name, minutes);
	this.name = name;
	this.minutes = minutes;
}
// Cookies can only contains text or numbers.
// If you need to stored an object, it shall be referenced elsewhere.
Cookie.prototype = {
	// Cookies contain "cookiename=key:value=key:value=key:value..."
	// In document.cookie, cookies are seperated by a ";"
	parse: function (content) {
		debug("parse");
		var ret = null; // return null or a dict
		var ca = content.split(";");
		for (var j = 0; j < ca.length; j++) {
			var c = ca[j];
			while (c.charAt(0) == " ") c = c.substring(1, c.length);
			if (c.indexOf(this.name) === 0) {
				ret = {};
				var params = c.split("=");
				params.shift();
				for (var i = 0; i < params.length; i++) {
					var kv = params[i].split(":");
					if (kv.length == 2) {
						if (kv[1] !== "undefined") {
							ret[kv[0]] = kv[1];
						}
					}
				}
				break;
			}
		}
		return ret;
	},
	check: function () {
		debug("check");
		var ca = dom.cookie.split(";");
		for (var j = 0; j < ca.length; j++) {
			var c = ca[j];
			while (c.charAt(0) == " ") c = c.substring(1, c.length);
			if (c.indexOf(this.name) === 0) {
				return true;
			}
		}
		return false;
	},
	stringify: function (params) {
		debug("stringify", params);
		var content = "";
		for (var key in params) {
			if (params.hasOwnProperty(key)) {
				content += key + ":" + params[key] + "=";
			}
		}
		return content;
	},
	read: function () {
		debug("read");
		return this.parse(dom.cookie);
	},
	write: function (params) {
		debug("write", params);
		var date = new Date();
		date.setTime(date.getTime() + this.minutes * 60 * 1000);
		console.log("write cookie", params);
		dom.cookie =
			this.name +
			"=" +
			this.stringify(params) +
			"; expires=" +
			date.toGMTString() +
			"; path=/";
	},
	destroy: function () {
		debug("destroy");
		this.minutes = -1;
		this.write("");
	},
};
