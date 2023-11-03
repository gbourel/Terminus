import { dom, addBtn, prEl, addEl, span, injectProperties, union, almostEqual, addAttrs, objToStr, clone, d, anyStr, aStrArray, rmIdxOf, isStr, isObj, def, ndef, pushDef, cntUp, hdef, randomSort, shuffleStr, randomStr, Seq } from "./js.js";

var test_sequence = new Seq();
function do_test() {
	test_sequence.next();
}
function add_test(fu) {
	TESTING = true;
	test_sequence.then(fu);
}
