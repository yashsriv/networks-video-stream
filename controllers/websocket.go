package controllers

import (
	"log"

	"github.com/fasthttp/websocket"
	"github.com/valyala/fasthttp"
)

var upgrader = websocket.FastHTTPUpgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// Upgrade is used to upgrade a websocket connection once connected
func Upgrade(ctx *fasthttp.RequestCtx) {
	err := upgrader.Upgrade(ctx, WebsocketHandler(ctx.UserValue("username").(string)))
	if err != nil {
		log.Println(err)
		return
	}
}

// WebsocketHandler handles a new websocket connection
func WebsocketHandler(username string) func(*websocket.Conn) {
	return func(conn *websocket.Conn) {
		client := &Client{hub: nil, conn: conn, send: make(chan *websocketMsg, 256), username: username}
		// Allow collection of memory referenced by the caller by doing all work in
		// new goroutines.
		go client.writePump()
		go client.readPump()
	}
}
