package controllers

import "github.com/valyala/fasthttp"

// Auth is the basic auth handler
func Auth(h fasthttp.RequestHandler) fasthttp.RequestHandler {
	return fasthttp.RequestHandler(func(ctx *fasthttp.RequestCtx) {
		// Get the Basic Authentication credentials
		username, hasAuth := auth(ctx)

		if !hasAuth {
			// Request Authentication otherwise
			handleErrorStatus(ctx, fasthttp.StatusUnauthorized)
			return
		}
		ctx.SetUserValue("username", username)
		// Delegate request to the given handle
		h(ctx)
	})
}

func auth(ctx *fasthttp.RequestCtx) (string, bool) {
	user := ctx.Request.Header.Cookie("username")
	hasAuth := len(user) != 0
	return string(user), hasAuth
}
