var user = { groups: [], name: "", address: "" };

function _setUserName(state, val) {
	if (val.length) user.name = val;
	state.set("usr", user.name);
}
function _setUserAddress(state, val) {
	if (val.length) user.address = val;
	state.set("adr", user.address);
}
function _addGroup(grp) {
	user.groups.push(grp);
}
function _hasGroup(grp) {
	return user.groups.indexOf(grp) > -1;
}
