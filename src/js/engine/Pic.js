import { dom, addBtn, prEl, addEl, span, injectProperties, union, almostEqual, addAttrs, objToStr, clone, d, anyStr, aStrArray, rmIdxOf, isStr, isObj, def, ndef, pushDef, cntUp, hdef, randomSort, shuffleStr, randomStr, Seq } from "./js.js";

export function Pic(src, prop) {
	this.src = src;
	prop = d(prop, {});
	this.img_dir = d(prop.img_dir, "./img/"); // shall contains last slash './img/'
	this.cls = prop.cls;
	this.shown_in_ls = d(prop.pic_shown_in_ls, true);
	this.shown_as_item = d(prop.pic_shown_as_item, false);
	this.image_class = d(prop.image_class, "");
	this.index = d(prop.index, 0);
	this.children = prop.children || {};
}
function PicLayers(pic, cont, onload) {
	this.pic = pic;
	this.cont = cont;
	this.onload = onload;
	this.reverseX = false;
	this.reverseY = false;
	this.image_class = d(pic.image_class, "");
	this.othercls = "";
	this.offset = [0, 0];
	this.gravity_coef = 1;
	this.offset_prop = {
		grid: null,
		val: [0, 0],
		unit: ["%", "%"],
		prop: ["left", "bottom"],
		range: [
			[0, 100],
			[0, 100],
		],
	};
}
function PlatformGrid(matrix, range) {
	var stepsize_x = (range[0][1] - range[0][0]) / matrix[0].length,
		stepsize_y = (range[1][1] - range[1][0]) / matrix.length;
	this.matrix = matrix;
	this.x = stepsize_x;
	this.y = stepsize_y;
	this.range = range;
}

PlatformGrid.prototype.check = function (x, y, w, h) {
	var ret = false;
	if (
		x >= this.range[0][0] &&
		y >= this.range[1][0] &&
		x + w <= this.range[0][1] &&
		y + h <= this.range[1][1]
	) {
		var cy = Math.floor(y / this.y),
			cx = Math.floor(x / this.x),
			ctoy = Math.floor((y + h) / this.y),
			ctox = Math.floor((x + w) / this.x);
		if (cy >= 0 && cx >= 0 && cy < this.matrix.length) {
			ret = true;
			for (var j = cy; j <= ctoy; j++) {
				for (var i = cx; i <= ctox; i++) {
					ret = ret && this.matrix[j][i] == 0;
				}
			}
		}
	}
	return ret;
};
PicLayers.prototype = {
	_setOffset: function (x, y) {
		var o = this.offset_prop;
		var nowall =
			!o.grid ||
			o.grid.check(
				x,
				y,
				(this.cont.offsetWidth * 100) / this.cont.parentNode.offsetWidth,
				0, // don't care about height
				//      (t.cont.offsetHeight*100/t.cont.parentNode.offsetHeight)
			);
		if (nowall) {
			this.offset = [x, y];
			this.cont.setAttribute(
				"style",
				//        'box-sizing:border-box;border:1px solid pink;'+
				o.prop[0] +
					":" +
					this.offset[0] +
					o.unit[0] +
					";" +
					o.prop[1] +
					":" +
					this.offset[1] +
					o.unit[1] +
					";",
			);
			this.cont.className =
				"layers " +
				this.image_class +
				this.othercls +
				(this.reverseX ? " reverseX" : "") +
				(this.reverseY ? " reverseY" : "");
			if (this.gravity && !this.falling) this.gravity();
			return true;
		} else {
			return false;
		}
	},
	collide: function (a) {
		var parw = this.cont.parentNode.offsetWidth;
		var parh = this.cont.parentNode.offsetHeight;
		var x1 = this.offset[0],
			y1 = this.offset[1],
			h1 = (this.cont.offsetHeight * 100) / parh,
			w1 = (this.cont.offsetWidth * 100) / parw,
			x2 = a.offset[0],
			y2 = a.offset[1],
			h2 = (a.cont.offsetHeight * 100) / parh,
			w2 = (a.cont.offsetWidth * 100) / parw;
		return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && h1 + y1 > y2;
	},
	setPlatformGrid: function (m, range) {
		this.offset_prop.grid = new PlatformGrid(
			m,
			range || this.offset_prop.range,
		);
	},
	getPlatformGrid: function (m) {
		return this.offset_prop.grid;
	},
	fallTo: function (vals, steps, interval, cb) {
		var t = this;
		var x,
			y,
			cx,
			cy,
			o = t.offset_prop,
			of,
			down = steps[1] < 0;
		if (!t.falling || steps[1] == 0) {
			t.falling = true;
			var it = function () {
				if (steps[0] || steps[1]) {
					x = t.offset[0] + steps[0];
					y = t.offset[1] + steps[1];
					//          console.log(offset,steps);
					nowall = t._setOffset(x, y);
					cx = steps[0] != 0 && Math.sign(steps[0]) * x < vals[0];
					cy = steps[1] != 0 && Math.sign(steps[1]) * y < vals[1];
					//          console.log([x,y],[Math.sign(steps[0])*x,Math.sign(steps[1])*y],vals,[cx,cy]);
					if (!nowall) {
						nowall = t._setOffset(t.offset[0], y);
						if (nowall) {
							steps[0] = 0;
							cx = false;
						}
					}
					if (!nowall) {
						nowall = t._setOffset(x, t.offset[1]);
						if (nowall) {
							steps[1] = 0;
							cy = false;
						}
					}
					if (nowall && (cy || cx)) {
						setTimeout(it, interval);
					} else {
						t.falling = false;
						if (cb) cb(t, x, y);
						if (t.gravity && !down) t.gravity();
					}
				}
			};
			it();
		}
	},
	fallToY: function (y, step, interval, cb) {
		this.fallTo([this.offset[0], y], [0, step], interval, cb);
	},
	fallToX: function (x, step, interval, cb) {
		this.fallTo([x, this.offset[1]], [step, 0], interval, cb);
	},
	setOffsetProp: function (o) {
		this.offset_prop = union(this.offset_prop, o);
	},
	setOffset: function (offset) {
		return this._setOffset(offset[0], offset[1]);
	},
	setOffsetDelta: function (xd, yd) {
		yd = yd * this.gravity_coef;
		return this._setOffset(this.offset[0] + xd, this.offset[1] + yd);
	},
	setOffsetDeltaX: function (xd) {
		return this._setOffset(this.offset[0] + xd, this.offset[1]);
	},
	setOffsetDeltaY: function (yd) {
		yd = yd * this.gravity_coef;
		return this._setOffset(this.offset[0], this.offset[1] + yd);
	},
	setOffsetDeltaXStepped: function (xd, step, interval, cb) {
		this.fallTo([this.offset[0] + xd, this.offset[1]], [step, 0], interval, cb);
	},
	setOffsetDeltaYStepped: function (yd, step, interval, cb) {
		yd = yd * this.gravity_coef;
		this.fallTo([this.offset[0], this.offset[1] + yd], [0, step], interval, cb);
	},
	getOffset: function () {
		return this.offset;
	},
	getOffsetProp: function () {
		return this.offset_prop;
	},
	update: function () {
		var cont = this.cont,
			onload = this.onload;
		//  ,over=t.over,behind=t.behind;
		//  over.innerHTML="";
		//  behind.innerHTML="";
		cont.innerHTML = "";
		cont.className =
			"layers " +
			this.pic.image_class +
			" " +
			this.othercls +
			(this.reverseX ? " reverseX" : "") +
			(this.reverseY ? " reverseY" : "");
		var over = addEl(cont, "div", {
			class: "foreground",
			"aria-hidden": "true",
		});
		var behind = addEl(cont, "div", {
			class: "background",
			"aria-hidden": "true",
		});
		if (this.pic.src) {
			addEl(cont, "img", {
				class: "main " + (this.pic.cls || "") + " " + (this.pic.tmpcls || ""),
				src: this.pic.img_dir + this.pic.src,
				"aria-hidden": "true",
			}).onload = onload;
			delete this.pic.tmpcls;
		}
		var cnt = 0;
		for (var name in this.pic.children) {
			if (this.pic.children.hasOwnProperty(name)) {
				var childpic = this.pic.children[name];
				if (
					childpic.render_as_child(childpic.index < 0 ? behind : over, cnt + 1)
				) {
					cnt++;
				}
			}
		}
	},
};
Pic.prototype = {
	set: function (src) {
		this.src = src;
	},
	setOneShotRenderClass: function (cls) {
		this.tmpcls = cls;
	},
	setImgClass: function (cls) {
		this.image_class = cls;
	},
	copy: function (children) {
		return new Pic(this.src, {
			img_dir: this.img_dir,
			cls: this.cls,
			shown_in_ls: this.shown_in_ls,
			image_class: this.image_class,
			children: clone(this.children),
		});
	},
	addChildren: function (children) {
		for (var name in children) {
			if (children.hasOwnProperty(name)) {
				this.children[name] = children[name];
			}
		}
	},
	setChild: function (name, child, prop) {
		var ret = !this.children.hasOwnProperty(name);
		this.children[name] = isStr(child)
			? new Pic(child, union(prop, { cls: "livelayer" }))
			: child;
		return ret;
	},
	unsetChild: function (name) {
		delete this.children[name];
	},
	exists: function () {
		return this.src || this.children.length;
	},
	render_as_child: function (cont, cnt) {
		if (this.src) {
			addEl(cont, "img", {
				class:
					"layer layer-" +
					cnt +
					" " +
					(this.cls || "") +
					" " +
					(this.tmpcls || ""),
				src: this.img_dir + this.src,
				"aria-hidden": "true",
			});

			for (var name in this.children) {
				if (this.children.hasOwnProperty(name)) {
					var childpic = this.children[name];
					childpic.render_as_child(cont, cnt);
				}
			}
			delete this.tmpcls;
			return true;
		}
		return false;
	},
	render: function (c, onload) {
		if (this.exists()) {
			var cont = addEl(c, "div", "layers");
			cont.onload = onload;
			//      console.log(t.image_class);
			var picl = new PicLayers(this, cont, onload);
			picl.update();
			return picl;
		}
		return null;
	},
};
