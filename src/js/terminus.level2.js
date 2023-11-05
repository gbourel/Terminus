import { dom, addBtn, prEl, addEl, span, injectProperties, union, almostEqual, addAttrs, objToStr, clone, d, anyStr, aStrArray, rmIdxOf, isStr, isObj, def, ndef, pushDef, cntUp, hdef, randomSort, shuffleStr, randomStr, Seq } from "./engine/js.js";
import { _, POPREFIX_CMD, POPREFIX_ROOM, POPREFIX_ITEM, POPREFIX_PEOPLE, POSUFFIX_DESC, POSUFFIX_EXEC_DESC, PO_NONE, PO_NONE_DESC, PO_DEFAULT_ROOM, PO_DEFAULT_ITEM, PO_DEFAULT_PEOPLE, PO_DEFAULT_ROOM_DESC, PO_DEFAULT_ITEM_DESC, PO_DEFAULT_PEOPLE_DESC } from './engine/Gettext.js';
import { newRoom } from "./engine/Room.js";
import { snd } from "./engine/Sound.js";
import { music } from "./engine/Music.js";
import { user } from "./engine/User.js";
import { vt } from "./engine/VTerm.js";
import { global_fire_done } from "./engine/Command.js";
import { mesg, learn, unlock, success } from "./terminus.utils.js";

//---------------LEVEL 2---------------------
export const sudoPasswd = Math.random().toString(36).substring(2,7).toUpperCase();
export function initLvl2(state, map) {
	// TOWN SQUARE
	map.portal.addPath(newRoom(map, "townsquare", "loc_square.gif"));
	map.townsquare.setEnterCallback(function () {
		music.play("chapter2", { loop: true });
	});
	var mayor_txtidx = 1;
	var mayor = map.townsquare
		.newPeople("citizen1", "item_citizen1.png")
		.setCmdEvent("less_done", "id")
		.addStates(state, {
			id: function (re) {
				mayor.setCmdEvent("less_done", "talk");
				mayor.setPoDelta("_");
			},
			talk: function (re) {
				mayor.setTextIdx(mayor_txtidx++);
			},
		});

	map.townsquare.newPeople("citizen2", "item_citizen2.png");
	var lady_txtidx = 1;
	var lady = map.townsquare
		.newPeople("citizen3", "item_lady.png")
		.setCmdEvent("less_done", "talk")
		.addStates(state, {
			talk: function (re) {
				lady.setTextIdx(lady_txtidx++);
			},
		});

	// MARKETPLACE
	var disabled_sell_choices = [];
	map.townsquare.addPath(
		newRoom(map, "market", "loc_market.gif", { writable: true }).addCommand("touch"),
	);

	function buy_to_vendor(vt, choice) {
		if (choice == 0) {
			if (map.market.hasItem("mkdir_cost")) {
				map.market.removeItem("mkdir_cost");
				map.market.apply("mkdirSold");
				return _("you_buy", [_("item_mkdir_spell")]);
			} else {
				return _("need_money", [_("item_rm_spell")]);
			}
		} else if (choice == 1) {
			if (map.market.hasItem("rm_cost")) {
				map.market.removeItem("rm_cost");
				map.market.apply("rmSold");
				return _("you_buy", [_("item_rm_spell")]);
			} else {
				return _("need_money", [_("rm_cost")]);
			}
		}
	}
	let vendor = map.market
		.newPeople("vendor", "item_merchant.png")
		.setCmdText("less", "")
		.setCmdEvent("less_done", function () {
			vt.show_img();
			vt.ask_choose(
				_("people_vendor_text"),
				[
					_("people_vendor_sell_mkdir"),
					_("people_vendor_sell_rm"),
					_("people_vendor_sell_nothing"),
				],
				buy_to_vendor,
				{ disabled_choices: disabled_sell_choices },
			);
		});

	let backpack = map.market
		.newItem("backpack", "item_backpack.png")
		.setCmdEvent("mv", function (ct) {
			vt.show_msg(_("item_backpack_stolen"));
			backpack.unsetCmdEvent("mv");
		})
		.setCmdEvent("less")
		.addStates(state, {
			less: function (re) {
				user.addGroup("unzip");
				learn(vt, "unzip", re);
				backpack.unsetCmdEvent("less");
				backpack.setPoDelta([".zip"]);
				backpack.setCmdEvent("unzip", function (ct) {
					let unzipped = [];
					unzipped.push(ct.room.newItem("rm_cost"));
					unzipped.push(ct.room.newItem("mkdir_cost"));
					backpack.setPoDelta([]);
					backpack.unsetCmdEvent("unzip");
					vt.show_msg(_("unzipped", [_("item_backpack"), unzipped.join(", ")]), {
						dependant: false,
					});
				});
			},
		});

	map.market.addStates(state, {
		rmSold: function (re) {
			user.addGroup("rm");
			learn(vt, "rm", re);
			map.market.removeItem("rm_spell");
			disabled_sell_choices.push(1);
			vendor.setCmdText("rm", _("people_vendor_rm"));
			global_fire_done();
		},
		mkdirSold: function (re) {
			user.addGroup("mkdir");
			learn(vt, "mkdir", re);
			disabled_sell_choices.push(0);
			map.market.removeItem("mkdir_spell");
			global_fire_done();
		},
	});
	map.market.newItem("rm_spell", "item_manuscript.png");
	map.market.newItem("mkdir_spell", "item_manuscript.png");

	// LIBRARY
	map.townsquare.addPath(newRoom(map, "library", "loc_library.gif").addCommand("grep"));
	let lever = map.library
		.newItem("lever", "item_lever.png", { executable: true })
		.setCmdEvent("exec", "pullLever")
		.addStates(state, {
			pullLever: function (re) {
				map.library.addPath(map.backroom);
				if (!re) {
					vt.show_msg(_("item_lever_exec"));
				}
				lever.disappear();
			},
		});
	map.library.newItem("historybook", "item_historybook.png");
	map.library
		.newItem("nostalgicbook", "item_historybook.png")
		.setCmdEvent("less", "pwdCmd")
		.addStates(state, {
			pwdCmd: function (re) {
				map.western_forest.fire_event("pwdCmd");
			},
		});
	map.library.newItem("romancebook", "item_romancenovel.png");
	map.library.newItem("itemspellbook", "item_radspellbook.png");
	map.library.newItem("radspellbook", "item_radspellbook.png");
	let vimbook = map.library
		.newItem("vimbook", "item_vimbook.png")
		.setCmdEvent("less", "openVim")
		.addState(state, "openVim", function (re) {
			if (!re) {
				vt.flash(1600, 1000);
				vt.rmCurrentImg(2650);
			}
			vimbook.disappear();
		});

	// BACK ROOM
	newRoom(map, "backroom", "loc_backroom.gif").addCommand("grep");

	map.backroom
		.newPeople("grep", "grep.png")
		.setCmdEvent("less", "grep")
		.addStates(state, {
			grep: function (re) {
				user.addGroup("grep");
				learn(vt, "grep", re);
			},
		});

	map.backroom.newPeople("librarian", "item_librarian.png");

	// ROCKY PATH
	map.townsquare.addPath(
		newRoom(map, "rockypath", "loc_rockypath.gif", { writable: true }),
	);
	// TODO play on filesize concept
	map.rockypath
		.newItem("largeboulder", "item_boulder.png")
		.setCmdText("rm", _("item_largeboulder_rm"))
		.setCmdEvent("rm")
		.addStates(state, {
			rm: function (re) {
				map.rockypath.addPath(map.farm);
				if (re) {
					if (re) map.rockypath.removeItem("largeboulder");
				}
			},
		});

	// ARTISAN'S SHOP
	map.townsquare.addPath(
		newRoom(map, "artisanshop", "loc_artisanshop.gif")
			.setCmdEvents(
				{
					touch: function (ct) {
						if (ct.arg === _("item_gear")) {
							return "touchGear";
						}
					},
					cp: function (ct) {
						var re = new RegExp(_("item_gear") + "\\d");
						//      console.log('five ?');
						if (re.test(ct.arg)) {
							for (var j = 1; j < 6; j++) {
								if (!ct.room.getItemFromName(_("item_gear", [j]))) {
									return "";
								}
							}
							return "FiveGearsCopied";
						}
					},
				},
				true,
			)
			.addStates(state, {
				touchGear: function (re) {
					Artisan.setCmdText("less", _("item_gear_touch"));
					map.artisanshop.addCommand("cp");
					user.addGroup("cp");
					learn(vt, "cp", re);
					if (re) map.artisanshop.newItem("gear", "item_gear.png");
					else map.artisanshop.getItem("gear").setPic("item_gear.png");
					state.saveCookie();
				},
				FiveGearsCopied: function (re) {
					Artisan.setCmdText("less", _("item_gear_artisans_ok"));
					map.artisanshop.removeItem("gear");
					if (re) {
					} else {
						//         map.artisanshop.newItemBatch("gear",['1','2','3','4','5']);
						map.artisanshop.removeItem("gear", [1]);
						map.artisanshop.removeItem("gear", [2]);
						map.artisanshop.removeItem("gear", [3]);
						map.artisanshop.removeItem("gear", [4]);
						map.artisanshop.removeItem("gear", [5]);
						success(vt, "room_artisanshop", re);
					}
					state.saveCookie();
				},
			}),
	);

	map.artisanshop
		.newItem("strangetrinket", "item_trinket.png")
		.setCmdText("rm", _("item_strangetrinket_rm"))
		.setCmdText("mv", _("item_strangetrinket_mv"));
	map.artisanshop
		.newItem("dragon", "item_clockdragon.png", { pic_shown_in_ls: false })
		.setCmdText("rm", _("item_dragon_rm"))
		.setCmdText("mv", _("item_dragon_mv"));
	var Artisan = map.artisanshop
		.newPeople("artisan", "item_artisan.png")
		.setCmdEvent("less", "touch")
		.addStates(state, {
			touch: function (re) {
				user.addGroup("touch");
				learn(vt, "touch", re);
				Artisan.unsetCmdEvent("less");
				state.saveCookie();
			},
		});

	// FARM
	newRoom(map, "farm", "loc_farm.gif")
		.addCommand("cp")
		.newItem("earofcorn", "item_corn.png")
		.setCmdText("rm", _("item_earofcorn_rm"))
		.setCmdEvent("cp", "CornCopied")
		.addStates(state, {
			CornCopied: function (re) {
				Farmer.setCmdText("less", _("corn_farmer_ok"));
				if (re) map.farm.newItem("another_earofcorn");
			},
		});

	var Farmer = map.farm.newPeople("farmer", "item_farmer.png");

	// BROKEN BRIDGE
	map.townsquare.addPath(
		newRoom(map, "brokenbridge", "loc_bridge.gif")
			.setCmdEvent("touch", function (ct) {
				return ct.arg === _("item_plank") ? "touchPlank" : "";
			})
			.addCommand("touch")
			.addStates(state, {
				touchPlank: function (re) {
					map.clearing.addCommand("cd");
					map.clearing.unsetCmdText("cd");
					map.clearing.setExecutable(true);
					map.brokenbridge.unsetCmdText("cd");
					map.brokenbridge.setIntroText(_("room_brokenbridge_text2"));
					if (re) map.brokenbridge.newItem("plank", "item_plank.png");
					else {
						map.brokenbridge.getItem("plank").setPic("item_plank.png");
						vt.echo(_("room_brokenbridge_text2"));
					}
				},
			}),
	);

	// CLEARING
	map.brokenbridge.addPath(
		newRoom(map, "clearing", "loc_clearing.gif", { writable: true, executable: false })
			.setCmdEvent("mkdir", function (ct) {
				return ct.arg == _("room_house") ? "HouseMade" : "";
			})
			.setCmdText("cd", _("room_clearing_cd"))
			.addCommand("mkdir")
			.addStates(state, {
				HouseMade: function (re) {
					if (re) {
						map.clearing.addPath(newRoom(map, "house"));
					}
					map.clearing
						.getChildFromName(_("room_house"))
						.setCmdText("cd", _("room_house_cd"))
						.setCmdText("ls", _("room_house_ls"));
					success(vt, "room_house", re);
					map.clearing.unsetCmdText("cd");
					map.clearing.setIntroText(_("room_clearing_text2"));
					CryingMan.setCmdText("less", _("room_clearing_less2"));
				},
			}),
	);
	var CryingMan = map.clearing.newPeople("cryingman", "item_man.png");

	// OMINOUS-LOOKING PATH
	map.clearing.addPath(newRoom(map, "ominouspath", "loc_path.gif", { writable: true }));
	map.ominouspath
		.newItem("brambles", "item_brambles.png", { cls: "large" })
		.setCmdEvent("rm", "rmBrambles")
		.setCmdText("mv", _("item_brambles_mv"))
		.setCmdText("rm", _("item_brambles_rm"))
		.addStates(state, {
			rmBrambles: function (re) {
				map.ominouspath.addPath(map.trollcave);
				if (re) map.ominouspath.removeItem("brambles");
			},
		});

	// CAVE
	var troll_evt = function (ct) {
		return ct.arg == "UglyTroll" ? "openSlide" : "";
	};
	newRoom(map, "trollcave", "loc_cave.gif", { writable: true })
		.setCmdEvent("mv", troll_evt)
		.setCmdEvent("rm", troll_evt);

	map.trollcave
		.newPeople("troll1", "item_troll1.png")
		.setCmdText("rm", _("people_troll1_rm"))
		.setCmdText("mv", _("people_troll1_mv"))
		.setCmdText("cp", _("people_troll1_cp"))
		.setCmdEvent("mv", "openSlide")
		.setCmdEvent("rm", "openSlide")
		.addStates(state, {
			openSlide: function (re) {
				map.slide.addCommand("cd");
				map.slide.setExecutable(true);
				map.slide.setCmdText("cd", _("room_slide_cd2"));
				if (re) map.trollcave.removePeople("troll1");
			},
		});

	map.trollcave
		.newPeople("troll2", "item_troll2.png")
		.setCmdText("rm", _("people_troll1_rm"));

	map.trollcave
		.newPeople("supertroll", "item_supertroll.png")
		.setCmdText("rm", _("people_supertroll_rm"))
		.setCmdText("mv", _("people_supertroll_mv"));

	// CAGE
	map.trollcave.addPath(
		newRoom(map, "cage", "item_cage.png", {
			cls: "covering",
			writable: true,
			executable: false,
			pic_shown_as_item: true,
		}).setCmdText("cd", _("room_cage_cd")),
	);
	var Kid = map.cage
		.newPeople("kidnapped", "item_boy.png")
		.setCmdText("mv", _("people_kidnapped_mv"))
		.setCmdEvent("mv", "freekid")
		.addStates(state, {
			freeKid: function () {
				Kid.moveTo(map.clearing);
			},
		});
	// SLIDE
	map.trollcave.addPath(
		newRoom(map, "slide", null, { executable: false }).setCmdText(
			"cd",
			_("room_slide_cd"),
		),
	);

	// KERNEL FILES
	map.slide.addPath(newRoom(map, "kernel").addCommand("sudo").addCommand("grep"));
	map.kernel
		.newItem("certificate", undefined, { readable: false })
		.setCmdEvent("unreadable", function (ct) {
			ct.term.echo(_("item_certificate_alert"));
		})
		.setCmdEvent("less_done", "sudoComplete")
		.addStates(state, {
			sudoComplete: function (re) {
				map.kernel.addPath(map.paradise);
				mesg(_("new_path", [map.paradise]), re, { timeout: 600, ondone: true });
				unlock(vt, map.paradise, re);
			},
		});
	map.kernel
		.newItem("sudo_teaser")
		.setCmdEvent("less", "sudo")
		.addStates(state, {
			sudo: function (re) {
				user.addGroup("sudo");
				learn(vt, "sudo", re);
			},
		});
	map.kernel.newItem("instructions");

	map.kernel.addPath(newRoom(map, "morekernel").addCommand("grep"));

	map.bigfiles = map.morekernel.newItemBatch("bigfile", [
		"L",
		"M",
		"Q",
		"R",
		"S",
		"T",
		"U",
		"V",
		"W",
	]);
	map.bigfiles.filter(function (f) {
		f.setCmdText("grep_overflow", _("grep_long"));
	});

	map.bigfiles[Math.floor(Math.random() * 9)].setCmdText("grep", `password = ${sudoPasswd}`);

	// PARADISE (end game screen)
	newRoom(map, "paradise", "loc_theend.gif")
		.setCmdText("ls", _("room_paradise_ls"))
		.setCmdEvent("ls_done", "gameover")
		.addStates(state, {
			gameover: function (re) {
				if (!re) vt.echo(_("room_paradise_ls"));
				mesg(_("gameover"), re, { timeout: 30000, ondone: true });
				mesg(_("gameover1"), re, { timeout: 60000, ondone: true });
				mesg(_("gameover2"), re, { timeout: 180000, ondone: true });
				mesg(_("gameover3"), re, { timeout: 196000, ondone: true });
			},
		});
}
