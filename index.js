var express = require('express');
var url     = require('url');
var http    = require('http');
var fs      = require('fs');
var path    = require('path');
var exec    = require('child_process').exec;
var wc      = require('./Logic/web-commands.js');
var ac      = require('./Logic/app-commands.js');
var app     = express();

app.use(express.static(__dirname + '/View'));
var myIpAddress='192.168.0.3';
var myPort=3000;
var targetDeviceIP='';


process.argv.forEach(function(val, index, array) {
  if(index === 2){
    myPort = val;
  }
  if(index === 3) {
    targetDeviceIP = val;
    console.log('Target device ip set to: '+targetDeviceIP);
  }
  if(index === 4) {
    myIpAddress = val;
    console.log('As informed by the user, my ip address is: '+myIpAddress);
  }
});

function targetDevice() {
  if(targetDeviceIP) {
    return '-s '+targetDeviceIP;
  } else {
    return '';
  }
}

var adbCommandStrings = {
  cleanBatteryStats : "adb "+targetDevice()+" shell dumpsys batterystats --reset",
  outputBatteryStatsTo : function(destiny){
    return "adb "+targetDevice()+" shell dumpsys batterystats > "+destiny;
  },
  listDevices : "adb devices -l",
  deviceIpAddressCommand: "shell ip -f inet addr show wlan0",
  showDeviceIpAddress : "adb shell ip -f inet addr show wlan0",
  wakeUpDevice : "adb "+targetDevice()+" shell input keyevent KEYCODE_WAKEUP",
  startApp : function(collection, workload, nThreads){ 
    let result = "adb "+targetDevice()+" shell am start -n cin.ufpe.br.energyprofiler/.MainActivity"+
    " -e param "+collection+
    " -e ipAddress "+myIpAddress+
    " -e port "+myPort;
    if(workload) {
      result += " -e workload "+workload;
    }
    if(nThreads) {
      result += " -e nThreads "+nThreads;
    }
    return result;
  },
  getAppPid : "adb "+targetDevice()+" shell pgrep cin.ufpe.br.energyprofiler",
  killApp : "adb "+targetDevice()+" shell am force-stop cin.ufpe.br.energyprofiler",
  installApk : function(filePath, targetDevice) {
    return `adb ${targetDevice} install ${filePath}`;
  }
};


 // appCommands : { 
 //   Java : { 
 //     startApp : "adb shell monkey -p com.example.woj.happynumbers -c android.intent.category.LAUNCHER 1",
 //     getAppPid : "adb shell pgrep com.example.woj.happynumbers",
 //     killApp : "adb shell am force-stop com.example.woj.happynumbers"
 //   },  
 //   Javascript : {
 //     startApp : "adb shell monkey -p com.sieve -c android.intent.category.LAUNCHER 1",
 //     getJAppPid : "adb shell pgrep com.sieve",
 //     killApp : "adb shell am force-stop com.sieve"
 //   },
 //   NDK : { 
  //    startApp : "adb shell monkey -p com.example.renato.happynumbersnative -c android.intent.category.LAUNCHER 1",
 //     getAppPid : "adb shell pgrep com.example.renato.happynumbersnative",
 //     killApp : "adb shell am force-stop com.example.renato.happynumbersnative"
 //   } 
 // }
//}

var algorithms = {

	ARRAY_LIST : {value :"al", name: "Array List"},
	VECTOR : {value: "vec", name: "Vector"},
	COPY_WRITE_ARRAY_LIST : {value: "cwal", name: "Copy Write Array List"},
	CONCURRENT_HASH_MAP : {value: "chm", name: "Concurrent Hash Map" },
	HASH_TABLE : {value: "ht", name: "Hash Table" },
	SYNC_MAP : {value: "sm", name: "Sync Map" },
	CONCURRENT_SKIP_LIST_MAP : {value: "cslm", name: "Concurrent Skip List Map" },
	SYNC_LIST : {value: "sl", name: "Sync List" }
};

var sessionData = {
  currentTest : {value : "vec" , name: "Vector"},
  counter : {current: 1, until : 30},
  device : "S8",
  language : "Java",
  stop : true,
  sort : "Disabled",
  fullRun : false,
  workload: undefined,
  nThreads: undefined
};

/*
USED BY THE APP
*/
app.get('/what_now', function (req, res) {
  ac.whatNow(exec,adbCommandStrings,sessionData,res);
});
app.get('/collections', function (req, res) {
  ac.collections(exec,adbCommandStrings,sessionData,res,http,fs,myPort);
});
app.get('/sorting', function (req, res) {
  ac.sorting(exec,adbCommandStrings,sessionData,res,http,fs,myPort);
});
app.get('/cleanbattery', function (req, res) {
  ac.cleanbattery(exec,adbCommandStrings,res);
});
app.get('/logdata', function (req, res) {
  ac.logdata(exec,adbCommandStrings,sessionData,res,http,fs,myPort);
});
/*****************/

/**
USED BY THE WEB APPLICATION
*/
app.get('/', function (req, res) {
  res.sendFile('index.html');
});

app.get('/start', function (req, res) {
  wc.start(exec,adbCommandStrings,sessionData,res);
});
app.get('/full_run', function (req, res) {
  wc.fullRun(exec,adbCommandStrings,sessionData,res);
});
app.get('/stop', function (req, res) {
  wc.stop(exec,adbCommandStrings,sessionData,res);
});
app.get('/info', function (req, res) {
  wc.info(sessionData,res);
});
app.get('/set', function (req, res) {
  wc.set(sessionData,req,res);
});
app.get('/list_devices', function (req, res) {
  wc.listDevices(exec,adbCommandStrings,res);
});
app.get('/show_device_ip_address', function (req, res) {
  wc.showDeviceIpAddress(exec,adbCommandStrings,res);
});
app.get('/wake_up_device', function (req, res) {
  wc.wakeUpDevice(exec,adbCommandStrings,res);
});
app.get('/install_apk', function (req, res) {
  wc.installApk(exec, adbCommandStrings, req.query.file_path, targetDevice(), res);
});
/*********************/

app.listen(myPort, function () {
  console.log('Dashboard app listening on port '+myPort+'!');
});

