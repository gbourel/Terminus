export const user = {
	groups: [],
	name: "",
	address: "",
	setName: function (state, val) {
		if (val.length) user.name = val;
		state.set("usr", user.name);
	},
	setAddress: function (state, val) {
		if (val.length) user.address = val;
		state.set("adr", user.address);
	},
	addGroup: function (grp) {
		user.groups.push(grp);
	},
	hasGroup: function (grp) {
		return user.groups.indexOf(grp) > -1;
	},
};
