# DeskThing Server NPM

The DeskThing-App Server is an essential module for setting up your DeskThing App. It provides the server-side communication layer for your app.

Deskthing-Server is intended to work alongside [DeskThing-Client](https://github.com/itsriprod/deskthing-app-client) to allow communication back-and-forth with the client. DeskThing-Server holds all the information and functions the server/ side of your app needs.

## Installation

To install the server, use the following command:

```sh
npm install deskthing-server
```

## Usage

### Initializing the DeskThing Server

To use the DeskThing server in your application, you need to import it and get an instance:

```typescript
import DeskThing from 'deskthing-server';

const deskThing = DeskThing.getInstance();
```

### Sending Messages to the Client

You can send messages to the client using the `sendDataToClient` method. For example, to send a JSON object to the client:

```typescript
deskThing.sendDataToClient({type: 'message', payload: 'Hello, Client!'});
```

### Receiving Messages from the Client

To handle incoming messages from the client, you need to set up event listeners:

```typescript
deskThing.on('data', (data) => {
console.log('Received data:', data);
});
```

### Example: Two-Way Communication

Here is a more complete example demonstrating two-way communication between the server and client:

#### Server Side

```typescript
import DeskThing from 'deskthing-server';

const deskThing = DeskThing.getInstance();

// Sending a message to the client
deskThing.sendDataToClient({ type: 'message', payload: 'Hello, Client!'});

// Listening for a response from the client
deskThing.on('data', (data) => {
    console.log('Received data from client:', data.payload); // will print "someResponse" in this example
});

deskThing.on('set', (data) => {
    console.log('Received data from client:', data.payload.key); // will print 'value' in this example
});
```

#### Client Side

```typescript
import DeskThing from 'deskthing-client';

const deskThing = DeskThing.getInstance();

// Sending a message to the server
deskThing.sendMessageToServer({ type: 'set', payload: { key: 'value' } });

// Listening for a response from the server
deskThing.on('message', (data) => {
    console.log('Received response from server:', data); // logs 'Hello, Client!'
    deskThing.sendMessageToServer({type: 'data', payload: 'someResponse'})
});
```

### Additional Features

#### Sending Data to Other Apps

You can route requests to another app running on the server:

```typescript
deskThing.sendDataToOtherApp('appId', { type: 'set', payload: { key: 'value' } });
```

#### Fetching Data from the Server

To fetch persistent data from the server:

```typescript
const data = await deskThing.getData();
console.log('Fetched data:', data);
```

#### Managing Settings

To manage settings:

```typescript
const settings = await deskThing.getSettings();
console.log('Current settings:', settings);
```

#### Background Tasks

To add a background task:

```typescript
const taskLoop = () => {
// Your background task code
return true;
};

deskThing.addBackgroundTaskLoop(taskLoop);
```

## Additional Information

You can find more information in https://github.com/itsriprod/deskthing-app-client
