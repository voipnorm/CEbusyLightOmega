'use strict';
require('dotenv').config();
const BLControls = require('./bl');
const TPXapi = require('./endpoint');



var endpoint = {
    username: process.env.TPADMIN,
    password: process.env.TPADMINPWD,
    ipAddress: process.env.IPADDRESS,
}


//issue with varible being over writtern everytime the report is presented.


var bl =  new BLControls();

var tp = new TPXapi(endpoint);



tp.on('status', (report) => {
    bl.controlLight(report);
});

process.on('SIGINT', function() {
    console.log('server : stoppping...');
    bl.shutdown();
    process.exit();
});