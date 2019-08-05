"use strict";
/*
Endpoint file controls access to video endpoint. Is compatible with CE9.7 and above.
 */
const WebSocket = require('ws');
const EventEmitter = require('events');
const XAPI = require('jsxapi/lib/xapi').default;
const WSBackend = require('jsxapi/lib/backend/ws').default;


module.exports = class TPXapi extends EventEmitter{

    constructor(endpoint) {

        super();

        this.xapi;

        this.url = `ws://${endpoint.ipAddress}/ws`;

        this.endpoint = endpoint;

        this.connectedStatus = 'false';

        this.callID = 'unknown';

        this.callStatus = 'false';

        this.init();

    }
    //Intialize connection and perform intial endpoint checks for state.
    init() {
        try {
            (async () => {
                await this.connect();
                await this.onReady();
                await this.checkCallStatus();
                await this.checkPeoplePresence();
                await this.checkDnD();
            })();
        } catch (e) {
            console.error(e);
        }
    };

    connect() {
        return new Promise((resolve, reject) => {
            try {
                (async () => {
                    const auth = Buffer.from(`${this.endpoint.username}:${this.endpoint.password}`).toString('base64');
                    const options = {
                        headers: {
                            'Authorization': `Basic ${auth}`,
                        }
                    };

                    const websocket = new WebSocket(this.url, options);
                    websocket.on('error', console.error);
                    this.xapi = new XAPI(new WSBackend(websocket));

                    resolve();
                })();
            } catch (e) {
                reject(e);
            }
        });
    };
    onReady() {
        this.xapi.on('ready', () => {
            console.log(`connexion successful for ${this.endpoint.ipAddress || this.endpoint.url}`);
            this.connectedStatus = 'true';
            this.monitorCallStatus();
            this.monitorPeopleStatus();
            this.monitorDnDStatus();
            return this;
        });
    };
    closeConnect() {
        return new Promise((resolve, reject) => {
            try {
                (async () => {
                    this.connectedStatus = 'false';
                    await this.xapi.close();
                    console.log(`connexion closed for ${this.endpoint.ipAddress || this.endpoint.url}`);
                    resolve();
                })();
            } catch (e) {
                reject(e);
            }
        });
    };

    checkCallStatus() {
        return new Promise((resolve, reject) => {
            this.xapi.status.get('Call')
                .then((data) => {
                    console.log(data);
                    if (data.length === 0) {
                        this.callStatus = 'false';
                        resolve (this.emit('status', {state: 'disconnected'}));
                    } else {
                        this.callID = data[0].id;
                        this.callStatus = 'true';
                        console.log(this.callID);
                        resolve(this.emit('status', {state: 'call'}));
                    }

                })
                .catch(e => {
                    console.log(e);
                    reject();
                })
        })
    }
    //if in a call set callID for possible FECC
    monitorCallStatus() {

            this.xapi.status.on('Call', (data) => {

                if (data.ghost === "True") return;

                console.log("call" + JSON.stringify(data));
                this.callID = data.id;
                this.callStatus = 'true';
                console.log(this.callID);
                return this.emit('status', {state: 'call'});
            })
            this.xapi.event.on('CallDisconnect', (data) => {
                console.log("disconnected" + JSON.stringify(data));
                this.callID = 'unknown';
                this.callStatus = 'false';
                console.log(this.callStatus);
                return this.emit('status', {state: 'disconnected'});
            })


    }
    checkPeoplePresence(){

        return new Promise((resolve, reject) => {
            this.xapi.status.get('RoomAnalytics PeopleCount')
            .then(data => {
                console.log(data)
                resolve(this.emit('status', {state: 'people', count: data.Current}));
            }).catch(e => {
                    console.error(e);
                    reject()
                })
        })
    }
    monitorPeopleStatus() {
        this.xapi.status.on('RoomAnalytics PeopleCount', (data) => {
            console.log(data);
           return this.emit('status', {state: 'people', count: data.Current});
        })
    }
    checkDnD(){
        return new Promise((resolve, reject) => {
            this.xapi.status.get('Conference DoNotDisturb')
                .then(data => {
                    console.log(data);
                    resolve(this.emit('status', {state: 'dnd', status: data}));
                }).catch(e => {
                    console.error(e);
                    reject();
            })
        })
    }
    monitorDnDStatus() {
        this.xapi.status.on('Conference DoNotDisturb', (data) => {
            console.log(data);
            return this.emit('status', {state: 'dnd', status: data});
        })
    }



};

