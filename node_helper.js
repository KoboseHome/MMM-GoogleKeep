/* Magic Mirror
 * Node Helper: MMM-GoogleKeep
 *
 * By taxilof
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const {PythonShell} = require('python-shell');
const path = require('path');

var pyshell;

module.exports = NodeHelper.create({

    consolePrefix: '[MMM-GoogleKeep_helper]:: ',
    
    start: function() {
        console.log(this.consolePrefix + "Starting node_helper for module [" + this.name + "]");
        this.initialized = false;
    },


    python_start: function () {
        const self = this;
        const venvPath = path.join(__dirname, 'venv', 'bin', 'python');
        const scriptPath = path.join(__dirname, 'script', 'googlekeep.py');

        pyshell = new PythonShell(scriptPath, { 
            mode: 'json', 
            pythonPath: venvPath,
            args: [JSON.stringify(this.config)]
        });
        pyshell.on('message', function (message) {
            console.log(message);
            if (message.hasOwnProperty('debug')){
                console.log("[" + self.name + "] " + message.debug);
            }
            if (message.hasOwnProperty('status')){
                console.log(message.status);
                self.sendSocketNotification('status', {action: "status", name: message.status.name, data: message.status.data});
            }
            if (message.hasOwnProperty('sensor')){
                if(self.initialized){
                    self.sendData(message);
                }
            } 
            if (message.hasOwnProperty('note_text')){
                if(self.initialized){
                    self.sendSocketNotification('note_text', message.note_text);
                }
            }
        });

        pyshell.end(function (err) {
            if (err) throw err;
            console.log("[" + self.name + "] " + 'finished running...');
            self.sendSocketNotification('error', 'pyshell-throw');
        });
    },
    
    python_send: function ( msg ) {
        pyshell.send( msg );
    },

    // Override socketNotificationReceived method.

    /* socketNotificationReceived(notification, payload)
     * This method is called when a socket notification arrives.
     *
     * argument notification string - The identifier of the noitication.
     * argument payload mixed - The payload of the notification.
     */
    socketNotificationReceived: function(notification, payload) {
        if (notification === "MMM-GoogleKeep-NOTIFICATION_TEST") {
            console.log("helper Working notification system." );
            // Send notification
            this.sendNotificationTest(this.anotherFunction()); //Is possible send objects :)
        }
        
        if (notification === 'MMM-GoogleKeep-CONFIG') {
        this.config = payload;
        } else if (notification === "MMM-GoogleKeep-INITIALIZE" && this.config !== null){
            this.python_start();
            this.sendSocketNotification('status', {action: "status", name: "initialized"});
            this.initialized = true;
        }
    },

    // Example function send notification test
    sendNotificationTest: function(payload) {
        this.sendSocketNotification("MMM-GoogleKeep-NOTIFICATION_TEST", payload);
    },
});
