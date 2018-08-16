var Service, Characteristic;

// "accessories": [
//   {
//     "accessory": "HomebridgeRevPiDIO",
//     "name": "RevPiDio Switch",
//     "output_name": "O_1"
//     "type": "switch"
//   }
// ]

// type is optional (default: "switch")
// ["switch", "light", "fan"]

const debugOut = 0;
const spawn = require('child_process').spawn;
const currentPath = process.cwd();
const pyFileOutputs = currentPath + '/homebridge-revpidio/liveoutputs.py';
const py = spawn('python3', [pyFileOutputs, this.output_name]);

var arrayCounter = 0;
var arrayModules = [];

py.stdout.on('data', function(data) {
   var retStr = data.toString().trim();
   retStr = data.toString().replace(/\r?\n|\r/g, "#");
   var compos = retStr.split("#");
   if (compos.length > 1) {
    for(var i = 0; i < compos.length/2;i++) {
       var idx = 2*i;
       var name = compos[idx];
       var stat = compos[idx+1];

       for (var idx in arrayModules) {
         var module = arrayModules[idx];
         if (module.output_name == name) {
           var newState = false;
           if (stat=="ON") {
             if (debugOut>1) { module.log(module.output_name + ' == ON'); }
             newState = true;
           } else if (stat=="OFF") {
             if (debugOut>1) { module.log(module.output_name + ' == OFF'); }
             newState = false;
           }

           if (module.hasCallback) {
               var callback = module.returnCallBack;
               module.returnCallBack = null;
               module.hasCallback = false;
               callback(null, newState);
           }
           break;
         }
       }
     }
   }
});


module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-revpidio", "RevPiDO", RevPiDO);
};

function RevPiDO(log, config) {
  log("Init RevPiDO [" + arrayCounter + "]");
  this.log = log;
  this.name = config["name"];
  this.output_name = config["output_name"];
  this.service_type = config["type"];
  if (!this.service_type) { this.service_type = "switch" }
  this.arrayIndex = arrayCounter;
  this.hasCallback = false;
  this.returnCallback = null;
  arrayModules.push(this);
  arrayCounter += 1;
  log("Done Init (" + this.output_name + ")");
}

RevPiDO.prototype = {

  getPowerState: function (next) {
    if (debugOut>2) { this.log(this.output_name + " GET_STATE?") }
    py.stdin.write(this.output_name+"#GET\n");
	  this.hasCallback = true;
    this.returnCallBack = next;
  },

  setPowerState: function(powerOn, next) {
    if (powerOn) {
		  if (debugOut>0) { this.log("SET_STATE " + this.output_name + " => ON"); }
      py.stdin.write(this.output_name+"#ON\n");
	  } else {
		  if (debugOut>0) { this.log("SET_STATE " + this.output_name + " => OFF"); }
      py.stdin.write(this.output_name+"#OFF\n");
	  }
    next(null);
  },

  getServices: function () {
    this.log("GetServices of " + this.output_name);
    var informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer, "KUNBUS")
      .setCharacteristic(Characteristic.Model, "Revolution Pi")
      .setCharacteristic(Characteristic.FirmwareRevision, "0.1.0");

    var theService
    if (this.service_type == "fan") {
      theService = new Service.Fan(this.name);
    } else if (this.service_type == "light") {
      theService = new Service.Lightbulb(this.name);
    } else {
      theService = new Service.Switch(this.name);
    }

    theService.getCharacteristic(Characteristic.On)
      .on('get', this.getPowerState.bind(this))
      .on('set', this.setPowerState.bind(this));

    this.informationService = informationService;
    this.onService = theService;
    return [informationService, theService];
  }
};
