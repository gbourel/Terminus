#!/usr/bin/env python3
import os
import sys
import re

LANG_TO_INDEX = {
    'fr': 'index.html',
    'en': 'terminus.en.html'
}

try:
    from polib import pofile
except ImportError:
    print("\nThis script requires polib >= 1.0.0\n\n"
          "To fix this, run: pip install --upgrade polib\n\n"
          "( If you don't need to parse po files,\n"
          "  use NOPOLIB= environment variable )\n")
    exit(1)


def po2json(orig):
    """ convert po entries in js format """
    lines = []
    entries = pofile(orig)
    if not entries:
        return lines
    lines += [
        "// generated from po file\n",
        "var dialog={"
    ]
    for entry in entries:
        if not entry.msgstr:
            continue
        if len(entry.msgid.split("\n")) > 2:
            msgid = ('"%s"') % entry.msgid.replace('"', '\"')
        else:
            msgid = entry.msgid.replace("\n", "")
            if " " in msgid or "-" in msgid:
                msgid = ('"%s"') % msgid.replace('"', '\\"')
        msgstr = entry.msgstr.replace(
            '\\', '\\\\').replace(
                '\\"', '\\\\"').replace(
                    "\n", "\\n").replace(
                        '"', '\\"')
        lines.append(str('%s:"%s",\n' % (msgid, msgstr)))
    lines.append("};\n")
    return lines


def make_all(lang):
    jssrc = [
        'src/js/engine/howler.core.js',
        'src/js/engine/js.js',
        'src/js/engine/Gettext.js',
        'src/js/engine/Cookie.js',
        'src/js/engine/GameState.js',
        'src/js/engine/EventTarget.js',
        'src/js/engine/Sound.js',
        'src/js/engine/Music.js',
        'src/js/engine/ReturnSequence.js',
        'src/js/engine/VTerm.js',
        'src/js/engine/User.js',
        'src/js/engine/Parse.js',
        'src/js/engine/Command.js',
        'src/js/engine/Commands.js',
        'src/js/engine/Pic.js',
        'src/js/engine/Item.js',
        'src/js/engine/Room.js',
        'src/js/terminus.init.js',
        'src/js/terminus.assets.js',
        'src/js/terminus.utils.js',
        'src/js/terminus.gamestart.js',
        'src/js/terminus.level1.js',
        'src/js/terminus.level2.js',
        'src/js/terminus.run.js',
    ]

    pojsfile = os.path.join(TMPDIR, 'terminus.dialog.%s.js' % lang)
    pojs=po2json('src/lang/terminus.%s.po' % lang)
    with open(pojsfile, "w") as buf:
        buf.writelines(pojs)


if __name__ == '__main__':
    lang = 'fr'
    pojsfile = os.path.join('src/.build', 'terminus.dialog.%s.js' % lang)
    pojs = po2json('src/lang/terminus.%s.po' % lang)
    with open(pojsfile, "w") as buf:
        buf.writelines(pojs)