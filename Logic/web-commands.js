// web-commands.js
// ========

function buildDevicesInfo(adbDevicesOutput,exec,adbCommandStrings,res) {
	let lines = adbDevicesOutput.split("\r\n");
	lines.splice(0,1);
	let devices = [];
	lines.forEach(function(value, index, array){
		if(value !== ''){
			let phoneAndInfo = value.split(/\s+/);
			let deviceId = phoneAndInfo[0];
			let phoneModel = phoneAndInfo[3].split(':')[1];
			devices.push(
				{
					'id':deviceId,
					'model':phoneModel
				}
			);
		}
	});
	console.log(devices);
	let promises = [];
	devices.forEach(function(device, index) {
		promises.push(new Promise(function(resolve,reject){
			exec('adb -s '+device['id']+' '+adbCommandStrings.deviceIpAddressCommand,function(error,stdout,stderror){
				let tuple = '(';
				tuple+=device['id']+':'+device['model'];
				if(!error){
					if(stdout.indexOf("does not exist")>-1){
						tuple+=':NO IP ON WLAN0';
					} else {
						let ips = stdout.split(' ').filter((ele) => {return ele.indexOf('/24') !== -1});
						tuple+=':'+ips[0];
					}
				}
				tuple+=')';
				resolve(tuple);
			});
		}));
	});
	Promise.all(promises).then(function(values){
		console.log(values);
		res.send("LISTING DEVICES!\nInfo:"+values);
	});
	
}

module.exports = {

	set : function(sessionData,req,res) {
	  var lCounter = req.query.counter;
	  var lUntil = req.query.until;
	  var lChoosenTest = req.query.choosenTest;
	  var lFullName = req.query.fullName;
	  var lDevice = req.query.device;
	  var lLang = "Java"
	  var errors = "";
	  var lSort = req.query.sort;
	  var workload = req.query.workload;
	  var nThreads = req.query.nThreads;

	  var debug = "";

	sessionData.language= lLang;

	  if(lCounter != undefined){
	    var counter = parseInt(lCounter);
	    if(counter<1)
	      errors+="Initial counter value is below allowed range ";
	    else if (counter>=sessionData.counter.until)
	      errors+="Initial counter must be lower than final counter ";
	    else
	      sessionData.counter.current=counter;
	  }
	  if(lUntil != undefined){
	    var finalCounter = parseInt(lUntil);
	    if(finalCounter<1)
	      errors+="Final counter value is below allowed range ";
	    else if (finalCounter<=sessionData.counter.current)
	      errors+="Final counter must be greater than initial counter ";
	    else
	      sessionData.counter.until=finalCounter;
	  }
	  if(lChoosenTest != undefined){
	  	sessionData.currentTest.value=lChoosenTest;
	  	sessionData.currentTest.name=lFullName;
	  }
	  if(lSort != undefined){
	  	sessionData.sort=lSort;
	  }
	  if(lDevice != undefined)
	    sessionData.device=lDevice;

	  var checkOnlyNumbers = new RegExp("^[0-9]+$");
	  if(workload) {
	  	if(checkOnlyNumbers.test(workload))
	  		sessionData.workload=workload;
	  	else {
	  		errors += "\n Workload needs to be a number";
	  	}
	  }

	  if(nThreads) {
	  	if(checkOnlyNumbers.test(nThreads))
	  		sessionData.nThreads=nThreads;
	  	else {
	  		errors += "\n Threads needs to be a number";
	  	}
	  }

	  if(errors != "")
	    res.send("Error: FOUND ERRORS CHANGING SETTINGS!\nInfo:"+errors);
	  else
	    res.send("SETTINGS CHANGED OK! " + debug);
	},
	stop : function(exec, adbCommandStrings, sessionData, res) {
		sessionData.fullRun = false;
		exec(adbCommandStrings.killApp, function(error, stdout, stderr) {
		    if(error != null)
		      res.send(error+"\n"+stdout+"\n"+stderr); 
		    else {
		      sessionData.stop=true;
		      res.send("STOP OK!\nInfo:"+stdout);
		   }
		});
	},
	start : function(exec, adbCommandStrings, sessionData, res) {
		exec(adbCommandStrings.startApp(sessionData.currentTest.value, sessionData.workload, sessionData.nThreads), 
			function(error, stdout, stderr) {
			    if(error != null)
			     res.send(error+"\n"+stdout+"\n"+stderr); 
			    else {
			      sessionData.stop=false;
			      res.send("START OK!\nInfo:"+stdout);
			   	}
			}
		);
	},
	fullRun : function(exec, adbCommandStrings, sessionData, res) {
		sessionData.fullRun = true;
		exec(adbCommandStrings.startApp(sessionData.currentTest.value), function(error, stdout, stderr) {
		    if(error != null)
		     res.send(error+"\n"+stdout+"\n"+stderr); 
		    else {
		      sessionData.stop=false;
		      res.send("START OK!\nInfo:"+stdout);
		   }
		});
	},
	info : function(sessionData,res) {
		res.send(sessionData);
	},
	listDevices : function(exec,adbCommandStrings,res){
		exec(adbCommandStrings.listDevices, function(error, stdout, stderr) {
		    if(error != null)
		    	res.send(error+"\n"+stdout+"\n"+stderr); 
		    else {
		  		buildDevicesInfo(stdout,exec,adbCommandStrings,res);
		   }
		});
	},
	showDeviceIpAddress : function(exec,adbCommandStrings,res){
		exec(adbCommandStrings.showDeviceIpAddress, function(error, stdout, stderr) {
		    if(error != null)
		     res.send(error+"\n"+stdout+"\n"+stderr); 
		    else {
		      res.send("DEVICE IP ADDRESS!\nInfo:"+stdout);
		   }
		});
	},
	wakeUpDevice : function(exec,adbCommandStrings,res){
		exec(adbCommandStrings.wakeUpDevice, function(error, stdout, stderr) {
		    if(error != null)
		     res.send(error+"\n"+stdout+"\n"+stderr); 
		    else {
		      res.send("DEVICE WOKE UP!\nInfo:"+stdout);
		   }
		});
	},
	installApk : function(exec, adbCommandStrings, filePath, targetDevice, res) {
		if(targetDevice && filePath) {
			exec(adbCommandStrings.installApk(filePath, targetDevice), function(error, stdout, stderr) {
				if(error != null)
					res.send(error+"\n"+stdout+"\n"+stderr); 
				else {
					res.send("Apk successfully installed!\nInfo:"+stdout);
				}
			});
		} else {
			res.send("Make sure the target device and the file path are set!");
		}
	}
};