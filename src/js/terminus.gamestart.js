import { dom, addBtn, prEl, addEl, span, injectProperties, union, almostEqual, addAttrs, objToStr, clone, d, anyStr, aStrArray, rmIdxOf, isStr, isObj, def, ndef, pushDef, cntUp, hdef, randomSort, shuffleStr, randomStr, Seq } from "./engine/js.js";
import { _, pogencnt, POPREFIX_CMD, POPREFIX_ROOM, POPREFIX_ITEM, POPREFIX_PEOPLE, POSUFFIX_DESC, POSUFFIX_EXEC_DESC, PO_NONE, PO_NONE_DESC, PO_DEFAULT_ROOM, PO_DEFAULT_ITEM, PO_DEFAULT_PEOPLE, PO_DEFAULT_ROOM_DESC, PO_DEFAULT_ITEM_DESC, PO_DEFAULT_PEOPLE_DESC } from './engine/Gettext.js';
import { music } from "./engine/Music.js";
import { snd } from "./engine/Sound.js";
import { user } from "./engine/User.js";
import { vt } from "./engine/VTerm.js";
import { debug } from "./terminus.utils.js";

const game_version = "0.2";
const cookie_version = "terminus" + game_version;

const TESTING = false;

export function start_game(state) {
	debug("start_game");
	let loadel;

	// prepare game loading
	const has_save = state.startCookie(cookie_version);
	const choices = [_("cookie_yes"), _("cookie_no")];
	if (has_save) choices.unshift(_("cookie_yes_load"));

	var game_start = function (vt, use_cookies) {
		vt.muteSound();
		let loaded = false;
		if (pogencnt > 0) {
			vt.show_msg(_("pogen_alert", pogencnt));
		}
		if (use_cookies - (has_save ? 1 : 0) <= 0) {
			// yes new game or load
			state.setCookieDuration(7 * 24 * 60); // in minutes
			if (use_cookies == 0) {
				// load
				loaded = state.loadCookie();
			}
		} else {
			// do not use cookie
			state.stopCookie();
		}
		vt.clear();
		vt.setContext(state.getCurrentRoom());
		if (loaded) {
			vt.unmuteSound();
			vt.notification(_("game_loaded"));
			vt.show_msg(
				vt.context.getStarterMsg(_("welcome_msg", [user.name]) + "\n"),
			);
			vt.enable_input();
		} else {
			vt.muteCommandResult();
			music.play("preload");
			var seq = new Seq();
			seq.then(function (next) {
				vt.unmuteSound();
				vt.ask(
					_("prelude_text"),
					function (val) {
						// Todo detect bad or lovely words -> user_judged_bad & user_judged_lovely
						user.judged = _(
							"user_judged-" + Math.min(5, Math.round(val.length / 20)),
						);
					},
					{
						cls: "mystory",
						disappear: function (cb) {
							cb();
							next();
						},
					},
				);
			});
			seq.then(function (next) {
				vt.ask(
					user.judged + "\n" + _("username_prompt"),
					function (val) {
						user.setName(state, val);
						next();
					},
					{
						placeholder: user.name,
						cls: "megaprompt",
						disappear: function (cb) {
							cb();
						},
						wait: 500,
					},
				);
			});
			seq.then(function (next) {
				vt.ask(
					_("useraddress_prompt"),
					function (val) {
						user.setAddress(state, val);
						next();
					},
					{
						placeholder: user.address,
						cls: "megaprompt",
						disappear: function (cb) {
							cb();
							vt.flash(0, 800);
						},
						wait: 500,
					},
				);
			});
			seq.then(function (next) {
				vt.muteSound();
				vt.show_loading_element_in_msg(["_", " "], {
					duration: 800,
					finalvalue: " ",
					callback: next,
				});
			});
			seq.then(function (next) {
				vt.show_msg([_("gameintro_text_initrd"), next], {});
			});
			seq.then(function (next) {
				loadel = dom.Id("initload");
				vt.show_loading_element_in_msg(["/'", "'-", " ,", "- "], {
					el: loadel,
					finalvalue: "<span class='color-ok'>" + _("gameintro_ok") + "</span>",
					duration: 800,
					callback: next,
				});
			});
			seq.then(function (next) {
				vt.show_msg([_("gameintro_text_domainname"), next]);
			});
			seq.then(function (next) {
				loadel = dom.Id("domainsetup");
				vt.show_loading_element_in_msg(["/'", "'-", " ,", "- "], {
					el: loadel,
					finalvalue: "<span class='color-ok'>" + _("gameintro_ok") + "</span>",
					duration: 800,
					callback: next,
				});
			});
			seq.then(function (next) {
				vt.show_msg([_("gameintro_text_fsck"), next]);
			});
			seq.then(function (next) {
				loadel = dom.Id("initfsck");
				vt.show_loading_element_in_msg(["/'", "'-", " ,", "- "], {
					el: loadel,
					finalvalue:
						"<span class='color-pass'>" + _("gameintro_pass") + "</span>",
					duration: 800,
					callback: next,
				});
			});
			seq.then(function (next) {
				vt.show_msg([_("gameintro_text_terminus"), next]);
			});
			seq.then(function (next) {
				vt.show_msg(_("gamestart_text"));
				vt.unmuteSound();
				music.play("story");
				vt.enable_input();
				vt.auto_shuffle_input_msg(_("press_enter"), 0.9, 0.1, 8, 20, null, 50);
			});
			seq.next();
		}
	};

	// build view
	vt.state = state;
	vt.soundbank = snd;
	vt.charduration = 20;
	vt.charfactor[" "] = 25; //on each nbsp , it will take 1/2 second
	vt.disable_input();
	user.addGroup("cat");
	user.addGroup("dir");
	vt.flash(0, 800);
	vt.epic_img_enter("titlescreen.gif", "epicfromright", 800, function (vt) {
		vt.show_msg(["version : " + game_version, null]);
		if (TESTING) {
			vt.enable_input();
			vt.setContext(state.getCurrentRoom());
			do_test();
		} else {
			//        music.play('title',{loop:true});
			vt.ask_choose(_("cookie"), choices, game_start, { direct: true });
		}
	});
}
