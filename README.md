# Fuego

Transfer files with ease, peer-to-peer using Fuego.

## Motivation

Currently, transfering files over the Internet requires storing that data on remote servers and then sending peers download links from those peers. With WebRTC, it's now possible to send files directly peer-to-peer effectively cutting out that middle man. When multiple peers are all sharing the same file, many people can download files from any peers rapidly.

## Project

Fuego is a [Phoenix](http://www.phoenixframework.org/) application which acts as a server hosting information about "pools" (files divided into chunks) and "peers" (clients that have those chunks locally in his or her browser). When a user connects to Fuego, that user establishes a websocket connection to the Fuego server, broadcasting to that server which chunks the user has available to serve to other peers. The front-end ReactJS application then presents a dashboard to view, download or remove pools the peer has downloaded. When the user wants a chunk that is not locally available, a request is sent to the server for a peer id, and then the user directly establishes a WebRTC connections to that peer to download the chunk. This happens with many peers and many chunks simultaneously.

### Running

First, you will need to have Elixir and npm installed. These can be install in OSX via Homebrew: `brew install elixir` and `brew install npm`.

Then, to start this Phoenix application locally:

1. Install dependencies with `mix deps.get`
2. Start brunch asset compilcation `brunch watch -d`
3. Start Phoenix endpoint with `mix phoenix.server`

Now you can visit `http://localhost:7700` from your browser.

## Testing

This project has Elixir and JavaScript tests.

### Elixir Tests

Ensure mix dependencies are up-to-date: `mix deps.get`

From the command-line, run:

```bash
mix test
```

### JavaScript Tests

Ensure npm modules are installed: `npm install`

Then run:

```bash
npm test
```

## Collaboration

To collaborate on Fuego, please fork this project and create pull requests for new features. It's always helpful to discuss what you are planning to work on in the Issues section.