import { dom, addBtn, prEl, addEl, span, injectProperties, union, almostEqual, addAttrs, objToStr, clone, d, anyStr, aStrArray, rmIdxOf, isStr, isObj, def, ndef, pushDef, cntUp, hdef, randomSort, shuffleStr, randomStr, Seq } from "./js.js";
import { dialog } from "../../.build/terminus.dialog.fr.js";

export var pogencnt = 0;
if (!dialog) {
	console.log(
		"Before this script, you have to load the script defining the dialog table.",
	);
}
export const POPREFIX_CMD = "cmd_";
export const POPREFIX_ROOM = "room_";
export const POPREFIX_ITEM = "item_";
export const POPREFIX_PEOPLE = "people_";
export const POSUFFIX_DESC = "_text";
export const POSUFFIX_EXEC_DESC = "_exec";
export const PO_NONE = "none";
export const PO_NONE_DESC = PO_NONE + POSUFFIX_DESC;
export const PO_DEFAULT_ROOM = POPREFIX_ROOM + PO_NONE;
export const PO_DEFAULT_ITEM = POPREFIX_ITEM + PO_NONE;
export const PO_DEFAULT_PEOPLE = POPREFIX_PEOPLE + PO_NONE;
export const PO_DEFAULT_ROOM_DESC = POPREFIX_ROOM + PO_NONE_DESC;
export const PO_DEFAULT_ITEM_DESC = POPREFIX_ITEM + PO_NONE_DESC;
export const PO_DEFAULT_PEOPLE_DESC = POPREFIX_PEOPLE + PO_NONE_DESC;

String.prototype.printf = function (vars) {
	let i = -1;
	return this.replace(/\%[sd]/g, function (a, b) {
		i++;
		return vars[i];
	});
};
function objToMsg(o) {
	return o.toMsg();
}

var type_decorations = {
	people: '<span class="color-people">%s</span>',
	item: '<span class="color-item">%s</span>',
	room: '<span class="color-room">%s</span>',
	cmd: '<span class="color-cmd">%s</span>',
};
function guess_gettext_mod(txt) {
	let typ = txt.split("_")[0];
	return {
		decorate: type_decorations[typ],
	};
}

let poe = typeof pogen == "function";
let var_regexp = /\{\{\w+(\.\w+|,\[([^,]*(,)?)\])?\}\}/g;
let var_vars_regexp = /\[([^,]*(,)?)\]/g;
let var_vars_regexpbis = /\.(\w+)/;
function var_resolve(a) {
	a = a.substring(2, a.length - 2);
	let vars = [];
	if (var_vars_regexp.test(a)) {
		vars = JSON.parse(a.match(var_vars_regexp));
		a = a.split(",")[0];
	} else if (var_vars_regexpbis.test(a)) {
		let b = a.split(".");
		//  console.log(b);
		a = b[0];
		vars = [b[1]];
	}
	//  console.log(a,vars);
	return _(a, vars, guess_gettext_mod(a));
}
export function _(str, vars, args) {
	if (!def(str)) return "";
	if (typeof vars !== "object" || vars.length === 0) {
		vars = ["", "", "", ""];
	}
	args = d(args, {});
	let ret;
	if (str in dialog) {
		ret = dialog[str];
	} else {
		if (poe) {
			pogen(str);
		}
		if (args.or && args.or in dialog) {
			str = ret;
			ret = dialog[args.or];
		} else {
			ret = str;
			if (vars.length > 0) ret += " " + vars.join(" ");
			return ret;
		}
	}
	while (var_regexp.test(ret)) {
		ret = ret.replace(var_regexp, var_resolve);
	}
	ret = ret.printf(vars);
	//  if (poe){
	//     return ret + "#" + str +"#" ;
	//  }
	if (args.decorate) {
		//    console.log('decorate',args.decorate);
		ret = args.decorate.printf([ret]);
	}
	return ret;
}
