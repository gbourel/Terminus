/* light dom manipulation and common type testing tool */
export var dom = document;
dom.Id = dom.getElementById;
dom.El = dom.createElement;

export function addBtn(root, clss, txt, title, fun) {
	var el = dom.El("button");
	if (def(clss)) {
		el.className = clss;
	}
	if (def(title)) {
		el.title = title;
	}
	if (def(txt)) {
		el.innerHTML = "<span>" + txt + "</span>";
	}
	if (def(fun)) {
		el.onclick = fun;
	}
	root.appendChild(el);
	return el;
}
// input specific - from js fiddle
//function findWord(str,pos){
//    var words=str.split(' ');
//    var offset=0;
//    var i;
//    for(i=0;i<words.length;i++){
//        offset+=words[i].length+1;
//        if (offset>pos) break;
//
//    }
//    return words[i];
//}
export function prEl(root, tag, attrs) {
	var el = dom.El(tag);
	root.prepend(el);
	var ty = typeof attrs;
	if (ty == "string") {
		el.className = attrs;
	} else if (ty == "object") {
		addAttrs(el, attrs);
	}
	return el;
}
export function addEl(root, tag, attrs) {
	var el = dom.El(tag);
	root.appendChild(el);
	var ty = typeof attrs;
	if (ty == "string") {
		el.className = attrs;
	} else if (ty == "object") {
		addAttrs(el, attrs);
	}
	return el;
}
export function span(cls, content) {
	return "<span class='" + cls + "'>" + content + "</span>";
}
export function injectProperties(obj1, obj2) {
	for (var i in obj2) {
		if (obj2.hasOwnProperty(i)) {
			obj1[i] = obj2[i];
		}
	}
}
/**
 * Union obj1's values with obj2's and adds obj2's if non existent in obj1
 * @param obj1
 * @param obj2
 * @returns obj3 a new object based on obj1 and obj2
 */
export function union(obj1, obj2) {
	var obj3 = {};
	for (var attrname in obj1) {
		obj3[attrname] = obj1[attrname];
	}
	for (var attrname in obj2) {
		obj3[attrname] = obj2[attrname];
	}
	return obj3;
}
export function almostEqual(a, delta, b) {
	if (a == b) {
		return true;
	} else if (a > b) {
		return b + delta > a;
	} else {
		return a + delta > b;
	}
	return false;
}
export function addAttrs(el, attrs) {
	for (var i in attrs) {
		if (attrs.hasOwnProperty(i)) {
			el.setAttribute(i, attrs[i]);
		}
	}
	return el;
}
export function objToStr(o) {
	return o.toString();
}
var eui = 0;
export function clone(obj) {
	eui++;
	if (null == obj || "object" != typeof obj) return obj;
	var copy = obj.constructor();
	for (var attr in obj) {
		if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
	}
	return copy;
}
export function d(v, w) {
	return typeof v === "undefined" ? w : v;
}
export function anyStr(v, w) {
	return typeof v === "string" ? v : typeof w == "string" ? w : null;
}
export function aStrArray(v) {
	return typeof v === "string" ? [v] : v && v.length ? v : [];
}
export function rmIdxOf(l, str) {
	index = l.indexOf(str);
	return index === -1 ? null : l.splice(index, 1);
}
export function isStr(v) {
	return typeof v === "string";
}
export function isObj(v) {
	return typeof v === "object";
}
export function def(v) {
	return typeof v !== "undefined";
}
export function ndef(v) {
	return typeof v === "undefined";
}
export function pushDef(v, h) {
	if (typeof v !== "undefined") {
		h.push(v);
		return true;
	}
	return false;
}
export function cntUp(h, k) {
	if (ndef(h[k])) {
		h[k] = 1;
	} else {
		h[k]++;
	}
}
export function hdef(h, k, v) {
	if (ndef(h[k])) {
		h[k] = [];
	}
	h[k].push(v);
}
//String.prototype.replaceAll = function(from, to){
//  ret = this.toString();
//  while (ret.indexOf(from) > 0){
//    ret = ret.replace(from, to);
//  }
//  return ret;
//};
export function randomSort() {
	return 0.5 - Math.random();
}
export function shuffleStr(src, complexity) {
	var randsArr = "!@#$)~_(%^&.abcdefghijklmnopqrstuvwxyz -0123456789"
		.repeat(src.length / 10 + 1)
		.split("")
		.sort(randomSort);
	var ret = "";
	for (var i = 0; i < src.length; i++) {
		ret += Math.random() > complexity ? src[i] : randsArr.shift();
	}
	return ret;
}
export function randomStr(length) {
	var randsArr = ". abcdefghijklmnopqrstuvwxyz -0123456789"
		.repeat(length)
		.split("")
		.sort(randomSort);
	var ret = randsArr.slice(0, length).join("");
	return ret;
}
let function_queue = [];
export function Seq() {
	this.function_queue = [];
}
Seq.prototype = {
	then: function (fu) {
		this.function_queue.push(fu);
	},
	next: function () {
		let t = this;
		let fu = t.function_queue.shift();
		if (fu) {
			fu(function () {
				t.next();
			});
			return true;
		}
		return false;
	},
};
