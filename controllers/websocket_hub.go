package controllers

import (
	"log"
	"os"
)

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	// Registered clients.
	clients map[*Client]bool

	// Clients of a particular ID
	idClients map[string]*Client

	// Inbound messages from the clients.
	broadcast chan *websocketMsg

	// Targetted message for a client
	target chan websocketTarget

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client

	// Initiator is the client which creates the room
	initiator *Client

	// RoomName is name of the hub
	roomName string
}

var (
	output = log.New(os.Stdout, "", 0)
)

var rooms map[string]*Hub

func init() {
	rooms = make(map[string]*Hub)
}

func newHub(initiator *Client, name string) *Hub {
	return &Hub{
		broadcast:  make(chan *websocketMsg),
		target:     make(chan websocketTarget),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
		idClients:  make(map[string]*Client),
		initiator:  initiator,
		roomName:   name,
	}
}

func (h *Hub) handle(m *websocketMsg, c *Client) {
	m.From = c.uid
	if m.To != "" {
		output.Printf("[ws] | %s | %s -> %s | %s", h.roomName, c.username, m.To, m.Type)
		h.target <- websocketTarget{
			Target:  m.To,
			Message: m,
		}
		return
	}
	if c == h.initiator || m.Type == chat {
		if m.Type == chat {
			m.From = c.username
		}
		output.Printf("[ws] | %s | %s -> broadcast | %s", h.roomName, c.username, m.Type)
		h.broadcast <- m
	}
}

func (h *Hub) run() {
	defer func() {
		for client := range h.clients {
			select {
			case client.send <- &websocketMsg{From: h.initiator.uid, Type: "bye"}:
				close(client.send)
				delete(h.clients, client)
				if _, ok := h.idClients[client.uid]; ok {
					delete(h.idClients, client.uid)
				}
			default:
				close(client.send)
				delete(h.clients, client)
				if _, ok := h.idClients[client.uid]; ok {
					delete(h.idClients, client.uid)
				}
			}
		}
		close(h.broadcast)
		close(h.target)
		close(h.register)
		close(h.unregister)
		if _, ok := rooms[h.roomName]; ok {
			delete(rooms, h.roomName)
		}
		output.Printf("[ws] demolish | %s ", h.roomName)
	}()
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
			h.idClients[client.uid] = client
			if client != h.initiator {
				h.initiator.send <- &websocketMsg{
					From: client.uid,
					Type: joinedInform,
				}
			}
		case client := <-h.unregister:
			if h.initiator == client {
				return
			}
			if _, ok := h.clients[client]; ok {
				if _, ok := h.idClients[client.uid]; ok {
					delete(h.idClients, client.uid)
				}
				delete(h.clients, client)
				close(client.send)
			}
		case message := <-h.broadcast:
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					if _, ok := h.idClients[client.uid]; ok {
						delete(h.idClients, client.uid)
					}
					close(client.send)
					delete(h.clients, client)
				}
			}
		case message := <-h.target:
			client := h.idClients[message.Target]
			select {
			case client.send <- message.Message:
			default:
				close(client.send)
				delete(h.clients, client)
				delete(h.idClients, message.Target)
			}
		}
	}
}
