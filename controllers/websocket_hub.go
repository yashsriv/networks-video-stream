package controllers

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	// Registered clients.
	clients map[*Client]bool

	// Clients of a particular username
	userClients map[string]map[*Client]bool

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

func newHub(initiator *Client) *Hub {
	return &Hub{
		broadcast:   make(chan *websocketMsg),
		target:      make(chan websocketTarget),
		register:    make(chan *Client),
		unregister:  make(chan *Client),
		clients:     make(map[*Client]bool),
		userClients: make(map[string]map[*Client]bool),
		initiator:   initiator,
	}
}

func (h *Hub) handle(m *websocketMsg, c *Client) {
	for client := range h.clients {
		if client != c {
			select {
			case client.send <- m:
			default:
				close(client.send)
				delete(h.clients, client)
			}
		}
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
			if h.userClients[client.username] == nil {
				h.userClients[client.username] = make(map[*Client]bool)
			}
			h.userClients[client.username][client] = true
			if client != h.initiator {
				h.initiator.send <- &websocketMsg{Type: joinedInform}
			}
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				if _, ok := h.userClients[client.username]; ok {
					if _, ok := h.userClients[client.username][client]; ok {
						delete(h.userClients[client.username], client)
					}
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
			for client := range h.userClients[message.Target] {
				select {
				case client.send <- message.Message:
				default:
					close(client.send)
					delete(h.clients, client)
					delete(h.userClients[message.Target], client)
				}
			}
		}
	}
}
