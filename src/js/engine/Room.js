import { dom, addBtn, prEl, addEl, span, injectProperties, union, almostEqual, addAttrs, objToStr, clone, d, anyStr, aStrArray, rmIdxOf, isStr, isObj, def, ndef, pushDef, cntUp, hdef, randomSort, shuffleStr, randomStr, Seq } from "./js.js";
import { File, Item, People } from "./Item.js";
import { _, POPREFIX_CMD, POPREFIX_ROOM, POPREFIX_ITEM, POPREFIX_PEOPLE, POSUFFIX_DESC, POSUFFIX_EXEC_DESC, PO_NONE, PO_NONE_DESC, PO_DEFAULT_ROOM, PO_DEFAULT_ITEM, PO_DEFAULT_PEOPLE, PO_DEFAULT_ROOM_DESC, PO_DEFAULT_ITEM_DESC, PO_DEFAULT_PEOPLE_DESC } from './Gettext.js';

const global_spec = {};

function Room(roomname, introtext, picname, prop) {
	prop = prop || {};
	prop.executable = d(prop.executable, true);
	File.call(this, d(roomname, _(PO_DEFAULT_ROOM, [])), picname, prop);
	this.parents = [];
	this.previous = this;
	this.children = [];
	this.items = [];
	this.isRoot = true;
	//  this.fire = null;
	this.intro_text = d(introtext, _(PO_DEFAULT_ROOM_DESC));
	this.starter_msg = null;
	this.enter_callback = null;
	this.leave_callback = null;
	this.suggestions = [];
	//for event handling
	//  this.ev = new EventTarget();
}
export function newRoom(map, id, picture, prop) {
	//this function automatically set the variable $id to ease game saving
	const poid = POPREFIX_ROOM + id;
	const n = new Room(
		_(poid, [], { or: PO_DEFAULT_ROOM }),
		_(poid + POSUFFIX_DESC, [], { or: PO_DEFAULT_ROOM_DESC }),
		picture,
		prop,
	);
	n.varname = id; //currently undefined for user created rooms, see mkdir
	n.poid = poid;
	n.picture.setImgClass("room-" + n.varname);
	map[n.varname] = n;
	return n;
}
export function enterRoom(new_room, vt, state) {
	const prev = vt.getContext();
	if (prev || !new_room.hasParent(prev)) {
		// console.log(prev.toString(),'doLeaveCallbackTo',new_room.toString());
		prev.doLeaveCallbackTo(new_room);
	}
	vt.setContext(new_room);
	vt.state.setCurrentRoom(new_room);
	if (typeof new_room.enter_callback == "function") {
		new_room.enter_callback(new_room, vt);
	}
	return [new_room.toString(), new_room.intro_text];
}
Room.prototype = union(File.prototype, {
	fire_event: function (vt, cmd, args, idx, ct) {
		ct = d(ct, {});
		let ev_trigger = null;
		// console.log('EVENT '+cmd);
		const context = {
			term: vt,
			room: this,
			arg: def(idx) ? args[idx] : null,
			args: args,
			i: idx,
			ct: ct,
		};
		if (ct.hasOwnProperty("unreachable_room")) {
			if (
				ct.unreachable_room.name in global_spec &&
				cmd in global_spec[ct.unreachable_room.name]
			) {
				ev_trigger = global_spec[ct.unreachable_room.name][cmd];
			}
		} else if (cmd in this.cmd_event) {
			ev_trigger = this.cmd_event[cmd];
		}
		if (ev_trigger) {
			const ck =
				typeof ev_trigger === "function" ? ev_trigger(context) : ev_trigger;
			if (ck) {
				// console.log('FIRE '+ck);
				//        this.ev.fire(this.uid+ck);
				this.fire(this.uid + ck);
			}
		}
	},
	// text displayed at each change
	setIntroText: function (txt) {
		this.intro_text = txt;
		return this;
	},
	addCommand: function (cmd) {
		this.suggestions.push(cmd);
		return this;
	},
	removeCommand: function (cmd) {
		rmIdxOf(this.suggestions, cmd);
	},
	checkTextIdx: function (textidx) {
		return dialog.hasOwnProperty(this.poid + POSUFFIX_DESC + textidx);
	},
	setTextIdx: function (textidx, vars) {
		this.intro_text = _(this.poid + POSUFFIX_DESC + textidx, vars, {
			or: this.poid + POSUFFIX_DESC,
		});
		return this;
	},
	// callback when entering in the room
	setEnterCallback: function (fu) {
		this.enter_callback = fu;
		return this;
	},
	setLeaveCallback: function (fu) {
		this.leave_callback = fu;
		return this;
	},
	// a message displayed on game start
	getStarterMsg: function (prefix) {
		prefix = prefix || "";
		if (this.starter_msg) {
			return prefix + this.starter_msg;
		} else {
			return (
				prefix +
				_(POPREFIX_CMD + "pwd", [this.name])
					.concat("\n")
					.concat(this.intro_text)
			);
		}
	},
	setStarterMsg: function (txt) {
		this.starter_msg = txt;
		return this;
	},
	// Room picture
	// item & people management
	addItem: function (newitem) {
		pushDef(newitem, this.items);
		newitem.room = this;
		return this;
	},
	newItem: function (id, picname, prop) {
		prop = d(prop, {});
		prop.poid = d(prop.poid, id);
		const ret = new Item("", "", picname, prop);
		this.addItem(ret);
		return ret;
	},
	newPeople: function (id, picname, prop) {
		prop = d(prop, {});
		prop.poid = d(prop.poid, id);
		const ret = new People("", "", picname, prop);
		this.addItem(ret);
		return ret;
	},
	newItemBatch: function (id, names, picname, prop) {
		const ret = [];
		prop = d(prop, {});
		for (let i = 0; i < names.length; i++) {
			prop.poid = id;
			prop.povars = [names[i]];
			ret[i] = new Item("", "", picname, prop);
			this.addItem(ret[i]);
		}
		return ret;
	},
	removeItemByIdx: function (idx) {
		return idx == -1 ? null : this.items.splice(idx, 1)[0];
	},
	removeItemByName: function (name) {
		const idx = this.idxItemFromName(name);
		return this.removeItemByIdx(idx);
	},
	hasItem: function (name, args) {
		args = args || [];
		const idx = this.idxItemFromName(_(POPREFIX_ITEM + name, args));
		return idx > -1;
	},
	removeItem: function (name, args) {
		args = args || [];
		const idx = this.idxItemFromName(_(POPREFIX_ITEM + name, args));
		return this.removeItemByIdx(idx);
	},
	hasPeople: function (name, args) {
		args = args || [];
		const idx = this.idxItemFromName(_(POPREFIX_PEOPLE + name, args));
		return idx > -1;
	},
	removePeople: function (name, args) {
		args = args || [];
		const idx = this.idxItemFromName(_(POPREFIX_PEOPLE + name, args));
		return this.removeItemByIdx(idx);
	},
	idxItemFromName: function (name) {
		return this.items.map(objToStr).indexOf(name);
	},
	idxChildFromName: function (name) {
		return this.children.map(objToStr).indexOf(name);
	},
	getItemFromName: function (name) {
		//    console.log(name);
		const idx = this.idxItemFromName(name);
		return idx == -1 ? null : this.items[idx];
	},
	getItem: function (name) {
		return this.getItemFromName(_("item_" + name));
	},

	// linked room management
	getChildFromName: function (name) {
		const idx = this.children.map(objToStr).indexOf(name);
		return idx == -1 ? null : this.children[idx];
	},
	hasChild: function (child) {
		const idx = this.children.map(objToStr).indexOf(child.name);
		return idx == -1 ? null : this.children[idx];
	},
	addPath: function (newchild, wayback) {
		if (def(newchild) && !this.hasChild(newchild)) {
			this.children.push(newchild);
			if (d(wayback, true)) {
				newchild.parents.push(this);
				newchild.isRoot = false;
			}
		}
		return this;
	},
	doLeaveCallbackTo: function (to) {
		//    console.log(t+' leave callback ?');
		if (this.uid === to.uid) {
		} else if (this.parents.length) {
			const p = this.parents[0];
			if (typeof this.leave_callback == "function") {
				this.leave_callback();
			}
			if (p) {
				p.doLeaveCallbackTo(to);
			}
		}
	},
	hasParent: function (par, symbolic) {
		symbolic = d(symbolic, false);
		let ret = false,
			p = this.parents;
		for (let i = 0; i < (symbolic ? p.length : p.length ? 1 : 0); i++) {
			ret = p[i].uid == par.uid || ret || p[i].hasParent(par);
		}
		return ret;
	},
	removeParentPath: function (par) {
		rmIdxOf(this.parents, par);
	},
	removePath: function (child) {
		if (rmIdxOf(this.children, child)) {
			rmIdxOf(child.parents, this);
		}
	},
	setOutsideEvt: function (name, fun) {
		global_spec[this.name][name] = fun;
		return this;
	},
	unsetOutsideEvt: function (name) {
		delete global_spec[this.name][name];
		return this;
	},

	/*Checks if arg can be reached from this room
	 * Returns the room if it can
	 * Returns false if it cannot
	 *
	 * 'arg' is a single node, not a path
	 * i.e. $home.can_cd("next_room") returns true
	 *      $home.can_cd("next_room/another_room") is invalid
	 */
	can_cd: function (arg) {
		//Don't allow for undefined or multiple paths
		if (arg === "~") {
			return $home;
		} else if (arg === "..") {
			return this.parents[0];
		} else if (arg === ".") {
			return this;
		} else if (arg && arg.indexOf("/") == -1) {
			const c = this.children;
			for (let i = 0; i < c.length; i++) {
				if (arg === c[i].toString()) {
					return c[i];
				}
			}
		}
		return null;
	},

	/* Returns the room and the item corresponding to the path
	 * if item is null, then the path describe a room and  room is the full path
	 * else room is the room containing the item */
	traversee: function (path) {
		let item,
			pa = this.pathToRoom(path),
			ret = {};
		if (!path) { return {}; }
		ret.room = pa[0];
		ret.item_name = pa[1];
		ret.item_idx = -1;
		if (ret.room) {
			ret.room_name = ret.room.name;
			if (ret.item_name) {
				for (let i = 0; i < ret.room.items.length; i++) {
					if (ret.item_name === ret.room.items[i].toString()) {
						ret.item = ret.room.items[i];
						ret.item_idx = i;
						break;
					}
				}
			}
		}
		// console.log(ret);
		return ret;
	},
	pathToRoom: function (path) {
		if (!path) {
			return null;
		}
		const pat = path.split("/");
		let room = this;
		let lastcomponent = null;
		let cancd = true;
		let pathstr = "";
		let idx = 0;
		for (idx = 0; idx < pat.length - 1; idx++) {
			if (room && room.executable) {
				room = room.can_cd(pat[idx]);
				if (room) {
					pathstr += (idx > 0 ? "/" : "") + pat[idx];
				}
			} else {
				break;
			}
		}
		if (room) {
			lastcomponent = pat[pat.length - 1];
			cancd = room.can_cd(lastcomponent);
			if (cancd) {
				room = cancd;
				pathstr += (idx > 0 ? "/" : "") + lastcomponent + "/";
				lastcomponent = null;
			}
		}
		return [room, lastcomponent, pathstr];
	},
});
