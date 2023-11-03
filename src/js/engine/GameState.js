import { Cookie } from "./Cookie.js";

export function GameState() {
	this.map = {}; // current rooms
	this.params = {};
	this.actions = {};
	this.cookie = null;
	this.home = null;
}
GameState.prototype = {
	getHome: function () { return this.home; },
	setHome: function (room) { this.home = room; },
	getCurrentRoom: function () {
		console.info("getCurrentRoom", this.current);
		return this.current;
		// return this.map[this.params[""]];
	},
	saveCookie: function () {
		//when you call this function, set the cookie in the browser
		if (this.cookie) {
			this.cookie.write(this.params);
		}
	},
	setCurrentRoom: function (newRoom) {
		console.info("setCurrentRoom", newRoom);
		if (newRoom.varname) {
			this.params[""] = newRoom.varname;
			this.current = newRoom;
			this.saveCookie();
		}
	},
	add: function (param_name, fun) {
		this.actions[param_name] = fun;
	},
	set: function (param_name, fun) {
		this.params[param_name] = fun;
	},
	get: function (param_name, fun) {
		return this.params[param_name];
	},
	applied: function (param_name) {
		return this.actions[param_name];
	},
	apply: function (param_name, replay) {
		console.log("apply " + param_name);
		this.params[param_name] = 1;
		if (param_name in this.actions) {
			this.actions[param_name](typeof replay === "undefined" ? false : replay);
		}
	},
	startCookie: function (name) {
		this.cookie = new Cookie(name);
		return this.cookie.check();
	},
	stopCookie: function (name) {
		this.cookie = null;
	},
	setCookieDuration: function (minutes) {
		//this function create a new cookie
		this.cookie.minutes = minutes;
	},
	loadCookie: function () {
		//this function reads from a cookie if one exists
		const params = this.cookie.read();
		if (params) {
			for (const k in params) {
				if (params.hasOwnProperty(k)) {
					if (k in this.actions) {
						this.apply(k, params[k]);
					} else {
						this.set(k, params[k]);
					}
				}
			}
			this.saveCookie();
			return true;
		}
		return false;
	},
};
