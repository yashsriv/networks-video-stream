package controllers

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
}

var rooms map[string]*Hub

func init() {
	rooms = make(map[string]*Hub)
}

func newHub(initiator *Client) *Hub {
	return &Hub{
		broadcast:  make(chan *websocketMsg),
		target:     make(chan websocketTarget),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
		idClients:  make(map[string]*Client),
		initiator:  initiator,
	}
}

func (h *Hub) handle(m *websocketMsg, c *Client) {
	if m.To != "" {
		m.From = c.uid
		if client, ok := h.idClients[m.To]; ok {
			select {
			case client.send <- m:
			default:
				close(client.send)
				delete(h.clients, client)
				delete(h.idClients, client.uid)
			}
		}
		return
	}
	if c == h.initiator {
		for client := range h.clients {
			if client != c {
				select {
				case client.send <- m:
				default:
					close(client.send)
					delete(h.clients, client)
					delete(h.idClients, client.uid)
				}
			}
		}
	}
}

func (h *Hub) run() {
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
