"use strict";
exports.__esModule = true;
var dgram = require("dgram");
var net_1 = require("net");
var ssdpHost = {
    address: "239.255.255.250",
    port: 1982
};
var searchMessage = Buffer.from("M-SEARCH * HTTP/1.1\r\nHOST: " + ssdpHost.address + ":" + ssdpHost.port + "\r\nMAN: \"ssdp:discover\"\r\nST: wifi_bulb\r\n");
var devices = new Set();
var socketUdp = dgram.createSocket('udp4');
socketUdp.on('message', (function (msg) {
    var location = /Location: yeelight:\/\/(\d+\.\d+\.\d+\.\d+):(\d+)/g.exec(msg);
    var address = location[1];
    var port = +location[2];
    devices.add({ address: address, port: port });
}));
socketUdp.bind(43210, '0.0.0.0');
socketUdp.send(searchMessage, 0, searchMessage.length, ssdpHost.port, ssdpHost.address);
var device = devices.values().next().value;
var socket = new net_1.Socket();
socket.on('data', function (data) {
    var result = JSON.parse(data.toString('utf-8'));
    console.log(result.result[0] == "ok" ? "Toggled succesfully" : "Error occured.");
    socket.destroy();
});
socket.on('close', function () { return console.log("Connection closed"); });
var sendCommand = function (commandObject) {
    var stringifiedCommand = JSON.stringify(commandObject);
    socket.connect(device.port, device.address);
    socket.write(stringifiedCommand + "\r\n");
};
var toggleCommand = {
    id: 1,
    method: "toggle",
    params: []
};
sendCommand(toggleCommand);
