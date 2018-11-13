package controllers

import (
	"github.com/fasthttp/router"
	"github.com/valyala/fasthttp"
)

// NewRouter returns a new router for fasthttp
func NewRouter() *router.Router {
	router := router.New()
	// router.ServeFiles("/src/*filepath", "./static")
	router.GET("/ws", Auth(Upgrade))
	router.GET("/me", Auth(Me))
	router.POST("/login", Login)
	return router
}

// Me controller is used to check if user is logged in
func Me(ctx *fasthttp.RequestCtx) {
	ctx.SetStatusCode(fasthttp.StatusOK)
}
