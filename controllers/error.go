package controllers

import (
	"encoding/json"

	"github.com/valyala/fasthttp"
)

func handleErrorString(ctx *fasthttp.RequestCtx, e string) {
	if resBody, err := json.Marshal(errorBody{Error: e}); err != nil {
		ctx.Error(fasthttp.StatusMessage(fasthttp.StatusInternalServerError), fasthttp.StatusInternalServerError)
	} else {
		ctx.Error(string(resBody), fasthttp.StatusBadRequest)
	}
}

func handleError(ctx *fasthttp.RequestCtx, e error) {
	handleErrorString(ctx, e.Error())
}

func handleErrorStatus(ctx *fasthttp.RequestCtx, status int) {
	handleErrorString(ctx, fasthttp.StatusMessage(status))
}
