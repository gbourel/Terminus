import { _, pogencnt, POPREFIX_CMD, POPREFIX_ROOM, POPREFIX_ITEM, POPREFIX_PEOPLE, POSUFFIX_DESC, POSUFFIX_EXEC_DESC, PO_NONE, PO_NONE_DESC, PO_DEFAULT_ROOM, PO_DEFAULT_ITEM, PO_DEFAULT_PEOPLE, PO_DEFAULT_ROOM_DESC, PO_DEFAULT_ITEM_DESC, PO_DEFAULT_PEOPLE_DESC } from './engine/Gettext.js';
import { vt } from './engine/VTerm.js';
import { global_fireables } from './engine/Command.js';

/*
 * recurrent things
 **/
export const debug = console.info;

export function getTime() {
	debug("[utils] getTime");
	//  return new Date().toLocaleFormat('%Hh%M');
	let d = new Date();
	return d.getHours() + "h" + d.getMinutes();
}

export function learn(vt, cmds, re) {
	debug("[utils] learn", vt, cmds, re);
	if (typeof cmds == "string") {
		cmds = [cmds];
	}
	if (!re) {
		global_fireables.done.push(function () {
			for (let j = 0; j < cmds.length; j++) {
				vt.badge(_("you_learn", [cmds[j]]), _("you_learn_desc", [cmds[j]]));
				vt.playSound("learned");
			}
		});
	}
}
export function unlock(vt, unlocked, re) {
	debug("[utils] unlock", vt, unlocked, re);
	if (!re) {
		global_fireables.done.push(function () {
			vt.playSound("unlocked");
			vt.badge(_("you_unlock", [unlocked]), _("you_unlock_desc", [unlocked]));
		});
	}
}
export function mesg(msg, re, opt) {
	debug("[utils] mesg", msg, re, opt);
	if (!re) {
		opt = opt || {};
		let fu = function () {
			setTimeout(function () {
				vt.show_msg(
					'<div class="mesg">' +
						_("msg_from", [opt.user || "????", opt.tty || "???", getTime()]) +
						"\n" +
						msg +
						"</div>",
					{ direct: true },
				);
			}, opt.timeout || 0);
		};
		if (opt.ondone) {
			global_fireables.done.push(fu);
		} else {
			fu();
		}
	}
}
export function ondone(fu) {
	debug("[utils] ondone", fu);
	global_fireables.done.push(fu);
}
export function success(vt, txt, re) {
	debug("[utils] success", vt, txt, re);
	if (!re) {
		global_fireables.done.push(function () {
			vt.playSound("success");
			vt.badge(_(txt + "_success_title"), _(txt + "_success_text"));
			let m = txt + "_congrat_mesg";
			if (m in dialog) {
				mesg(_(m));
			}
		});
	}
}
