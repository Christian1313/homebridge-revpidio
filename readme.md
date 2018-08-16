Homebridge plugin for Revolution PIs [digital I/O modules](https://revolution.kunbus.com/io-modules/)

Currently, this plugin switches digital outputs of the RevPi DIO & RevPi DO.
It uses the type names of the digital outputs as setup in PiCtory.


## Installation

- Prepare RevPi core
- Install homebridge
- Install & Setup this plugin

You can skip the first 2 steps, if homebridge is already running on your RevPi core.

### Prepare Revolution Pi

Install at least a [jessi image](https://revolution.kunbus.com/tutorials/images/install-jessie/) on the Rev Pi core.

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


run hombrifge using `homebridge` to check if it is  correctly installed. The message "No plugins found. See the README for information on installing plugins." should appear.


###  Install & Setup RevPiDO plugin

Install plugin dependencie "RevPiModIO":

```
sudo apt-get update

sudo apt-get install python3-revpimodio2

sudo apt-get dist-upgrade
```

Install this plugin using: `npm install -g homebridge-revpidio`

Create or Update your hombridge configuration file. See `sample_config.json` or snippet below.

## Configuration

Configuration sample:

```
accessories : [ 
  {
    "accessory": "RevPiDO",
	"name": "A Light",
	"output_name": "O_3",
	"type": "light"
  }
]
```

Fields:

- "accessory": Must always be "RevPiDO" (required)
- "name": Can be anything (required)
- "output\_name": type name of the digital output given in PiCtory (e.g. "O_1" for output 1). (required)
- "type" : one of the folloing option ["switch", "light", "fan"] default: "switch"
