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

const debugOut = 2;
const spawn = require('child_process').spawn;
const currentPath = __dirname;
const pyFileOutputs = currentPath + '/liveoutputs.py';
const py = spawn('python3', [pyFileOutputs]);

var arrayCounter = 0;
var arrayModules = [];
var hasCoreModule = false;
var coreModule = null;

var core_temp = 13.3;

py.stdout.on('data', function(data) {
  var retStr = data.toString().trim();
  retStr = data.toString().replace(/\r?\n|\r/g, "#");
  if (debugOut > 3) {
    console.log(retStr);
  }
  var compos = retStr.split("#");
  if (compos.length > 1) {
    for (var i = 0; i < compos.length / 2; i++) {
      var idx = 2 * i;
      var name = compos[idx];
      var stat = compos[idx + 1];

      if (name == "TEMP") {
        core_temp = parseFloat(stat)
        if (hasCoreModule) {
          if (debugOut > 2) {
            coreModule.log("update temp " + core_temp);
          }
          coreModule.tempService
            .getCharacteristic(Characteristic.CurrentTemperature).updateValue(core_temp, null);
        }
      } else {
        for (var idx in arrayModules) {
          var module = arrayModules[idx];
          if (module.port_name == name) {
            var newState = false;
            if (stat == "ON") {
              if (debugOut > 1) {
                module.log(module.port_name + ' == ON');
              }
              newState = true;
            } else if (stat == "OFF") {
              if (debugOut > 1) {
                module.log(module.port_name + ' == OFF');
              }
              newState = false;
            }
            module.state = newState;
            module.service.getCharacteristic(module.updateCharacteristic).updateValue(newState, null);
            break;
          }
        }
      }
    }
  }
});

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-revpidio", "RevPiDO", RevPiDO);
  homebridge.registerAccessory("homebridge-revpidio", "RevPiDI", RevPiDI);
  homebridge.registerAccessory("homebridge-revpidio", "RevPiCore", RevPiCore);
};


function RevPiDI(log, config) {
  log("Init RevPiDI [" + arrayCounter + "]");
  this.log = log;
  this.name = config["name"];
  this.port_name = config["input_name"];
  this.state = false;
  this.arrayIndex = arrayCounter;
  arrayModules.push(this);
  arrayCounter += 1;
}

RevPiDI.prototype = {

  getState: function(next) {
    if (debugOut > 2) {
      this.log(this.port_name + " GET_STATE?");
    }
    py.stdin.write(this.port_name + "#GET\n");
    next(null, this.state)
  },

  getServices: function() {
    this.log("GetServices of " + this.port_name);
    var informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer, "KUNBUS")
      .setCharacteristic(Characteristic.Model, "Revolution Pi")
      .setCharacteristic(Characteristic.FirmwareRevision, "0.2.0");

    this.informationService = informationService;

    var theService

    // motion sensor
    theService = new Service.MotionSensor(this.name);
    theService.getCharacteristic(Characteristic.MotionDetected)
      .on('get', this.getState.bind(this));

    this.service = theService;
    this.updateCharacteristic = Characteristic.MotionDetected;
    return [informationService, theService];
  }
};


function RevPiDO(log, config) {
  log("Init RevPiDO [" + arrayCounter + "]");
  this.log = log;
  this.name = config["name"];
  this.port_name = config["output_name"];
  this.state = false;
  this.service_type = config["type"];
  if (!this.service_type) {
    this.service_type = "switch"
  }
  this.arrayIndex = arrayCounter;
  arrayModules.push(this);
  arrayCounter += 1;
}

RevPiDO.prototype = {

  getPowerState: function(next) {
    if (debugOut > 2) {
      this.log(this.port_name + " GET_STATE?");
    }
    py.stdin.write(this.port_name + "#GET\n");
    next(null, this.state)
  },

  setPowerState: function(powerOn, next) {
    if (powerOn) {
      if (debugOut > 0) {
        this.log("SET_STATE " + this.port_name + " => ON");
      }
      py.stdin.write(this.port_name + "#ON\n");
    } else {
      if (debugOut > 0) {
        this.log("SET_STATE " + this.port_name + " => OFF");
      }
      py.stdin.write(this.port_name + "#OFF\n");
    }
    next(null);
  },

  getServices: function() {
    this.log("GetServices of " + this.port_name);
    var informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer, "KUNBUS")
      .setCharacteristic(Characteristic.Model, "Revolution Pi")
      .setCharacteristic(Characteristic.FirmwareRevision, "0.2.0");

    this.informationService = informationService;

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


    this.service = theService;
    this.updateCharacteristic = Characteristic.On;
    return [informationService, theService];
  }
};


function RevPiCore(log, config) {
  log("Init RevPiCore");
  this.log = log;
  this.name = config["name"];
  coreModule = this;
  hasCoreModule = true;
};

RevPiCore.prototype = {

  reqTemp: function() {
    if (debugOut > 2) {
      this.log("UPDATE_CORE_TEMP?");
    }
    py.stdin.write("CORE#TEMP\n");
    setTimeout(this.reqTemp.bind(this), 10000);
  },

  getTemp: function(callback) {
    if (debugOut > 1) {
      this.log("GET_CORE_TEMP?");
    }
    this.reqTemp();
    callback(null, core_temp)
    return core_temp;
  },

  getServices: function() {
    var informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer, "KUNBUS")
      .setCharacteristic(Characteristic.Model, "RevPi core")
      .setCharacteristic(Characteristic.FirmwareRevision, "0.2.0");

    this.tempService = new Service.TemperatureSensor(this.name);
    this.tempService
      .getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', this.getTemp.bind(this))
      .setProps({
        minValue: 0,
        maxValue: 110
      });
    this.informationService = informationService;
    return [informationService, this.tempService];
  }
};
