"use strict";
//E:\work\nodejs\nodejs_app\  C:\Windows\System32\cmd.exe /k "D:\nodejs\nodevars.bat"
// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-localsocket-server';

var webSocketsServerPort = 8825;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

var fs = require('fs');
var log4js = require('log4js');

/**
 * Global variables
 */
// latest 100 messages
var history = [];
// list of currently connected clients (users)
var clients = [];

//日志
var logDirPath = 'logs/eq-cloud';
if (!fs.existsSync(logDirPath)) {
    fs.mkdirSync(logDirPath);
}

log4js.configure({
    appenders: [
        { "type": "console" },
        {
            "type": 'dateFile',
            "filename": 'logs/',
            "maxLogSize": 2048,
            "absolute": true,
            "pattern": "eq-cloud/eqyyyyMMddhh.log",
            "alwaysIncludePattern": true,
            "backups": 10,
            "category": 'cheese'
        }
    ]
});

var logger = log4js.getLogger('cheese');

try {


    /**
     * Helper function for escaping input strings
     */
    function htmlEntities(str) {
        return String(str).replace(/&/g, '&').replace(/>/g, '>').replace(/"/g, '"');
    }

    // Array with some colors
    var colors = ['red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange'];
    // ... in random order
    colors.sort(function(a, b) { return Math.random() > 0.5; });

    /**
     * HTTP server
     */
    var server = http.createServer(function(request, response) {
        // Not important for us. We're writing WebSocket server, not HTTP server
    });
    server.listen(webSocketsServerPort, function() {
        console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
    });

    //清除空格
    String.prototype.trim = function() { return this.replace(/[\s　]+|(&nbsp;)+/gi, ''); };
    /**
     * WebSocket server
     */
    var wsServer = new webSocketServer({
        // WebSocket server is tied to a HTTP server. WebSocket request is just
        // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
        httpServer: server
    });





    var maxindex = 0;
    // This callback function is called every time someone
    // tries to connect to the WebSocket server
    wsServer.on('request', function(request) {
        //console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
        // accept connection - you should check 'request.origin' to make sure that
        // client is connecting from your website
        // (http://en.wikipedia.org/wiki/Same_origin_policy)
        //保存客户端连接开始

        var index = -1;
        var res_data = '';
        var connection = request.accept(null, request.origin);
        // we need to know client index to remove them on 'close' event
        var connobj = {
            connid: index,
            conn: connection,
            boxid: '',
            type: '',
            firstlogin: 0,
            login: 0
        };
        /*for(var a in connection){
        	 console.log((new Date()) + ' Connection: ' + a + ' : '+connection[a]);
        }*/
        if (clients.length > 0) {
            for (var i = 0; i < clients.length; i++) {
                if (clients[i].conn == null) {
                    index = i;
                    clients[i].connid = i;
                    clients[i].conn = connection;
                    break;
                }
            }
            if (index == -1) {
                index = clients.push(connobj) - 1;
                clients[index].connid = index;
            }
        } else {
            index = clients.push(connobj) - 1;
            clients[index].connid = index;
        }
        connobj = null;

        if (index > maxindex) {
            maxindex = index;
        }
        //保存客户端连接结束

        //console.log((new Date()) + ' Connection accepted.');
        //console.log((new Date()) + ' conn index': ' + index);

        // user sent some message
        connection.on('message', function(message) {
            var receive;
            console.log(clients)
            if (message.type === 'utf8') { // accept only text
                try {
                    //console.log((new Date()) + ' Received Message from: ' + message.utf8Data);
                    //console.log((new Date()) + message.utf8Data+' debug ip:'+clients[index].conn.remoteAddress);

                    var mac = '';
                    var from = '';
                    var to = '';
                    var token = '';
                    var identity = '';
                    var cmdtype = '';
                    var timestamp = '';
                    var json;
                    var send_flag = 0;
                    var rtype = '';
                    var actime = (new Date()).getTime();
                    if (message.utf8Data) {
                        //console.log((new Date()) + ' Received Message from: ' + typeof(message.utf8Data));
                        //receive = eval('('+message.utf8Data+')');
                        receive = JSON.parse(message.utf8Data);


                    }

                    if (receive.boxid != undefined) {
                        mac = receive.boxid;
                        //console.log((new Date()) + ' Received Message mac: ' + receive.boxid);
                    } else if (receive.box_id != undefined) {
                        mac = receive.box_id;
                        //console.log((new Date()) + ' Received Message mac: ' + receive.box_id);
                    } else if (receive.talk_id != undefined) {
                        mac = receive.talk_id;
                        //console.log((new Date()) + ' Received Message chat: ' + receive.talk_id);
                    } else if (receive.course_id != undefined) {
                        //mac = receive.talk_id;
                        //console.log((new Date()) + ' Received Message chat: ' + receive.talk_id);
                    } else if (receive.name != undefined && receive.args != undefined) {
                        if (receive.name.trim() == 'sendMpUser') {
                            mac = receive.args[0].courseid.split('_')[0];
                            //console.log(receive.args);
                            from = "eqWebClient";
                        }
                        cmdtype = "eqOnlineGetMessage";
                    } else {
                        clients[index].conn.close();
                        return 0;
                    }
                    if (receive.course_id == undefined && (mac == 'undefined' || mac.trim() == '')) {
                        clients[index].conn.close();
                        return 0;
                    }
                    if (receive.from != undefined) {
                        from = receive.from;
                        //console.log((new Date()) + ' Received Message from: ' + receive.from);
                    }
                    if (receive.to != undefined) {
                        to = receive.to;
                        //console.log((new Date()) + ' Received Message to: ' + receive.to);
                    }
                    if (receive.token != undefined) {
                        token = receive.token;
                        //console.log((new Date()) + ' Received Message token: ' + receive.token);
                    }
                    if (receive.rtype != undefined) {
                        rtype = receive.rtype;
                        //console.log((new Date()) + ' Received Message rtype: ' + receive.rtype);
                    }
                    if (receive.identity != undefined) {
                        identity = receive.identity;
                        if (identity == 'linkin') {
                            from = identity;
                        }
                        //console.log((new Date()) + ' Received Message identity: ' + receive.identity+' '+from +' '+index);
                    }

                    if (receive.cmdtype != undefined) {
                        cmdtype = receive.cmdtype;
                        //console.log((new Date()) + ' Received Message cmdtype: ' + receive.cmdtype);
                    }
                    if (receive.timestamp != undefined) {
                        timestamp = receive.timestamp;
                        //console.log((new Date()) + ' Received Message timestamp: ' + receive.timestamp);
                    }


                    if (mac.trim() != '') clients[index].boxid = mac;
                    if (from.trim() != '') clients[index].type = from;
                    //console.log((new Date()) + ' Received client: ' + from +' '+index);

                    // we want to keep history of all sent messages
                    /*var obj = {
                    	connid:index,
                    	boxid:mac,
                    	type:from,
                    	  to:to,
                    	time: actime,
                    	text: JSON.parse(message.utf8Data),
                    };*/

                    //var json = JSON.stringify({ type:'message', data: obj });
                    json = JSON.stringify(receive);

                    var status = -1;
                    // broadcast message to all connected clients
                    //遍历客户端
                    if (mac != undefined && cmdtype != undefined) {
                        if ( to == "") {
                            for (var i = 0; i < clients.length; i++) {
                                //console.log((new Date()) + ' conn client type :'+clients[i].type+' boxid: ' + clients[i].boxid);
                                if (clients[i].conn && clients[i].boxid == mac) {
                                    clients[i].conn.sendUTF(json);
                                    status = 1;
                                }
                            }
                        } else {
                            for (var i = 0; i < clients.length; i++) {
                                //console.log((new Date()) + ' conn client type :'+clients[i].type+' boxid: ' + clients[i].boxid);
                                if (clients[i].conn && clients[i].type == to && clients[i].boxid == mac) {
                                    clients[i].conn.sendUTF(json);
                                    status = 1;
                                }
                            }
                        }

                    }

                    var obj = {
                        boxid: mac,
                        time: actime,
                    }
                    json = JSON.stringify({ status: 1, data: obj, msg: 'ok' });
                    clients[index].conn.sendUTF(json);


                    mac = null;
                    from = null;
                    to = null;
                    token = null;
                    identity = null;
                    cmdtype = null;
                    timestamp = null;
                    json = null;
                    send_flag = null;
                    rtype = null;
                    actime = null;

                } catch (e) {
                    var json = JSON.stringify({ status: 0, data: '', msg: 'error' });
                    clients[index].conn.sendUTF(json);
                    clients[index].conn.close();
                    //console.log((new Date()) + ' Received Message from Error');
                    logger.error(message.utf8Data);
                    logger.error(e);
                }
                receive = null;

            }
        });

        // user disconnected
        connection.on('close', function(connection) {
            //console.log((new Date()) + " Peer " + clients[index].conn.remoteAddress + " disconnected.");
            // remove user from the list of connected clients
            try {
                clients[index].conn = null;
                clients[index].login = 0;
                clients[index].firstlogin = 0;
                if (index == maxindex) {
                    clients.splice(index, 1);
                    maxindex--;
                }
            } catch (e) {
                logger.error(e);
            }
        });

    });

} catch (e) {
    logger.error(e);
}