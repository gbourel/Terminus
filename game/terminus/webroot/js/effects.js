var EFFECTS = {
  timeout: { badge: 4000, notification: 10000 },
  pic: { badge: vt.mkImg({ img: 'badge' }) },
  notifications: addEl(document.body, 'div', 'notifications'),
  last_notify: Date.now()
}

function flash (timeout, timeoutdisappear) {
  setTimeout(function () {
    document.body.className += ' flash'
    setTimeout(function () {
      document.body.className = document.body.className.replace(/[ ]*flash/, '')
    }, timeoutdisappear || 800)
  }, timeout || 0)
}
//
// function loader (title, id, val, duration, next) {
//   vt.echo(title, { cb: () => {
//     let el = vt.current_msg.getElementsByClassName('t-progress')[0]
//     animElContent(el, ['/\'', '\'-', ' ,', '- '], {
//       vt: vt,
//       finalvalue: val,
//       duration: duration,
//       cb: next })
//   } })
// }
/*
function animElContent (el, list, opt) {
  opt = opt || {}
  let i = 0
  let idx = opt.vt && opt.vt.msgidx
  let end = () => {
    clearInterval(loop)
    if (opt.finalvalue) {
      el.innerHTML = opt.finalvalue
    }
    if (opt.cb) {
      opt.cb()
    }
  }
  let loop = setInterval(() => {
    if (opt.vt && opt.vt.msgidx !== idx) end()
    else el.innerHTML = list[i++ % list.length]
  }, opt.period || 100)
  if (opt.duration) {
    setTimeout(() => {
      if (!opt.vt || opt.vt.msgidx === idx) end()
    }, opt.duration)
  }
}
*/
function badge (title, text) {
  const badge = addEl(EFFECTS.notifications, 'div', 'badge')
  const now = Date.now()
  const diff = EFFECTS.last_notify - now
  let uptimeout = 0
  if (diff > 0) {
    uptimeout = diff
  }
  const disappeartimeout = uptimeout + (EFFECTS.timeout.badge / 2)
  const downtimeout = uptimeout + EFFECTS.timeout.badge
  setTimeout(function () {
    EFFECTS.notifications.removeChild(badge)
  }, downtimeout)
  setTimeout(function () {
    badge.className += ' disappear'
  }, disappeartimeout)
  setTimeout(function () {
    EFFECTS.pic.badge.render(badge)
    addEl(badge, 'span', 'badge-title').innerHTML = title
    addEl(badge, 'p', 'badge-desc').innerText = text
  }, uptimeout)
  EFFECTS.last_notify = now + downtimeout
}

function notification (text) {
  const notif = addEl(EFFECTS.notifications, 'div', 'notification')
  const now = Date.now()
  const diff = EFFECTS.last_notify - now
  let uptimeout = 0
  if (diff > 0) {
    uptimeout = diff
  }
  const disappeartimeout = uptimeout + (EFFECTS.timeout.notifation / 2)
  const downtimeout = uptimeout + EFFECTS.timeout.notification
  setTimeout(function () {
    EFFECTS.notifications.removeChild(notif)
  }, downtimeout)
  setTimeout(function () {
    notif.className += ' disappear'
  }, disappeartimeout)
  setTimeout(function () {
    addEl(notif, 'p').innerHTML = text
  }, uptimeout)
  EFFECTS.last_notify = now + downtimeout
}

/* BELOW ALL EFFECTS THAT REQUIRE VTerm */
function showEpicImg (vt, i, clss, scrldelay, callback) {
  vt.scrl_lock = true
  vt.busy = true
  const c = addEl(vt.monitor, 'div', 'img-container ' + clss)
  vt.mkImg({ img: i }).render(c, () => {
    console.log('nenene')
    c.className += ' loaded'
    setTimeout(() => {
      vt.scrl_lock = false
      vt.scrl()
      vt.busy = false
      if (callback) {
        callback(vt)
      }
    }, scrldelay)
  })
}

function autoShuffleLine (t, msg, fromcomplexicity, tocomplexicity, stepcomplexity, period, duration, incstep) {
  const idx = t.msgidx
  msg = msg || t.input.value
  if (t.input_operation_interval) {
    clearInterval(t.input_operation_interval)
  }
  let inccnt = 0
  let tmpc = fromcomplexicity
  const sens = (tocomplexicity > fromcomplexicity ? 1 : -1)
  const limit = tocomplexicity * sens
  const step = (tocomplexicity - fromcomplexicity) / stepcomplexity
  const line_sh = shuffleStr(msg, tmpc)
  const len = line_sh.lenght
  t.input_operation_interval = setInterval(() => {
    if (t.msgidx !== idx) {
      clearInterval(t.input_operation_interval)
      t.line = ''
    } else {
      if (((tmpc * sens) < limit) && ((inccnt % incstep) === 0)) {
        tmpc = tmpc + step
      }
      const line_sh = shuffleStr(msg, tmpc)
      if (tmpc > tocomplexicity) line = setChr(line, inccnt % msg.length, '###')
      else clearInterval(t.input_operation_interval)
      t.line = line
      CursorListener.fire(line.charAt(0), line.lenght)
      inccnt++
    }
  }, period)
  if (duration) {
    setTimeout(function () {
      if (idx === t.msgidx) {
        clearInterval(t.input_operation_interval)
      }
    }, duration)
  }
}
