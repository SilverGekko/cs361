var exec = require('child_process').exec;

function check_guns_before(callback1, callback2){
	exec("cd ./imageTrainer; rm -f out_image*");
    exec("ls ./imageTrainer", function(error, stdout, stderr){ callback1(stdout, callback2); });
};

function check_guns_after(old_stdout, callback){
    exec("cd ./imageTrainer; run_matlab"); 
	setTimeout(function() {
    	exec("ls ./imageTrainer", function(error, stdout, stderr){ 
			callback(old_stdout, stdout);	
		});
	}, 45000);
};

function compare_output(before, after) {
	if (before == after) {
		console.log("same");
	} else {
		console.log("not same");
	}
};

function parse_data(data) {
	console.log(data);
};

check_guns_before(check_guns_after, compare_output);
