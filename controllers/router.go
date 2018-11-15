package controllers

import (
	"github.com/fasthttp/router"
	"github.com/valyala/fasthttp"
)

// NewRouter returns a new router for fasthttp
func NewRouter() *router.Router {
	router := router.New()
	router.GET("/ws", Auth(Upgrade))
	router.GET("/me", Auth(Me))
	router.POST("/login", Login)
	router.POST("/logout", Logout)

	fs := &fasthttp.FS{
		// Path to directory to serve.
		Root:       "./build",
		IndexNames: []string{"index.html"},
		PathNotFound: func(ctx *fasthttp.RequestCtx) {
			ctx.SendFile("./build/index.html")
		},
		// Enable transparent compression to save network traffic.
		Compress: true,
	}

	// Create request handler for serving static files.
	router.NotFound = fs.NewRequestHandler()
	return router
}

// Me controller is used to check if user is logged in
func Me(ctx *fasthttp.RequestCtx) {
	ctx.SetStatusCode(fasthttp.StatusOK)
}
