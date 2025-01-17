add_test(function (next) {
	console.log("TEST CMD GREP");
	user.addGroup("grep");
	vt.set_line("cd ~");
	vt.enter();
	vt.set_line("grep cd Palourde");
	vt.enter();
	setTimeout(next, 1000);
});

add_test(function (next) {
	console.log("TEST CMDS TOUCH, COPY, MKDIR, MV, RM");
	user.addGroup("cp");
	user.addGroup("mkdir");
	user.addGroup("mv");
	user.addGroup("rm");
	user.addGroup("touch");

	vt.set_line("cd ~");
	vt.enter();
	vt.set_line("touch fic_test_a");
	vt.enter();
	vt.set_line("cp fic_test_a fic_test_b");
	vt.enter();
	vt.set_line("mkdir dir_test_a");
	vt.enter();
	vt.set_line("ls");
	vt.enter();
	vt.set_line("mv fic_test_* dir_test_a");
	vt.enter();
	vt.set_line("rm dir_test_a/fic_test_b");
	vt.enter();
	vt.set_line("ls");
	vt.enter();
	vt.set_line("ls dir_test_a");
	vt.enter();
	setTimeout(next, 1000);
});
