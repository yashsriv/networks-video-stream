package controllers

type loginBody struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type errorBody struct {
	Error string `json:"error"`
}
