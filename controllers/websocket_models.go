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
	Body interface{}      `json:"body"`
}

type websocketTarget struct {
	Message *websocketMsg
	Target  string
}

type websocketJoinMsg struct {
	Room string `json:"room"`
}

type websocketJoinedInformMsg struct {
	ID string `json:"id"`
}

type websocketCreatedMsg struct {
	Room string `json:"room"`
}
