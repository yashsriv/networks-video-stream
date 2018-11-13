package controllers

import (
	"github.com/fasthttp/router"
)

// NewRouter returns a new router for fasthttp
func NewRouter() *router.Router {
	router := router.New()
	router.GET("/ws", Auth(Upgrade))
	router.POST("/login", Login)
	return router
}