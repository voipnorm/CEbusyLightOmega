"use strict";

const util = require("util");
const EventEmitter = require('events');
const busylight = require('busylight');

module.exports = class BLControls extends EventEmitter {

    constructor() {

        super();

        this.currentState = [];
        this.prevState = [0,0,0,1];//Array provides state and priority. Index 0-4 is highest to lowest priority.
        this.device;
        this.bl;
        this.launch();
    }

    launch() {
        this.bl = busylight.get();
        this.usbState();
        this.bldefaults();
    }
//sets color based on the index of first array element set to 1.
    setColor(colorArray) {
        console.log(colorArray);
        let indexColor = colorArray.indexOf(1);
        console.log(indexColor);
        switch (indexColor) {
            case 0:
                this.bl.pulse('red');
                break
            case 1:
                this.bl.light('red');
                break
            case 2:
                this.bl.light('blue');
                break
            case 3:
                this.bl.light('green');
                break
            default:
                break
        }
        return

    }
//updates the current array status
    updateState(report,statusArray) {
        //console.log(statusArray)
        return new Promise((resolve, reject) => {
            switch (report.state) {
                case 'dnd':
                    if (report.status === 'Active') {
                        statusArray[0] = 1;
                        //console.log(statusArray);
                        return resolve(statusArray);

                    } else {
                        statusArray[0] = 0;
                        return resolve (statusArray);

                    }
                case 'call':
                    statusArray[1] = 1;
                    return resolve (statusArray);


                case 'disconnected':
                    statusArray[1] = 0;
                    return resolve (statusArray);


                case 'people':
                    if (report.count >= 1) {
                        statusArray[2] = 1;
                        return resolve (statusArray);

                    } else {
                        statusArray[2] = 0;
                        return resolve (statusArray);

                    }
                default:
                    return reject()


            }
        })

    }
    async controlLight(report){
        try{
            console.log(report);
            console.log(this.prevState);
            this.currentState = await this.updateState(report,this.prevState);
            console.log(this.currentState);
            this.prevState = this.currentState;
            this.setColor(this.currentState);
        }
        catch(e){
            console.log(e)
        }
    }
    usbState(){
        this.bl.on('disconnected', (err) => {
            console.log("Busy light disconnected");
        });

        this.bl.on('connected', () => {
            console.log("Busylight found");
            if (!this.bl)
                return console.log('no busylight found');


        });
    }
    bldefaults(){
        this.bl.defaults({
            volume: 1,
            color: 'yellow'
        });
    }
    shutdown(){
        this.bl.off();
        this.bl.close();
    }

}