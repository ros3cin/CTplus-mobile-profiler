// app-commands.js
// ========

var actionsList = ["put-beg","rem-beg","put-mid","rem-mid","put-end","rem-end","put","get","get-ite","get-rdm","rem-obj"]
var actionsMap = ["put-beg","get","get-ite","rem-beg"]
var actionsSet = ["put-beg","get-ite","rem-beg"]

var actions;

var list = ["al","ll","fl","tl","ncll","cll","vec","cwal","sl","sal","sfl"];
var listName = ["ArrayList","LinkedList","FastList","TreeList","NodeCachingLinkedList","CursorableLinkedList",
"Vector","CopyWrite ArrayList","Sync List","Sync ArrayList","Sync FastList"];

var set = ["hs","lhs","ts","us","tss","shs","slhs","sts","cwas","csls","schm","schmv8","sus","stss"];
var setName = ["HashSet","LinkedHashSet","TreeSet","UnifiedSet","TreeSortedSet","Sync HashSet",
"Sync LinkedHashSet","Sync TreeSet","CopyWrite ArraySet","Concurrent SkipListSet",
"SetConcurrent HashMap","SetConcurrent HashMapV8","Sync UnifiedSet","Sync TreeSortedSet"];

var map = ["hm","lhm","tm","whm","um","hsdm","ht","chm","cslm","shm","slhm","stm","swhm","chmv8","chmec","sum","sbm"];
var mapName = ["HashMap","LinkedHashMap","TreeMap","WeakHashMap","UnifedMap","HashedMap",
"HashTable","Concurrent HashMap","Concurrent SkipListMap","Sync HashMap","Sync LinkedHashMap",
"Sync TreeMap","Sync WeakHashMap","Concurrent HashMapV8","Concurrent HashMapEC",
"Sync UnifiedMap","StaticBucketMap"];

var actionsIndx;

var sort = ["def","bub","heap","ins","mer","qui","sel","she"]; //"sha" is not currently implemented3 

var index = 0;

function createDirIfNotExists(fs,dir){
	if (!fs.existsSync(dir)){
		fs.mkdirSync(dir);
	}
}
function callStartApp(http,myPort){
	http.get({host:'localhost', port:myPort, path:'/start'},function(resp){}).on("error",function(e){console.log(e.message)});
}
module.exports = {
	whatNow : function(exec,adbCommandStrings,sessionData,res){
		index = 0;
		if(sessionData.sort === "Enabled"){
			actions = sort;	
		}
		else if(list.includes(sessionData.currentTest.value)){
			actions = actionsList;
		}
		else if(set.includes(sessionData.currentTest.value)){
			actions = actionsSet;
		}
		else if(map.includes(sessionData.currentTest.value)){
			actions = actionsMap;
		}
		exec(adbCommandStrings.cleanBatteryStats, function(error, stdout, stderr) {
		  	res.send(actions[index]);	
		  });
	},
	logdata : function(exec,adbCommandStrings,sessionData,res,http,fs,myPort){
		

		var actualIndex = index;
		var fileName = sessionData.currentTest.value+"-"+actions[actualIndex]+"-"+sessionData.device+"-"+sessionData.counter.current+".txt";
		createDirIfNotExists(fs,'experiment-results');
		createDirIfNotExists(fs,'experiment-results/'+sessionData.device);
		var dir = 'experiment-results/' + sessionData.device + '/' + sessionData.currentTest.value;
		createDirIfNotExists(fs,dir);
		exec(adbCommandStrings.outputBatteryStatsTo(dir+'/'+fileName), function(error, stdout, stderr) {
			fs.appendFile(dir+'/'+fileName,"\r\nWorkload:"+sessionData.workload+"\r\nnThreads:"+sessionData.nThreads);
		});

		index++;

		res.send("logged");
	},
	collections : function(exec,adbCommandStrings,sessionData,res,http,fs,myPort){
		
		if(index < actions.length){
			exec(adbCommandStrings.cleanBatteryStats);
			res.send(actions[index]);	
		}else{
			exec(adbCommandStrings.cleanBatteryStats);
			res.send("done");
			index=0;
	  		sessionData.counter.current++;
	  		if( (sessionData.counter.current<=sessionData.counter.until) && (!sessionData.stop) ){
	  			setTimeout(function(){callStartApp(http,myPort)},3000);
	  		} else if (sessionData.fullRun && !sessionData.stop) {
	  			indexOnListCollection = list.indexOf(sessionData.currentTest.value);
	  			indexOnMapCollection = map.indexOf(sessionData.currentTest.value);
	  			indexOnSetCollection = set.indexOf(sessionData.currentTest.value);
	  			isAListCollection = indexOnListCollection > -1;
	  			isAMapCollection = indexOnMapCollection > -1;
	  			isASetCollection = indexOnSetCollection > -1;
	  			if( isAListCollection ) {
	  				if(indexOnListCollection < (list.length - 1) ) {
	  					sessionData.currentTest.value = list[indexOnListCollection+1];
	  					sessionData.currentTest.name = listName[indexOnListCollection+1];
	  				} else {
	  					sessionData.currentTest.value = map[0];
	  					sessionData.currentTest.name = mapName[0];
	  				}
	  				sessionData.counter.current=1;
	  				setTimeout(function(){callStartApp(http,myPort)},3000);
	  			} else if (isAMapCollection) {
	  				if(indexOnMapCollection < (map.length - 1) ) {
	  					sessionData.currentTest.value = map[indexOnMapCollection+1];
	  					sessionData.currentTest.name = mapName[indexOnMapCollection+1];
	  				} else {
	  					sessionData.currentTest.value = set[0];
	  					sessionData.currentTest.name = setName[0];
	  				}
	  				sessionData.counter.current=1;
	  				setTimeout(function(){callStartApp(http,myPort)},3000);
	  			} else if (isASetCollection) {
	  				if(indexOnSetCollection < (map.length - 1) ) {
	  					sessionData.currentTest.value = set[indexOnSetCollection+1];
	  					sessionData.currentTest.name = setName[indexOnSetCollection+1];
	  					sessionData.counter.current=1;
	  					setTimeout(function(){callStartApp(http,myPort)},3000);
	  				}
	  			}
	  		}
	  		exec(adbCommandStrings.killApp);
		}
	},
	sorting : function(exec,adbCommandStrings,sessionData,res,http,fs,myPort){

		sessionData.counter.current++;

		if( (sessionData.counter.current>sessionData.counter.until) && (!sessionData.stop)){
			res.send("Done:"+actions[index]);
			index++;
			if(index < actions.length){
				sessionData.counter.current = 1;
  				setTimeout(function(){callStartApp(http,myPort)},3000);
			}
			exec(adbCommandStrings.killApp);	  				
		}
		else if((sessionData.counter.current<=sessionData.counter.until) && (!sessionData.stop)){
			res.send("done");				
				setTimeout(function(){callStartApp(http,myPort)},3000);
				exec(adbCommandStrings.killApp);
		}
	},


	cleanbattery : function(exec,adbCommandStrings,res){
		exec(adbCommandStrings.cleanBatteryStats);
		res.send("cleaned");
	}
}
