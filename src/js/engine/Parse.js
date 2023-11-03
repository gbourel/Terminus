import {
	ARGT,
	_hasRightForCommand,
	_lnCommand,
	_setupCommand,
	_getUserCommands,
	_getCommandFunc,
	_getCommandSyntax,
	_argType,
	cmd_done,
} from "./Command.js";

const regexp_str = /^['"].*['"]$/;
const regexp_star = /.*\*.*/;

function _expandArgs(args, r) {
	let newargs = [],
		room,
		lastcomponent,
		path,
		re;
	//  console.log('_expandArgs',args,r);
	for (let i = 0; i < args.length; i++) {
		//    console.log(args[i]);
		if (regexp_str.test(args[i])) {
			newargs.push(args[i].slice(1, args[i].length - 1));
		} else if (regexp_star.test(args[i])) {
			roomp = r.pathToRoom(args[i]);

			room = roomp[0];
			lastcomponent = roomp[1];
			re = new RegExp(lastcomponent.replace(/\./g, "\\.").replace(/\*/g, ".*"));
			if (room && lastcomponent) {
				//        console.log(lastcomponent);
				path = roomp[2];
				let expanded = [];
				for (let j = 0; j < room.items.length; j++) {
					if (re.test(room.items[j].toString())) {
						expanded.push(
							path + (path.length ? "/" : "") + room.items[j].toString(),
						);
					}
				}
				newargs = newargs.concat(expanded.sort());
			} else {
				newargs.push(args[i]);
			}
		} else {
			newargs.push(args[i]);
		}
	}
	return newargs;
}
function _validArgs(cmd, args, r) {
	if (cmd == "ls") {
		return true;
	} else {
		if (args.length == 1) {
			if (["man", "cd", "mkdir", "less", "touch", "unzip"].indexOf(cmd) > -1) {
				return true;
			}
		}
		return false;
	}
}
export function commonprefix(array) {
	//https://stackoverflow.com/questions/1916218/find-the-longest-common-starting-substring-in-a-set-of-strings/1917041#1917041
	let A = array.concat().sort(),
		a1 = A[0],
		a2 = A[A.length - 1],
		L = a1.length,
		i = 0;
	while (i < L && a1.charAt(i) === a2.charAt(i)) i++;
	return a1.substring(0, i);
}
export function _completeArgs(args, argidx, tocomplete, r, compl) {
	// return completion matches
	let search_room = tocomplete.substring(0, 1) == "~" ? $home : r;
	tocomplete = tocomplete.replace(/\*/g, ".*");
	//Iterate through each room
	let new_room,
		substring_matches = [],
		cmd = args[0];
	let syntax = [ARGT.cmdname].concat(_getCommandSyntax(cmd));

	if (_argType(syntax, argidx, ARGT.cmdname)) {
		let cmds = _getUserCommands();
		//    tocomplete=args.shift();
		idx = 0;
		for (let i = 0; i < cmds.length; i++) {
			if (compl(cmds[i])) {
				substring_matches.push(cmds[i] + (cmds[i] == tocomplete ? " " : "")); //space is here to say : if only one found, then go to next arg
			}
		}
		return substring_matches;
	}
	if (_argType(syntax, argidx, ARGT.msgid)) {
		//    if (cmd=='poe') {
		return Object.keys(dialog)
			.filter(function (i) {
				return i.match("^" + tocomplete);
			})
			.slice(0, 20);
	}
	let path_rooms = tocomplete.split("/");
	if (
		_argType(syntax, argidx, ARGT.dir) &&
		path_rooms.length == 1 &&
		path_rooms[0].length === 0
	) {
		substring_matches.push("..");
	}
	for (let room_num = 0; room_num < path_rooms.length; room_num++) {
		new_room = search_room.can_cd(path_rooms[room_num]);
		if (new_room) {
			search_room = new_room;
			if (room_num === path_rooms.length - 1) {
				ret = [new_room.name + "/"];
			}
		} else {
			//We've made it to the final room,
			// so we should look for things to complete our journey
			if (room_num == path_rooms.length - 1) {
				//Compare to this room's children
				if (
					_argType(syntax, argidx, ARGT.strictfile) ||
					_argType(syntax, argidx, ARGT.file) ||
					_argType(syntax, argidx, ARGT.dir)
				) {
					for (let room of search_room.children) {
						if (compl(room.name, path_rooms[room_num])) {
							substring_matches.push(room.name + "/");
						}
					}
					//Compare to this room's items
					if (
						_argType(syntax, argidx, ARGT.strictfile) ||
						_argType(syntax, argidx, ARGT.file)
					) {
						for (let item of search_room.items) {
							if (compl(item.name, path_rooms[room_num])) {
								substring_matches.push(item.name);
							}
						}
					}
				}
			}
		}
	}
	return substring_matches;
}
export function _getCommands(r) {
	let ret = [],
		cmd,
		i;
	for (i = 0; i < r.items.length; i++) {
		if (r.items[i].executable) {
			ret.push("./" + r.items[i].name);
		}
	}
	return ret.concat(_getUserCommands());
}
export function _parse_exec(vt, arrs) {
	let t = vt.getContext();
	let cmd = arrs[0];
	let sudo = false;
	if (arrs[0] === "sudo") {
		arrs.shift();
		cmd = arrs[0];
		sudo = true;
	}
	let ret = "";
	let r = t;
	arrs.push(arrs.pop().replace(/\/$/, ""));
	let args = _expandArgs(arrs.slice(1), r);
	// find the program to launch
	let cmdexec = null;
	if (cmd.match(/^(\.\/|\/)/)) {
		//find a local program
		let tr = r.traversee(cmd);
		let item = tr.item;
		r = tr.room;
		if (item && item.executable) {
			cmdexec = function (args, vt) {
				return item.exec(args, r, vt);
			};
		}
	}
	if (!cmdexec && (sudo || _hasRightForCommand(cmd, r))) {
		//find a builtin program
		cmdexec = _getCommandFunc(cmd);
	}
	// test command eligibility when no existant cmd
	if (!cmdexec) {
		if (cmd in r.cmd_text) {
			r.fire_event(vt, cmd + "_cmd_text", args, 0);
			ret = r.cmd_text[cmd];
		} else {
			r.fire_event(vt, "cmd_not_found", args, 0);
			r.fire_event(vt, cmd + "_cmd_not_found", args, 0);
			ret = cmd_done(
				vt,
				[[r, 0]],
				_("cmd_not_found", [cmd, r.name]),
				"cmd_not_found",
				args,
			);
		}
		return ret;
	}

	let tgt, cur;
	for (let i = 0; i < args.length; i++) {
		tgt = t.traversee(args[i]);
		cur = tgt.room;
		if (!cur || tgt.item || sudo) {
			continue;
		}
		if (i === 0 && !_hasRightForCommand(cmd, cur)) {
			if (cmd in cur.cmd_text) {
				ret = cur.cmd_text[cmd];
			} else {
				ret = _("cmd_not_found", [cmd, cur.name]);
			}
			return ret;
		}
	}

	let run_cmd = function () {
		if (sudo) t.sudo = true;
		let text_to_display = cmdexec(args, vt);
		if (text_to_display) {
			ret = text_to_display;
		} else if (cmd in r.cmd_text) {
			ret = r.cmd_text[cmd];
		}
		t.sudo = false;
		return ret;
	};

	if (sudo && !t.supass) {
		let passwordcallback = function (passwd, elem) {
			let ret = "";
			// console.log(passwd);
			if (passwd == "IHTFP") {
				t.supass = true;
				ret = run_cmd();
			} else {
				ret = _("room_wrong_password");
			}
			return ret;
		};

		vt.ask(_("ask_password"), passwordcallback, {
			cls: "choicebox passinput",
			disappear: function (f) {
				f();
			},
		});
	} else {
		ret = run_cmd();
		return ret;
	}
}
