import { dom, addBtn, prEl, addEl, span, injectProperties, union, almostEqual, addAttrs, objToStr, clone, d, anyStr, aStrArray, rmIdxOf, isStr, isObj, def, ndef, pushDef, cntUp, hdef, randomSort, shuffleStr, randomStr, Seq } from "./js.js";
import {
	ARGT,
	_hasRightForCommand,
	_lnCommand,
	_setupCommand,
	_getUserCommands,
	cmd_done,
} from "./Command.js";
import { Item } from "./Item.js";
import { enterRoom } from "./Room.js";
import { ReturnSequence } from "./ReturnSequence.js";
import { _, pogencnt, POPREFIX_CMD, POPREFIX_ROOM, POPREFIX_ITEM, POPREFIX_PEOPLE, POSUFFIX_DESC, POSUFFIX_EXEC_DESC, PO_NONE, PO_NONE_DESC, PO_DEFAULT_ROOM, PO_DEFAULT_ITEM, PO_DEFAULT_PEOPLE, PO_DEFAULT_ROOM_DESC, PO_DEFAULT_ITEM_DESC, PO_DEFAULT_PEOPLE_DESC } from './Gettext.js';
import { state } from "./GameState.js";
import { dialog } from "../../.build/terminus.dialog.fr.js";

_setupCommand("less", null, [ARGT.strictfile], function (args, vt) {
	// event arg -> object
	let r = vt.getContext(),
		ret = [];
	if (args.length < 1) {
		r.fire_event(vt, "less_no_arg", args, 0);
		return _("cmd_less_no_arg");
	} else {
		for (let i = 0; i < args.length; i++) {
			let tgt = r.traversee(args[i]);
			let room = tgt.room;
			if (room) {
				let item = tgt.item;
				if (item) {
					if (item.readable || r.sudo) {
						vt.push_img(item.picture, { index: ret.length }); // Display image of item
						room.fire_event(vt, "less", args, i);
						item.fire_event(vt, "less", args, i);
						ret.push(
							cmd_done(
								vt,
								[
									[room, 0],
									[item, i + 0],
								],
								item.cmd_text.less,
								"less",
								args,
							),
						);
					} else {
						item.fire_event(vt, "unreadable", args, i);
					}
				} else {
					room.fire_event(vt, "destination_unreachable", args, i);
					ret.push(_("item_not_exists", args));
				}
			} else {
				room.fire_event(vt, "destination_unreachable", args, i);
				ret.push(_("room_unreachable"));
			}
		}
		return new ReturnSequence(ret);
	}
});
_lnCommand("cat", "less");
_lnCommand("more", "less");
_setupCommand("ls", "dir", [ARGT.dir], function (args, vt) {
	let t = vt.getContext();
	let pic;
	// console.log(t);
	function printLS(room, render_classes) {
		let ret = "",
			pics = {},
			i;
		render_classes = render_classes || {
			item: "item",
			people: "people",
			subroom: "inside-room",
		};
		if (room.children.length > 0 || !room.isRoot) {
			let tmpret = "";
			for (i = 0; i < room.children.length; i++) {
				tmpret +=
					span("color-room", room.children[i].toString() + "/") + "\n\t";
				if (
					room.children[i].picture &&
					room.children[i].picture.shown_as_item
				) {
					room.children[i].picture.setOneShotRenderClass(
						render_classes.subroom,
					);
					pics["room-" + i] = room.children[i].picture;
				}
			}
			ret +=
				_("directions", [
					"\t" +
						(room.isRoot
							? ""
							: span("color-room", "..") + " (revenir sur tes pas)\n\t") +
						tmpret,
				]) + "\t\n";
		}
		let items = room.items.filter(function (o) {
			return !o.people;
		});
		let peoples = room.items.filter(function (o) {
			return o.people;
		});
		for (i = 0; i < peoples.length; i++) {
			if (peoples[i].picture && peoples[i].picture.shown_in_ls) {
				peoples[i].picture.setOneShotRenderClass(render_classes.people);
				pics["peoples-" + i] = peoples[i].picture;
			}
		}
		if (peoples.length > 0) {
			ret +=
				_("peoples", [
					"\t" +
						peoples
							.map(function (n) {
								return span("color-people", n.toString());
							})
							.join("\n\t"),
				]) + "\t\n";
		}
		for (i = 0; i < items.length; i++) {
			if (items[i].picture && items[i].picture.shown_in_ls) {
				items[i].picture.setOneShotRenderClass(render_classes.item);
				pics["item-" + i] = items[i].picture;
			}
		}
		if (items.length > 0) {
			ret +=
				_("items", [
					"\t" +
						items
							.map(function (n) {
								return span(
									"color-item" + (n.executable ? " color-executable" : ""),
									n.toString(),
								);
							})
							.join("\n\t"),
				]) + "\t\n";
		}
		return { txt: ret, pics: pics };
	}

	if (args.length > 0) {
		let room = t.traversee(args[0]).room;
		let prtls = null;
    if (room) {
			if (!(room.readable || t.sudo)) {
				return _("permission_denied") + " " + _("room_unreadable");
			}
			if (room.children.length === 0 && room.items.length === 0) {
				prtls = { pics: {}, txt: _("room_empty") };
			} else {
				prtls = printLS(room);
			}
			const pic = room.picture.copy();
			pic.addChildren(prtls.pics);
			pic.setOneShotRenderClass("room");
			vt.push_img(pic); // Display image of room

			return cmd_done(vt, [[room, 0]], prtls.txt, "ls", args);
			// return prtls.txt;
		} else {
			return _("room_unreachable");
		}
	} else {
		const prtls = printLS(t);
		const pic = t.picture.copy();
		pic.addChildren(prtls.pics);
		pic.setOneShotRenderClass("room");
		vt.push_img(pic); // Display image of room
		// return prtls.txt;
		return cmd_done(vt, [[t, 0]], prtls.txt, "ls", args);
	}
});
_setupCommand("cd", "dir", [ARGT.dir], function (args, vt) {
	let t = vt.getContext();
	if (args.length > 1) {
		return _("cmd_cd_flood");
	} else if (args[0] === "-") {
		t.previous.previous = t;
		enterRoom(t.previous, vt);
	} else if (args.length === 0) {
		return (
			_("cmd_cd_no_args") +
			(_hasRightForCommand("pwd") ? "\n" + _("cmd_cd_no_args_pwd") : "")
		);
	} else if (args[0] === "~") {
		state.getHome().previous = t;
		enterRoom(state.getHome(), vt);
		return _("cmd_cd_home");
	} else if (args[0] === "..") {
		t.fire_event(vt, "cd", args, 0);
		if (t.parents.length >= 1) {
			t.parents[0].previous = t;
			return _("cmd_cd_parent", enterRoom(t.parents[0], vt));
		} else {
			return _("cmd_cd_no_parent");
		}
	} else if (args[0] === ".") {
		vt.push_img(img.room_none);
		return _("cmd_cd", enterRoom(t, vt));
	} else {
		let dest = t.traversee(args[0]);
		let room = dest.room;
		if (room && !dest.item_name) {
			if (room.executable) {
				room.previous = t;
				return _("cmd_cd", enterRoom(room, vt));
			} else {
				t.fire_event(vt, "cd", args, 0, { unreachable_room: room });
				return room.cmd_text.cd;
			}
		}
		t.fire_event(vt, "cd", args, 0, { unreachable_room: room });
		return _("cmd_cd_failed", args);
	}
});

//only valid for command names
_setupCommand("man", "help", [ARGT.cmdname], function (args, vt) {
	// event arg -> cmd
	if (args.length < 1) {
		return _("cmd_man_no_query");
	} else {
		if ("man_" + args[0] in dialog) {
			return _("man_" + args[0]);
		}
		return _("cmd_man_not_found");
	}
});

_setupCommand("help", null, [ARGT.cmdname], function (args, vt) {
	let ret = _("cmd_help_begin") + "\n";
	const c = _getUserCommands();
	for (let i = 0; i < c.length; i++) {
		ret += "<pre>" + c[i] + "\t</pre>: " + _("help_" + c[i]) + "\n";
	}
	return ret;
});

_setupCommand("exit", null, [], function (args, vt) {
	setTimeout(function () {
		dom.body.innerHTML = _("cmd_exit_html");
	}, 2000);
	return _("cmd_exit");
});

_setupCommand("pwd", null, [], function (args, vt) {
	const t = vt.getContext();
	vt.push_img(t.picture);
	return _(POPREFIX_CMD + "pwd", [t.name])
		.concat("\n")
		.concat(t.intro_text);
});

_setupCommand("cp", null, [ARGT.file, ARGT.filenew], function (args, vt) {
	//event arg -> destination item
	const t = vt.getContext();
	if (args.length != 2) {
		return _("incorrect_syntax");
	} else {
		const src = t.traversee(args[0]);
		const dest = t.traversee(args[1]);
		if (src.item) {
			if (dest.item) {
				return _("tgt_already_exists", [dest.item_name]);
			} else if (dest.room) {
				const nut = src.item.copy(dest.item_name);
				dest.room.addItem(nut);
				nut.fire_event(vt, "cp", args, 1);
				src.item.fire_event(vt, "cp", args, 0);
				dest.room.fire_event(vt, "cp", args, 1);

				return cmd_done(
					vt,
					[
						[src.item, 0],
						[nut, 1],
					],
					_("cmd_cp_copied", args),
					"cp",
					args,
				);
			}
		}
		return _("cmd_cp_unknown");
	}
});
_setupCommand("mv", null, [ARGT.strictfile, ARGT.file], function (args, vt) {
	// event arg -> object (source)
	// console.log(args);
	let t = vt.getContext();
	let ret = [],
		src,
		dest = t.traversee(args[args.length - 1]);
	if (dest.item_name && args.length > 2) {
		ret.push(_("cmd_mv_flood"));
	} else {
		let retfireables = [],
			rename,
			overwritten;
		for (let i = 0; i < args.length - 1; i++) {
			src = t.traversee(args[i]);
			if (src.room) {
				if (src.item && dest.room) {
					rename = dest.item_name && src.item_name !== dest.item_name;
					overwritten = dest.item;
					if (!dest.room.writable) {
						ret.push(_("permission_denied") + " " + _("cmd_mv_dest_fixed"));
					} else if (src.item_idx > -1) {
						if (src.room.writable) {
							if (overwritten) {
								dest.room.removeItemByIdx(dest.item_idx);
							}
							if (rename) {
								src.item.name = dest.item_name;
							}
							src.room.fire_event(
								vt,
								"mv",
								[args[i], args[args.length - 1]],
								0,
							);
							if (src.room.uid !== dest.room.uid) {
								dest.room.addItem(src.item);
								src.room.removeItemByIdx(src.item_idx);
								src.item.fire_event(
									vt,
									"mv_outside",
									[args[i], args[args.length - 1]],
									0,
								);
								if ("mv" in src.item.cmd_text) {
									ret.push(src.item.cmd_text.mv);
								} else {
									ret.push(_("cmd_mv_done", [args[i], args[args.length - 1]]));
								}
							} else {
								src.item.fire_event(
									vt,
									"mv_local",
									[args[i], args[args.length - 1]],
									0,
								);
							}
							src.item.fire_event(
								vt,
								"mv",
								[args[i], args[args.length - 1]],
								0,
							);
							if (rename) {
								src.item.fire_event(vt, "mv_name", args, 0);
								if ("mv_name" in src.item.cmd_text) {
									ret.push(src.item.cmd_text.mv_name);
								} else if (!overwritten) {
									ret.push(
										_("cmd_mv_name_done", [args[i], args[args.length - 1]]),
									);
								}
							}
							if (overwritten) {
								ret.push(
									_("cmd_mv_overwrite_done", [args[i], args[args.length - 1]]),
								);
							}
							retfireables.push([src.item, 0]);
						} else if ("mv" in src.item.cmd_text) {
							ret.push(src.item.cmd_text.mv);
						} else {
							ret.push(_("permission_denied") + " " + _("cmd_mv_fixed"));
						}
					}
				} else if (!src[2]) {
					// got directory
					// TODO mv dir
				}
			} else {
				// got nothing
				ret.push(_("cmd_mv_no_file", [args[i]]));
			}
		}
		return cmd_done(vt, retfireables, ret.join("\n"), "mv", args);
		//      return _("cmd_mv_invalid");
	}
	return ret.join("\n");
});

_setupCommand("rm", null, [ARGT.file], function (args, vt) {
	// event arg -> object
	let t = vt.getContext();
	if (args.length < 1) {
		return _("cmd_rm_miss");
	} else {
		let stringtoreturn = "";
		let room, idx;
		for (let i = 0; i < args.length; i++) {
			let tgt = t.traversee(args[i]);
			room = tgt.room;
			idx = tgt.item_idx;
			if (idx > -1) {
				if (room.writable) {
					let removedItem = room.removeItemByIdx(idx);
					if (removedItem) {
						room.fire_event(vt, "rm", args, i);
						if ("rm" in removedItem.cmd_text) {
							stringtoreturn += removedItem.cmd_text.rm + "\n";
						} else {
							stringtoreturn += _("cmd_rm_done", [args[i]]);
						}
						removedItem.fire_event(vt, "rm", args, i);
					} else {
						stringtoreturn += _("cmd_rm_failed");
					}
				} else {
					return tgt.item.cmd_text.rm || _("cmd_rm_invalid");
				}
			}
			return stringtoreturn;
		}
	}
});

_setupCommand(
	"grep",
	null,
	[ARGT.pattern, ARGT.strictfile],
	function (args, vt) {
		let t = vt.getContext();
		let word_to_find = args[0];
		let filelist = args.slice(1);
		let ret = [];
		for (let i = 0; i < filelist.length; i++) {
			let fname = filelist[i];
			let tgt = t.traversee(fname);
			if (tgt.item) {
				let item_to_find_in_text = tgt.item.cmd_text.less;
				let line_array = [];
				let found = false;
				if (tgt.item.readable || t.sudo) {
					if (tgt.item.cmd_text.grep) {
						let longest_word = "";
						if (word_to_find.length > 2) {
							word_to_find.split(" ").filter(function (w) {
								if (longest_word.length < w.length) longest_word = w;
							});
							line_array = tgt.item.cmd_text.grep
								.split(/( |\n)/)
								.filter(function (w) {
									return (
										w.length > 1 &&
										w.indexOf(longest_word) >= 0 &&
										longest_word.length > w.length / 2
									);
								});
							if (line_array.length > 0) {
								item_to_find_in_text = tgt.item.cmd_text.grep;
								found = true;
							}
						}
						if (
							tgt.item.cmd_text.grep_overflow &&
							!found &&
							longest_word.length < 6
						) {
							ret.push(tgt.item.cmd_text.grep_overflow);
							continue;
						}
					}
				} else {
					tgt.item.fire_event(vt, "unreadable");
				}
				line_array = item_to_find_in_text.split("\n");
				let return_arr = line_array.filter(function (line) {
					return line.indexOf(word_to_find) >= 0;
				});
				if (return_arr.length > 0) ret.push(return_arr.join("\n"));
			} else {
				ret.push(_("item_not_exists", [tgt.toString()]));
			}
		}
		return ret.join("\n");
	},
);

_setupCommand("touch", null, [ARGT.filenew], function (args, vt) {
	let t = vt.getContext();
	if (args.length < 1) {
		return _("cmd_touch_nothing");
	} else {
		let createdItemsString = "";
		for (let i = args.length - 1; i >= 0; i--) {
			if (t.getItemFromName(args[i])) {
				return _("tgt_already_exists", [args[i]]);
			} else if (args[i].length > 0) {
				t.addItem(new Item(args[i], _("item_intro", [args[i]])));
				createdItemsString += args[i];
				t.fire_event(vt, "touch", args, i);
			}
		}
		if (createdItemsString === "") {
			return _("cmd_touch_none");
		}
		return _("cmd_touch_created", [createdItemsString]);
	}
});

_setupCommand("mkdir", null, [ARGT.dirnew], function (args, vt) {
	//event arg -> created dir
	let t = vt.getContext();
	if (args.length === 1) {
		let tr = t.traversee(args[0]);
		if (tr.room.writable) {
			if (!tr.item) {
				tr.room.addPath(
					new Room(tr.item_name, undefined, undefined, { writable: true }),
				);
				t.fire_event(vt, "mkdir", args, 0);
				return _("room_new_created", args);
			}
			return _("tgt_already_exists", [args[0]]);
		}
		return _("permission_denied") + " " + _("room_not_writable");
	}
	return _("incorrect_syntax");
});

_setupCommand(
	"unzip",
	null,
	[ARGT.file.concat(["*.zip"])],
	function (args, vt) {
		let t = vt.getContext();
		if (args.length === 1) {
			let tr = t.traversee(args[0]);
			if (tr.item && tr.room.writable) {
				tr.item.fire_event(vt, "unzip", args, 0);
				return "";
			} else {
				return _("item_cmd_unknow", "unzip");
			}
		}
		return _("incorrect_syntax");
	},
);
