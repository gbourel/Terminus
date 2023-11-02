import { newRoom } from './engine/Room.js';

export function initLvl1(state) {
	let lvl = {};
	// home
	function cat_first_try(re) {
		lvl.home.unsetCmdEvent("less_no_arg");
		mesg(_("cmd_cat_first_try"), re, { timeout: 500 });
	}
	function cat_second_try(re) {
		lvl.home.unsetCmdEvent("destination_unreachable");
		mesg(_("cmd_cat_second_try"), re, { timeout: 1000 });
	}
	//lvl.home - required - default room
	newRoom(lvl, "home", undefined, { writable: true });
	state.setCurrentRoom(lvl.home);
	lvl.home.setEnterCallback(function () {
		music.play("forest");
	});

	lvl.home
		.setCmdEvent("cmd_not_found", "hnotf")
		.setCmdEvent("less_no_arg",	 "hnoarg")
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
						lvl.home.unsetCmdEvent("cmd_not_found");
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

	var shell_txt_id = 0;
	function shell_dial(re) {
		if (!isStr(shell_txt_id)) {
			if (shell_txt_id == 2) {
				pwddecl.fire_event(vt, "less");
			}
			shelly.setTextIdx(++shell_txt_id % 7);
		}
		state.saveCookie();
	}
	let shelly = lvl.home
		.newPeople("shell")
		.setCmdEvent("less_done", "chtxt")
		.setCmdEvent("exec_done", "chtxt")
		.addStates(state, {
			chtxt: shell_dial,
		});

	//WESTERN FOREST
	lvl.home.addPath(
		newRoom(lvl, "western_forest", "loc_forest.gif").setEnterCallback(function () {
			music.play("forest");
		}),
	);
	lvl.western_forest.newItem("western_forest_academy_direction", "item_sign.png");
	var pwddecl = lvl.western_forest
		.newItem("western_forest_back_direction")
		.setCmdEvent("less", "pwdCmd")
		.addStates(state, {
			pwdCmd: function (re) {
				lvl.western_forest.unsetCmdEvent("less");
				if (!_hasGroup("pwd")) {
					_addGroup("pwd");
					learn(vt, "pwd", re);
				}
			},
		});

	//SPELL CASTING ACADEMY
	lvl.western_forest.addPath(
		newRoom(lvl, "spell_casting_academy", "loc_academy.gif").setEnterCallback(
			function () {
				music.play("academy");
			},
		),
	);

	//LESSONS
	lvl.spell_casting_academy.addPath(newRoom(lvl, "lessons", "loc_classroom.gif"));
	var prof = lvl.lessons
		.newPeople("professor", "item_professor.png")
		.setCmdEvent("less", "learn_mv")
		.addState(state, "learn_mv", function (re) {
			prof.unsetCmdEvent("less");
			_addGroup("mv");
			learn(vt, "mv", re);
		});

	lvl.spell_casting_academy.addPath(
		newRoom(lvl, "academy_practice", "loc_practiceroom.png", { writable: true }),
	);
	lvl.academy_practice.newItem("academy_practice", "item_manuscript.png");
	//BOX
	lvl.academy_practice.addPath(
		newRoom(lvl, "box", "item_box.png", { writable: true }).setEnterCallback(function (
			r,
			vt,
		) {
			enterRoom(r.parents[0], vt);
		}),
	);
	var mv_pr_sum = 0;
	function mv_sum(re) {
		mv_pr_sum++;
		if (mv_pr_sum == 3) {
			prof.moveTo(lvl.academy_practice);
			lvl.spell_casting_academy.removePath(lvl.lessons);
			lvl.spell_casting_academy.setEnterCallback(null);
			if (re) {
				lvl.western_forest.removePath(lvl.spell_casting_academy);
			} else {
				lvl.spell_casting_academy.setLeaveCallback(function () {
					lvl.western_forest.removePath(lvl.spell_casting_academy);
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

	lvl.academy_practice
		.newItemBatch("practice", [1, 2, 3], "item_test.png")
		.map(function (i) {
			i.setCmdEvent("mv").addState(state, "mv", mv_sum);
		});

	//EASTERN MOUNTAINS
	let man_sage = newRoom(lvl, "mountain", "loc_mountains.gif").newPeople(
		"man_sage",
		"item_mysteryman.png",
	);
	man_sage.setCmdEvent("less", "exitCmd").addStates(state, {
		exitCmd: function (re) {
			man_sage.unsetCmdEvent("less");
			_addGroup("exit");
			learn(vt, ["exit"], re);

			man = lvl.mountain.newItem("man", "item_manuscript.png");
			man
				.setCmdEvent("less", "manCmd")
				.addStates(state, {
					manCmd: function (re) {
						man.unsetCmdEvent("less");
						_addGroup("help");
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
	var poney_txt_id = 1;
	function poney_dial(re) {
		if (!isStr(poney_txt_id)) {
			poney.setTextIdx(poney_txt_id++);
			if (poney_txt_id == 5) {
				poney.setCmdEvent("less_done", "uptxthint");
			}
		}
	}
	function poney_dialhint(re) {
		poney.setCmdEvent("less_done", "uptxthint");
		if (!vt.statkey.Tab || vt.statkey.Tab == 0) {
			poney.setTextIdx("tab");
		} else if (!_hasGroup("mv")) {
			poney.setTextIdx("mv");
		} else if (!state.applied("mvBoulder")) {
			poney.setTextIdx("mountain");
		} else {
			poney.setTextIdx("help");
		}
	}
	//NORTHERN MEADOW
	lvl.home.addPath(newRoom(lvl, "meadow", "loc_meadow.gif"));
	var poney = lvl.meadow
		.newPeople("poney", "item_fatpony.png")
		.setCmdEvent("less", "add_mountain")
		.setCmdEvent("less_done", "uptxt")
		.addStates(state, {
			add_mountain: function (re) {
				lvl.meadow.addPath(lvl.mountain);
				mesg(_("new_path", [lvl.mountain]), re, { timeout: 600, ondone: true });
				unlock(vt, lvl.mountain, re);
				poney.unsetCmdEvent("less");
			},
			uptxt: poney_dial,
			uptxthint: poney_dialhint,
		});

	//CAVE / DARK CORRIDOR & STAIRCASE
	lvl.mountain.addPath(
		newRoom(lvl, "cave", "loc_cave.gif").addPath(
			newRoom(lvl, "dark_corridor", "loc_corridor.gif"),
		),
		//  .addPath(newRoom(lvl, 'staircase', "loc_stair.gif"))
	);
	//lvl.staircase.newItem('dead_end', "item_sign.png");

	//DANK ROOM / SMALL HOLE
	lvl.dark_corridor.addPath(
		newRoom(lvl, "dank", "loc_darkroom.gif", { writable: true })
			.addCommand("mv")
			.addPath(
				newRoom(lvl, "small_hole", undefined, { writable: true }).setCmdText(
					"cd",
					_("room_small_hole_cd"),
				),
			),
	);
	var boulder = lvl.dank
		.newItem("boulder", "item_boulder.png", { cls: "large" })
		.setCmdEvent("mv", "mvBoulder")
		.addStates(state, {
			mvBoulder: function (re) {
				if (!lvl.dank.hasChild(lvl.tunnel)) {
					lvl.dank.addPath(lvl.tunnel);
					//      boulder.unsetCmdEvent('mv');
					unlock(vt, lvl.tunnel, re);
					if (re) {
						lvl.dank.getItem("boulder").moveTo(lvl.small_hole);
					}
				}
			},
		});

	//TUNNEL / STONE CHAMBER / PORTAL
	var rat_txtidx = 1;
	newRoom(lvl, "tunnel", "loc_tunnel.gif").addPath(
		newRoom(lvl, "stone_chamber", "loc_portalroom.gif").addPath(
			newRoom(lvl, "portal", "item_portal.png").setEnterCallback(function () {
				vt.playSound("portal");
				music.play("chapter1");
			}),
		),
	);
	var rat = lvl.tunnel
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
