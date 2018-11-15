package controllers

import (
	"encoding/json"

	"github.com/valyala/fasthttp"
)

// Login controller is used to log in user
func Login(ctx *fasthttp.RequestCtx) {
	var body loginBody
	if err := json.Unmarshal(ctx.PostBody(), &body); err != nil {
		handleError(ctx, err)
		return
	}

	var c fasthttp.Cookie
	c.SetKey("username")
	c.SetValue(body.Username)
	ctx.Response.Header.SetCookie(&c)
	ctx.SetStatusCode(fasthttp.StatusAccepted)
}

// Logout controller is used to log out user
func Logout(ctx *fasthttp.RequestCtx) {
	ctx.Response.Header.DelClientCookie("username")
	ctx.SetStatusCode(fasthttp.StatusAccepted)
}
