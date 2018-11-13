package controllers

type loginBody struct {
	Username string `json:"username"`
}

type errorBody struct {
	Error string `json:"error"`
}
