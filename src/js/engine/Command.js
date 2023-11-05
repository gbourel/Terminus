import { user } from "./User.js";

export const ARGT = {
	dir: [0],
	file: [1],
	opt: [2],
	instr: [3],
	var: [4],
	strictfile: [5],
	cmdname: [6],
	filename: [7],
	filenew: [8],
	dirnew: [9],
	pattern: [10],
	msgid: [12],
};

const global_commands_fu = {};

function Command(group, syntax, fu) {
	this.fu = fu;
	this.syntax = syntax; //example : cmd dir [-d|-e] (undo|redo) -> [ARGT.dir(),ARGT.opt.concat(['-d','e']),ARGT.instr.concat['undo','redo']],
	this.group = group;
}
export function _getCommandFunc(name) {
	return global_commands_fu[name].fu;
}
export function _getCommandSyntax(name) {
	let cmd = global_commands_fu[name];
	return cmd?.syntax;
}
export function _hasRightForCommand(cmd, r) {
	return global_commands_fu[cmd]
		? user.groups.indexOf(global_commands_fu[cmd].group) > -1
		: false;
}
export function _getUserCommands() {
	return Object.keys(global_commands_fu).filter(_hasRightForCommand);
}
export function _argType(syntax, argnum, argtyp) {
	if (!syntax[argnum]) { return null; }
	return argtyp[0] === syntax[argnum][0];
}
export function _setupCommand(cmd, group, syntax, fu) {
	global_commands_fu[cmd] = new Command(group || cmd, syntax, fu);
}
export function _lnCommand(cmd, cmdb, group) {
	const c = global_commands_fu[cmdb];
	_setupCommand(cmd, group || cmd, c.syntax, c.fu);
}

export const global_fireables = { done: [] };
function global_fire(categ) {
	let fun;
	if (global_fireables[categ]) {
		while ((fun = global_fireables[categ].shift())) {
			fun();
		}
	}
}
export function global_fire_done() {
	global_fire("done");
}

export function cmd_done(vt, fireables, ret, cmd, args) {
	// fire events *_done when ret is shown
	const cb = function () {
		for (let i = 0; i < fireables.length; i++) {
			fireables[i][0].fire_event(vt, cmd + "_done", args, fireables[i][1]);
			global_fire_done();
		}
	};
	return [ret, cb];
}
