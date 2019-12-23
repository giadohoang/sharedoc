import React from 'react';

 export const SenderJs = () => {
 return (
 <div className="container">
 <div>
 <table class="control">
			<thead>
			  <tr>
				<td class="title">Status:</td>
			  </tr>
			  <tr>
				<td></td>
			  </tr>
			  <tr>
				<td>
				  <span style="font-weight: bold">ID: </span>
				  <input type="text" id="receiver-id" title="Input the ID from receive.html">
				  <button id="connect-button">Connect</button>
				</td>
				<td class="title">Messages:</td>
			  </tr>
			  <tr>
				<td>
				  <div id="status" class="status"></div>
				</td>
				<td>
				  <div class="message" id="message"></div>
				</td>
			  </tr>
			</thead>

			<tbody>
			</tbody>
			<tr>Sender</tr>
			<tr>
			  <form><textarea id="code" name="code" rows="5">here</textarea></form>
			</tr>
		  </table>
 </div>
 
 <div>
   <script type="text/javascript">
    var doSend = true;
    var lastPeerId = null;
    var peer = null; // own peer object
    var conn = null;
    var recvIdInput = document.getElementById("receiver-id");
    var status = document.getElementById("status");
    var message = document.getElementById("message");
    var goButton = document.getElementById("goButton");
    var resetButton = document.getElementById("resetButton");
    var fadeButton = document.getElementById("fadeButton");
    var offButton = document.getElementById("offButton");
    var sendMessageBox = document.getElementById("sendMessageBox");
    var sendButton = document.getElementById("sendButton");
    var clearMsgsButton = document.getElementById("clearMsgsButton");
    var connectButton = document.getElementById("connect-button");
    var cueString = "<span class=\"cueMsg\">Cue: </span>";
    var code = document.getElementById("code");
    var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
      lineNumbers: true,
      theme: "night",
      extraKeys: {
        "F11": function (cm) {
          cm.setOption("fullScreen", !cm.getOption("fullScreen"));
        },
        "Esc": function (cm) {
          if (cm.getOption("fullScreen")) cm.setOption("fullScreen", false);
        },
      },
      cursorBlinkRate: 0
    });
    var sharedoc = [[]];
    (function () {
      /**
       * Create the Peer object for our end of the connection.
       *
       * Sets up callbacks that handle any events related to our
       * peer object.
       */
      function initialize() {
        // Create own peer object with connection to shared PeerJS server
        peer = new Peer(null, {
          debug: 3
        });

        /*
        
        */


        peer.on('open', function (id) {
          // Workaround for peer.reconnect deleting previous id
          if (peer.id === null) {
            console.log('Received null id from peer open');
            peer.id = lastPeerId;
          } else {
            lastPeerId = peer.id;
          }

          console.log('ID: ' + peer.id);
        });
        peer.on('disconnected', function () {
          status.innerHTML = "Connection lost. Please reconnect";
          console.log('Connection lost. Please reconnect');

          // Workaround for peer.reconnect deleting previous id
          peer.id = lastPeerId;
          peer._lastServerId = lastPeerId;
          peer.reconnect();
        });
        peer.on('close', function () {
          conn = null;
          status.innerHTML = "Connection destroyed. Please refresh";
          console.log('Connection destroyed');
        });

        peer.on('error', function (err) {
          console.log(err);
          alert('' + err);
        });
      };

      /**
       * Create the connection between the two Peers.
       *
       * Sets up callbacks that handle any events related to the
       * connection and data received on it.
       */
      function join() {
        // Close old connection
        if (conn) {
          conn.close();
        }

        // Create connection to destination peer specified in the input field
        conn = peer.connect(recvIdInput.value, {
          reliable: true
        });

        conn.on('open', function () {
          updateDocument();
          console.log("Connected to: " + conn.peer);
          addMessage("<span class=\"peerMsg\">Connected to: </span>" + conn.peer);
          status.innerHTML = "Connected to: " + conn.peer;
          // Check URL params for comamnds that should be sent immediately
          var command = getUrlParam("command");
          if (command)
            conn.send(command);
        });

        function updateDocument() {
          var count = 0
          editor.doc.children[0].lines.forEach(line => {
            sharedoc[count] = line.text.split('');
            count++;
          });
          console.log("after Updating Document: ", sharedoc);
        }
        // Handle incoming data (messages only since this is the signal sender)
        conn.on('data', function (data) {
          doSend = false;
          console.log("Data recieved");
          var cueString = "<span class=\"cueMsg\">Cue: </span>";
          updatetext(data);
          addMessage("<span class=\"peerMsg\">Peer: </span>" + data);
        });
        conn.on('close', function () {
          status.innerHTML = "Connection closed";
        });
      };

      function updatetext(data) {
        console.log("received: ", data);
        var obj = JSON.parse(data);
        //if delete+
        if (obj.change.origin === "+delete") {
          var doc = editor.getDoc();
          var cursor = editor.getDoc().getCursor();
          cursor.line = obj.change.from.line;
          cursor.ch = obj.change.from.ch;

          doc.replacerange("", { line: obj.change.from.line, ch: obj.change.from.ch },
            { line: obj.change.to.line, ch: obj.change.to.ch });
        } else {

          var doc = editor.getDoc();
          var cursor = editor.getDoc().getCursor();
          doc.replaceRange(obj.change.text, obj.change.from, obj.change.to, "insertText");
        }
      }
      editor.on("change", function (cm, change) {
        if (!doSend) {
          doSend = !doSend;
          return
        };
        console.log("cm: ", cm);
        console.log("change: ", change);
        // var data = JSON.stringify({ change })
        var data = JSON.stringify({ change: change, cursor: editor.getDoc().getCursor() })
        addMessage("<span class=\"peerMsg\">User: </span>" + data);
        if (conn.open) {
          conn.send(data);
        }
      })

      /**
       * Get first "GET style" parameter from href.
       * This enables delivering an initial command upon page load.
       *
       * Would have been easier to use location.hash.
       */
      function getUrlParam(name) {
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regexS = "[\\?&]" + name + "=([^&#]*)";
        var regex = new RegExp(regexS);
        var results = regex.exec(window.location.href);
        if (results == null)
          return null;
        else
          return results[1];
      };


      function addMessage(msg) {
        var now = new Date();
        var h = now.getHours();
        var m = addZero(now.getMinutes());
        var s = addZero(now.getSeconds());

        if (h > 12)
          h -= 12;
        else if (h === 0)
          h = 12;

        function addZero(t) {
          if (t < 10)
            t = "0" + t;
          return t;
        };

        message.innerHTML = "<br><span class=\"msg-time\">" + h + ":" + m + ":" + s + "</span>  -  " + msg + message.innerHTML;
      };

      connectButton.addEventListener('click', join);

      // Since all our callbacks are setup, start the process of obtaining an ID
      initialize();
    })();
  </script>
 </div>
		
    </div>
)
}