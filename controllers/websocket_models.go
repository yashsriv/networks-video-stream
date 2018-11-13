package controllers

type websocketMsgType string

const (
	create websocketMsgType = "create-room"
	join   websocketMsgType = "join-room"
)

type websocketMsg struct {
	Type websocketMsgType `json:"type"`
	Body interface{}      `json:"body"`
}

type websocketTarget struct {
	Message *websocketMsg
	Target  string
}

type websocketJoinMsg struct {
	Room string `json:"room"`
}
