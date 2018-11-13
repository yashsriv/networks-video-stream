package controllers

// Client is a middleman between the websocket connection and the hub.
import (
	"encoding/json"
	"log"
	"time"

	"github.com/fasthttp/websocket"

	"github.com/yashsriv/networks-video-stream/utils"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 5120
)

type Client struct {
	hub *Hub

	// The websocket connection.
	conn *websocket.Conn

	// Buffered channel of outbound messages.
	send chan *websocketMsg

	// Username
	username string

	// UID
	uid string
}

// readPump pumps messages from the websocket connection to the hub.
//
// The application runs readPump in a per-connection goroutine. The application
// ensures that there is at most one reader on a connection by executing all
// reads from this goroutine.
func (c *Client) readPump() {
	defer func() {
		if c.hub != nil {
			c.hub.unregister <- c
		}
		c.conn.Close()
	}()
	c.conn.SetReadLimit(maxMessageSize)
	// c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { return c.conn.SetReadDeadline(time.Now().Add(pongWait)) })
	for {
		var message websocketMsg
		err := c.conn.ReadJSON(&message)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
		switch message.Type {
		case join:
			b, err := json.Marshal(message.Body)
			if err != nil {
				log.Printf("error: %v", err)
				return
			}
			var jMsg websocketJoinMsg
			err = json.Unmarshal(b, &jMsg)
			if err != nil {
				log.Printf("error: %v", err)
				return
			}
			if room, ok := rooms[jMsg.Room]; ok {
				c.hub = room
				room.register <- c
				c.send <- &websocketMsg{Type: joined, From: room.initiator.uid}
			} else {
				return
			}
		case create:
			roomName := utils.RandStringBytesMaskImpr(6)
			room := newHub(c)
			go room.run()
			rooms[roomName] = room
			c.hub = room
			room.register <- c
			c.send <- &websocketMsg{
				Type: created,
				Body: websocketCreatedMsg{
					Room: roomName,
				},
			}
		default:
			if c.hub != nil {
				c.hub.handle(&message, c)
			}
		}
	}
}

// writePump pumps messages from the hub to the websocket connection.
//
// A goroutine running writePump is started for each connection. The
// application ensures that there is at most one writer to a connection by
// executing all writes from this goroutine.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The hub closed the channel.
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			c.conn.WriteJSON(message)
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
