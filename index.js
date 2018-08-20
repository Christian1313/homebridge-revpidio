var os = require("os");
var Service, Characteristic;

const version = "0.3.0";
const manufac = "KUNBUS";

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
            var newState = 0;
            if (stat == "ON") {
              if (debugOut > 2) {
                module.log(module.port_name + ' == on');
              }
              newState = 1;
            } else if (stat == "OFF") {
              if (debugOut > 2) {
                module.log(module.port_name + ' == off');
              }
              newState = 0;
            }

            if (module.invert) {
              if (debugOut > 2) {
                console.log("is inverted");
              }
              newState = newState == 0 ? 1 : 0;
            }
            module.state = newState;


            if (newState == 1) {
              if (debugOut > 1) {
                module.log(module.port_name + ' == ON');
              }
            } else if (newState == 0) {
              if (debugOut > 1) {
                module.log(module.port_name + ' == OFF');
              }
            }

            // handling stateless switches (digital inputs)

            var sendState = module.state;
            if (module.stateIsBool) {
              sendState = module.state == 0 ? false : true;
            }
            if (module.service_type == "button") {
              sendState = 0;
            }

            if ((module.service_type == "button" && (newState == 1)) || module.service_type != "button") {
              module.service.getCharacteristic(module.updateCharacteristic).updateValue(sendState, null);
            }
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
  this.log = log;
  this.name = config["name"];
  this.port_name = config["input_name"];
  this.invert = config["invert"];
  if (!this.invert) {
    this.invert = false;
  }
  this.state = 0;
  this.stateIsBool = false;
  this.service_type = config["type"];
  if (!this.service_type) {
    this.service_type = "contact"
  }
  this.arrayIndex = arrayCounter;
  arrayModules.push(this);
  arrayCounter += 1;
  py.stdin.write(this.port_name + "#GET\n");
}

RevPiDI.prototype = {

  reqState: function() {
    if (debugOut > 2) {
      this.log(this.port_name + " GET_STATE?");
    }
    py.stdin.write(this.port_name + "#GET\n");
  },

  getState: function(next) {
    if (debugOut > 2) {
      this.log(this.port_name + " GET_STATE?");
    }
    py.stdin.write(this.port_name + "#GET\n");

    var sendState = this.state;
    if (this.stateIsBool) {
      sendState = this.state == 0 ? false : true;
    }
    next(null, sendState)
  },

  setState: function(powerOn, next) {
    var sendState = powerOn == true ? false : true;
    if (debugOut > 2) {
      this.log(this.port_name + " SET_STATE NOT SUPPORTED (stays " + this.state + ")  " + sendState);
    }
    setTimeout(this.reqState.bind(this), 333);
    next(null, this.state)
  },

  getServices: function() {
    if (debugOut > 0) {
      this.log("GetServices of " + this.port_name);
    }
    var hostname = os.hostname();
    var informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer, manufac)
      .setCharacteristic(Characteristic.Model, "RevPi Digital Input")
      .setCharacteristic(Characteristic.SerialNumber, hostname)
      .setCharacteristic(Characteristic.FirmwareRevision, version);

    this.informationService = informationService;

    var theService
    if (this.service_type == "motion") {
      // motion sensor
      theService = new Service.MotionSensor(this.name);
      theService.getCharacteristic(Characteristic.MotionDetected)
        .on('get', this.getState.bind(this));
      this.updateCharacteristic = Characteristic.MotionDetected;
    } else if (this.service_type == "contact") {
      theService = new Service.ContactSensor(this.name);
      theService.getCharacteristic(Characteristic.ContactSensorState)
        .on('get', this.getState.bind(this));
      this.updateCharacteristic = Characteristic.ContactSensorState;
    } else if (this.service_type == "leak") {
      theService = new Service.LeakSensor(this.name);
      theService.getCharacteristic(Characteristic.LeakDetected)
        .on('get', this.getState.bind(this));
      this.updateCharacteristic = Characteristic.LeakDetected;
    } else if (this.service_type == "smoke") {
      theService = new Service.SmokeSensor(this.name);
      theService.getCharacteristic(Characteristic.SmokeDetected)
        .on('get', this.getState.bind(this));
      this.updateCharacteristic = Characteristic.SmokeDetected;
    } else if (this.service_type == "occupancy") {
      theService = new Service.OccupancySensor(this.name);
      theService.getCharacteristic(Characteristic.OccupancyDetected)
        .on('get', this.getState.bind(this));
      this.updateCharacteristic = Characteristic.OccupancyDetected;
    } else if (this.service_type == "button") {
      theService = new Service.StatelessProgrammableSwitch(this.name);
      theService.getCharacteristic(Characteristic.ProgrammableSwitchEvent)
        .setProps({
          maxValue: 0
        });
      this.updateCharacteristic = Characteristic.ProgrammableSwitchEvent;
    } else if (this.service_type == "state") {
      theService = new Service.Switch(this.name);
      theService.getCharacteristic(Characteristic.On)
        .on('get', this.getState.bind(this))
        .on('set', this.setState.bind(this));
      this.updateCharacteristic = Characteristic.On;
    } else if (this.service_type == "doorbell") {
      theService = new Service.Doorbell(this.name);
      theService.getCharacteristic(Characteristic.ProgrammableSwitchEvent)
        .setProps({
          maxValue: 0
        });
      this.updateCharacteristic = Characteristic.ProgrammableSwitchEvent;
    } else {
      theService = new Service.ContactSensor(this.name);
      theService.getCharacteristic(Characteristic.ContactSensorState)
        .on('get', this.getState.bind(this));
      this.updateCharacteristic = Characteristic.ContactSensorState;
    }

    this.service = theService;
    return [informationService, theService];
  }
};


function RevPiDO(log, config) {
  this.log = log;
  this.name = config["name"];
  this.port_name = config["output_name"];
  this.state = 0;
  this.stateIsBool = true;
  this.invert = config["invert"];
  if (!this.invert) {
    this.invert = false;
  }
  this.service_type = config["type"];
  if (!this.service_type) {
    this.service_type = "switch"
  }
  this.arrayIndex = arrayCounter;
  arrayModules.push(this);
  arrayCounter += 1;
  py.stdin.write(this.port_name + "#GET\n");
}

RevPiDO.prototype = {

  getPowerState: function(next) {
    if (debugOut > 2) {
      this.log(this.port_name + " GET_STATE?");
    }
    py.stdin.write(this.port_name + "#GET\n");
    var sendState = this.state;
    if (this.stateIsBool) {
      sendState = this.state == 0 ? false : true;
    }
    if (debugOut > 3) {
      this.log("GET_STATE is " + sendState);
    }
    next(null, sendState)
  },

  setPowerState: function(powerOn, next) {

    if (this.invert) {
      powerOn = powerOn == true ? false : true;
    }

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
    if (debugOut > 0) {
      this.log("GetServices of " + this.port_name);
    }
    var hostname = os.hostname();
    var informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer, manufac)
      .setCharacteristic(Characteristic.Model, "RevPi Digital Output")
      .setCharacteristic(Characteristic.SerialNumber, hostname)
      .setCharacteristic(Characteristic.FirmwareRevision, version);

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
    var hostname = os.hostname();
    var informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer, manufac)
      .setCharacteristic(Characteristic.Model, "RevPi Core")
      .setCharacteristic(Characteristic.SerialNumber, hostname)
      .setCharacteristic(Characteristic.FirmwareRevision, version);

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
