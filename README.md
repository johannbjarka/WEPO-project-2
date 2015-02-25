# WEPO project 2
Web based chat application built with AngularJS.

# Installation:
* With node.js installed, run npm install in the root folder to install grunt and its plugins. 
* Next run npm install in the server folder to install express and socket.io.
* After that run bower install in the client folder to install all bower components.

# Running the application:
Having Python 2.7 installed, run start-client.bat and start-server.bat located in the root folder. Then using your browser go to http://localhost:8000/ to use the chat application.

# Changes made to chatserver.js
* Changed the name of disconnect to disconnect2 because the former is a blacklisted term in socket.io.
* Added messages to messagehistory when users join and leave rooms and when they disconnect from application. 
* Changed the topic of lobby.
