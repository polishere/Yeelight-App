import * as dgram from 'dgram';
import { Socket } from 'net'

type Command = { id: number; method: string; params: string[]; };
type Device = { address: string, port: number };
type Result = {id: number, result: string[]}

const ssdpHost : Device = {
	address: "239.255.255.250",
	port: 1982
}

const searchMessage = Buffer.from(`M-SEARCH * HTTP/1.1\r\nHOST: ${ssdpHost.address}:${ssdpHost.port}\r\nMAN: "ssdp:discover"\r\nST: wifi_bulb\r\n`);
const devices = new Set<Device>()

const socketUdp = dgram.createSocket('udp4');
socketUdp.on('message', ((msg : string) => {
	const location = /Location: yeelight:\/\/(\d+\.\d+\.\d+\.\d+):(\d+)/g.exec(msg)
	const address : string = location[1]
	const port : number = +location[2]
	devices.add({address, port})
}))
socketUdp.bind(43210, '0.0.0.0')
socketUdp.send(searchMessage, 0, searchMessage.length, ssdpHost.port, ssdpHost.address)

const device : Device = devices.values().next().value

const socket = new Socket();
socket.on('data', (data : Buffer) => {
	const result : Result = JSON.parse(data.toString('utf-8'));
	console.log(result.result[0] == "ok" ? "Toggled succesfully" : "Error occured.")
	socket.destroy();
	});
socket.on('close', () => console.log("Connection closed"));

const sendCommand = (commandObject: Command) => {
	const stringifiedCommand = JSON.stringify(commandObject);
	socket.connect(device.port, device.address); 
	socket.write(`${stringifiedCommand}\r\n`);
	}

const toggleCommand : Command = {
	id: 1,
	method: "toggle",
	params: []
}

sendCommand(toggleCommand)