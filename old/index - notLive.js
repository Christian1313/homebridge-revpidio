var Service, Characteristic;

// "accessories": [
//   {
//     "accessory": "HomebridgeRevPiDIO",
//     "name": "RevPiDio Switch",
//     "output_idx": "2"
//   }
// ]


var spawn = require('child_process').spawn;

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-revpidio", "HomebridgeRevPiDIO", HomebridgeRevPiDIO);
};

function HomebridgeRevPiDIO(log, config) {
  this.currentState = false;
  this.log = log;
  this.name = config["name"];
  this.output_name = config["output_name"];
  this.log("Init HomebridgeRevPiDO with " + this.output_name);
  this.currentPath = process.cwd();
  this.log(this.currentPath);
  this.pyFileOutputs = this.currentPath + '/homebridge-revpidio/setgetoutput.py';
}

HomebridgeRevPiDIO.prototype = {

  getPowerState: function (next) {
	  this.log("getPowerState")
	  this.log(this.currentState)
    return next(null, this.currentState);
  },

  setPowerState: function(powerOn, next) {
    this.log("setPowerState");
	  this.currentState = powerOn;
    this.log(this.pyFileOutputs);
	  if (powerOn) {
		  this.log("to On");
      py = spawn('python3', [this.pyFileOutputs, "ON", this.output_name]);
		  py.stdout.on('data', function(data) {
		    console.log('dataOn');
			  console.log(data.toString());
			  next(null);
		  });
	  } else {
		  this.log("to Off");
		  var py = spawn('python3', [this.pyFileOutputs, "OFF", this.output_name]);
		  py.stdout.on('data', function(data) {
		    console.log('dataOff');
			  console.log(data.toString());
			  next(null);
		  });
	  }
  },

  getServices: function () {
    var me = this;
    var informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer, "CZ Manufacturer")
      .setCharacteristic(Characteristic.Model, "RevPi Model")
      .setCharacteristic(Characteristic.SerialNumber, "A Serial Number");

    var switchService = new Service.Switch(me.name);
    switchService.getCharacteristic(Characteristic.On)
      .on('get', this.getPowerState.bind(this))
      .on('set', this.setPowerState.bind(this));

    this.informationService = informationService;
    this.switchService = switchService;
    return [informationService, switchService];
  }
};
