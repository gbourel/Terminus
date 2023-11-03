import { dom, addBtn, prEl, addEl, span, injectProperties, union, almostEqual, addAttrs, objToStr, clone, d, anyStr, aStrArray, rmIdxOf, isStr, isObj, def, ndef, pushDef, cntUp, hdef, randomSort, shuffleStr, randomStr, Seq } from "./engine/js.js";
import { _, POPREFIX_CMD, POPREFIX_ROOM, POPREFIX_ITEM, POPREFIX_PEOPLE, POSUFFIX_DESC, POSUFFIX_EXEC_DESC, PO_NONE, PO_NONE_DESC, PO_DEFAULT_ROOM, PO_DEFAULT_ITEM, PO_DEFAULT_PEOPLE, PO_DEFAULT_ROOM_DESC, PO_DEFAULT_ITEM_DESC, PO_DEFAULT_PEOPLE_DESC } from './engine/Gettext.js';
import { newRoom } from "./engine/Room.js";
import { snd } from "./engine/Sound.js";
import { music } from "./engine/Music.js";
import { user } from "./engine/User.js";
import { vt } from "./engine/VTerm.js";
import { global_fire_done } from "./engine/Command.js";
import { mesg, learn, unlock } from "./terminus.utils.js";

export function initLvl1(state, map) {
	// home
	function cat_first_try(re) {
		map.home.unsetCmdEvent("less_no_arg");
		mesg(_("cmd_cat_first_try"), re, { timeout: 500 });
	}
	function cat_second_try(re) {
		map.home.unsetCmdEvent("destination_unreachable");
		mesg(_("cmd_cat_second_try"), re, { timeout: 1000 });
	}
	//map.home - required - default room
	newRoom(map, "home", undefined, { writable: true });
	state.setHome(map.home);
	state.setCurrentRoom(map.home);
	map.home.setEnterCallback(function () {
		music.play("forest");
	});

	map.home
		.setCmdEvent("cmd_not_found", "hnotf")
		.setCmdEvent("less_no_arg", "hnoarg")
		.setCmdEvent("destination_unreachable", "hnodest")
		.addStates(state, {
			hnotf: function (re) {
				if (!re) {
					setTimeout(function () {
						vt.unmuteSound();
						mesg(_("very_first_try"), re);
						//          vt.show_msg(_('msg_from',['????','???',getTime()]),{direct:true});
						//          vt.show_msg(_('very_first_try'));
						vt.unmuteCommandResult();
						map.home.unsetCmdEvent("cmd_not_found");
						setTimeout(function () {
							vt.show_img();
							global_fire_done();
							state.saveCookie();
						}, 1300);
					}, 1000);
				}
			},
			hnoarg: cat_first_try,
			hnodest: cat_second_try,
		});

	let shell_txt_id = 0;
	function shell_dial(re) {
		if (!isStr(shell_txt_id)) {
			if (shell_txt_id === 2) {
				pwddecl.fire_event(vt, "less");
			}
			shelly.setTextIdx(++shell_txt_id % 7);
		}
		state.saveCookie();
	}
	const shelly = map.home
		.newPeople("shell")
		.setCmdEvent("less_done", "chtxt")
		.setCmdEvent("exec_done", "chtxt")
		.addStates(state, {
			chtxt: shell_dial,
		});

	//WESTERN FOREST
	map.home.addPath(
		newRoom(map, "western_forest", "loc_forest.gif").setEnterCallback(
			function () {
				music.play("forest");
			},
		),
	);
	map.western_forest.newItem(
		"western_forest_academy_direction",
		"item_sign.png",
	);
	const pwddecl = map.western_forest
		.newItem("western_forest_back_direction")
		.setCmdEvent("less", "pwdCmd")
		.addStates(state, {
			pwdCmd: function (re) {
				map.western_forest.unsetCmdEvent("less");
				if (!user.hasGroup("pwd")) {
					user.addGroup("pwd");
					learn(vt, "pwd", re);
				}
			},
		});

	//SPELL CASTING ACADEMY
	map.western_forest.addPath(
		newRoom(map, "spell_casting_academy", "loc_academy.gif").setEnterCallback(
			function () {
				music.play("academy");
			},
		),
	);

	//LESSONS
	map.spell_casting_academy.addPath(
		newRoom(map, "lessons", "loc_classroom.gif"),
	);
	const prof = map.lessons
		.newPeople("professor", "item_professor.png")
		.setCmdEvent("less", "learn_mv")
		.addState(state, "learn_mv", function (re) {
			prof.unsetCmdEvent("less");
			user.addGroup("mv");
			learn(vt, "mv", re);
		});

	map.spell_casting_academy.addPath(
		newRoom(map, "academy_practice", "loc_practiceroom.png", {
			writable: true,
		}),
	);
	map.academy_practice.newItem("academy_practice", "item_manuscript.png");
	//BOX
	map.academy_practice.addPath(
		newRoom(map, "box", "item_box.png", { writable: true }).setEnterCallback(
			function (r, vt) {
				enterRoom(r.parents[0], vt);
			},
		),
	);
	let mv_pr_sum = 0;
	function mv_sum(re) {
		mv_pr_sum++;
		if (mv_pr_sum === 3) {
			prof.moveTo(map.academy_practice);
			map.spell_casting_academy.removePath(map.lessons);
			map.spell_casting_academy.setEnterCallback(null);
			if (re) {
				map.western_forest.removePath(map.spell_casting_academy);
			} else {
				map.spell_casting_academy.setLeaveCallback(function () {
					map.western_forest.removePath(map.spell_casting_academy);
				});
			}
			if (!re) {
				success(vt, "room_spell_casting_academy", re);
				ondone(function () {
					setTimeout(function () {
						snd.play("broken");
					}, 1000);
					setTimeout(function () {
						prof.setTextIdx("quit");
						music.play("warning", { loop: true });
						mesg(_("leave_academy"), re);
					}, 3000);
				});
			}
		}
		console.log("mv", mv_pr_sum);
	}

	map.academy_practice
		.newItemBatch("practice", [1, 2, 3], "item_test.png")
		.map(function (i) {
			i.setCmdEvent("mv").addState(state, "mv", mv_sum);
		});

	//EASTERN MOUNTAINS
	const man_sage = newRoom(map, "mountain", "loc_mountains.gif").newPeople(
		"man_sage",
		"item_mysteryman.png",
	);
	man_sage.setCmdEvent("less", "exitCmd").addStates(state, {
		exitCmd: function (re) {
			man_sage.unsetCmdEvent("less");
			user.addGroup("exit");
			learn(vt, ["exit"], re);

			const man = map.mountain.newItem("man", "item_manuscript.png");
			man
				.setCmdEvent("less", "manCmd")
				.addStates(state, {
					manCmd: function (re) {
						man.unsetCmdEvent("less");
						user.addGroup("help");
						learn(vt, ["man", "help"], re);
					},
				})
				.setCmdEvent("less_done", "trueStart")
				.addStates(state, {
					trueStart: function (re) {
						man.unsetCmdEvent("less_done");
						music.play("yourduty", { loop: true });
					},
				});
		},
	});
	man_sage.setCmdEvent("less_done", "manLeave").addStates(state, {
		manLeave: function (re) {
			man_sage.disappear();
		},
	});
	let poney_txt_id = 1;
	function poney_dial(re) {
		if (!isStr(poney_txt_id)) {
			poney.setTextIdx(poney_txt_id++);
			if (poney_txt_id === 5) {
				poney.setCmdEvent("less_done", "uptxthint");
			}
		}
	}
	function poney_dialhint(re) {
		poney.setCmdEvent("less_done", "uptxthint");
		if (!vt.statkey.Tab || vt.statkey.Tab === 0) {
			poney.setTextIdx("tab");
		} else if (!user.hasGroup("mv")) {
			poney.setTextIdx("mv");
		} else if (!state.applied("mvBoulder")) {
			poney.setTextIdx("mountain");
		} else {
			poney.setTextIdx("help");
		}
	}
	//NORTHERN MEADOW
	map.home.addPath(newRoom(map, "meadow", "loc_meadow.gif"));
	const poney = map.meadow
		.newPeople("poney", "item_fatpony.png")
		.setCmdEvent("less", "add_mountain")
		.setCmdEvent("less_done", "uptxt")
		.addStates(state, {
			add_mountain: function (re) {
				map.meadow.addPath(map.mountain);
				mesg(_("new_path", [map.mountain]), re, { timeout: 600, ondone: true });
				unlock(vt, map.mountain, re);
				poney.unsetCmdEvent("less");
			},
			uptxt: poney_dial,
			uptxthint: poney_dialhint,
		});

	//CAVE / DARK CORRIDOR & STAIRCASE
	map.mountain.addPath(
		newRoom(map, "cave", "loc_cave.gif").addPath(
			newRoom(map, "dark_corridor", "loc_corridor.gif"),
		),
		//  .addPath(newRoom(map, 'staircase', "loc_stair.gif"))
	);
	//map.staircase.newItem('dead_end', "item_sign.png");

	//DANK ROOM / SMALL HOLE
	map.dark_corridor.addPath(
		newRoom(map, "dank", "loc_darkroom.gif", { writable: true })
			.addCommand("mv")
			.addPath(
				newRoom(map, "small_hole", undefined, { writable: true }).setCmdText(
					"cd",
					_("room_small_hole_cd"),
				),
			),
	);
	const boulder = map.dank
		.newItem("boulder", "item_boulder.png", { cls: "large" })
		.setCmdEvent("mv", "mvBoulder")
		.addStates(state, {
			mvBoulder: function (re) {
				if (!map.dank.hasChild(map.tunnel)) {
					map.dank.addPath(map.tunnel);
					//      boulder.unsetCmdEvent('mv');
					unlock(vt, map.tunnel, re);
					if (re) {
						map.dank.getItem("boulder").moveTo(map.small_hole);
					}
				}
			},
		});

	//TUNNEL / STONE CHAMBER / PORTAL
	let rat_txtidx = 1;
	newRoom(map, "tunnel", "loc_tunnel.gif").addPath(
		newRoom(map, "stone_chamber", "loc_portalroom.gif").addPath(
			newRoom(map, "portal", "item_portal.png").setEnterCallback(function () {
				vt.playSound("portal");
				music.play("chapter1");
			}),
		),
	);
	const rat = map.tunnel
		.newPeople("rat", "item_rat.png", { pic_shown_in_ls: false })
		.setCmdEvent("less_done", "idRat")
		.addStates(state, {
			idRat: function (re) {
				rat.setCmdEvent("less_done", "ratDial");
				rat.setPoDelta("_identified");
			},
			ratDial: function (re) {
				rat.setTextIdx(rat_txtidx++);
			},
		});
}
//---------------END LEVEL 1-----------------
