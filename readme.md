Homebridge plugin for Revolution PIs [digital I/O modules](https://revolution.kunbus.com/io-modules/)

This plugin provides HomeKit switches for the digital outputs of the RevPi DIO & RevPi DO.
Additional the digital inputs can be configured as some type of sensor inpur.

Both digital outputs and inputs uses the type names of the digital outputs as setup in PiCtory.


## Installation

- Prepare RevPi core
- Install homebridge
- Install & Setup this plugin

You can skip the first 2 steps, if homebridge is already running on your RevPi core.

### Prepare Revolution Pi

Install at least a [jessie image](https://revolution.kunbus.com/tutorials/images/install-jessie/) on the Rev Pi core.

Remove old node.js:

```
sudo -i
apt-get remove nodered -y
apt-get remove nodejs nodejs-legacy -y
exit
```

Install node.js version manager.
This will install node.js and npm.

```
curl -L https://git.io/n-install | bash
```

Create configuration in [PiCtory](https://revolution.kunbus.com/tutorials/revpi-dio-pictory-configuration/)

### Install homebridge

The installation instructions can also be found [here](https://github.com/nfarina/homebridge).

```
sudo apt-get install libavahi-compat-libdnssd-dev

sudo npm install -g --unsafe-perm homebridge
```


run homebridge using `homebridge` to check if it is  correctly installed. The message "No plugins found. See the README for information on installing plugins." should appear.


###  Install & Setup RevPiDO plugin

Install plugin dependencie "RevPiModIO":

```
sudo apt-get update

sudo apt-get install python3-revpimodio2

sudo apt-get dist-upgrade
```

Install this plugin using: `npm install -g homebridge-revpidio`

Create or Update your hombridge configuration file. See `sample_config.json` or snippets below.

## Configuration Digital Ouptuts

Configuration sample:

```
accessories : [
  {
    "accessory": "RevPiDO",
	  "name": "A Light",
	  "output_name": "O_3",
	  "type": "light",
    "invert": false
  }
]
```

Fields:

- "accessory": Must always be "RevPiDO" (required)
- "name": Can be anything (required)
- "output\_name": type name of the digital output given in PiCtory (e.g. "O_1" for output 1). (required)
- "type" : one of the following option ["switch", "light", "fan"] default: "switch"
- "invert": `true` or `false`, output is logical inverted, optional default: `false`


## Configuration Digital Inputs

Configuration sample:

```
accessories : [
  {
    "accessory": "RevPiDI",
	  "name": "An Input",
	  "input_name": "I_3",
    "type" : "motion",
    "invert": false
  }
]
```

Fields:

- "accessory": Must always be "RevPiDI" (required)
- "name": Can be anything (required)
- "input\_name": type name of the digital input given in PiCtory (e.g. "I_1" for input 1). (required)
- "type" : one of the following option ["contact", "motion", "smoke", "leak", "occupancy", "button"\*, "state"\*\*, "doorbell"\*\*\*] default: "contact"
- "invert": `true` or `false`, input is logical inverted, optional default: `false`

\*: Button with no state, e.g. trigger for a scene

\*\*: Like a switch, this switch can not switche manually

\*\*\*: currently not supported in iOS (may be in the future, use motion)

## Configuration PiCore Info

To show the RevPi core temperatur use this accessory.

Configuration sample:

```
accessories : [
    {
		"accessory": "RevPiCore",
		"name": "My RevPi core"
	}
]
```

Fields:

- "accessory": Must always be "RevPiCore" (required)
- "name": Can be anything (required)




## Contributions & Thanks

Special thanks for contributions:

- Sven @ https://revpimodio.org/ (python library + bug report)
