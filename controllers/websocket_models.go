package controllers

type websocketMsgType string

const (
	create       websocketMsgType = "create-room"
	created                       = "created-room"
	join                          = "join-room"
	joined                        = "joined-room"
	joinedInform                  = "joined-room-inform"
)

type websocketMsg struct {
	Type websocketMsgType `json:"type"`
	To   string           `json:"to"`
	From string           `json:"from"`
	Body interface{}      `json:"body"`
}

type websocketTarget struct {
	Message *websocketMsg
	Target  string
}

type websocketJoinMsg struct {
	Room string `json:"room"`
}

type websocketCreatedMsg struct {
	Room string `json:"room"`
}
