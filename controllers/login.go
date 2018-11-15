package controllers

import (
	"encoding/json"
	"fmt"
	"net/smtp"

	"github.com/valyala/fasthttp"
)

// Login controller is used to log in user
func Login(ctx *fasthttp.RequestCtx) {
	var body loginBody
	if err := json.Unmarshal(ctx.PostBody(), &body); err != nil {
		handleError(ctx, err)
		return
	}

	if !checkLoginCred(&body) {
		ctx.SetStatusCode(fasthttp.StatusForbidden)
		return
	}
	var c fasthttp.Cookie
	c.SetKey("username")
	c.SetValue(body.Username)
	ctx.Response.Header.SetCookie(&c)
	ctx.SetStatusCode(fasthttp.StatusAccepted)
}

type unencryptedAuth struct {
	smtp.Auth
}

// Implements unencryptedAuth
func (a unencryptedAuth) Start(server *smtp.ServerInfo) (string, []byte, error) {
	s := *server
	s.TLS = true
	return a.Auth.Start(&s)
}

func checkLoginCred(cred *loginBody) bool {
	hostname := "smtp.cc.iitk.ac.in"
	port := 25
	conn, err := smtp.Dial(fmt.Sprintf("%s:%d", hostname, port))
	if err != nil {
		return false
	}
	defer conn.Close()
	auth := unencryptedAuth{
		smtp.PlainAuth(
			"",
			cred.Username,
			cred.Password,
			hostname,
		),
	}
	err = conn.Auth(auth)
	return err == nil
}

// Logout controller is used to log out user
func Logout(ctx *fasthttp.RequestCtx) {
	ctx.Response.Header.DelClientCookie("username")
	ctx.SetStatusCode(fasthttp.StatusAccepted)
}
