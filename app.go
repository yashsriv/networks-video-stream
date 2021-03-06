package main

import (
	"flag"
	"log"

	"github.com/AubSs/fasthttplogger"
	"github.com/valyala/fasthttp"

	"github.com/yashsriv/networks-video-stream/controllers"
)

var (
	addr = flag.String("addr", "0.0.0.0:8080", "TCP address to listen to")
)

func main() {
	flag.Parse()

	router := controllers.NewRouter()

	if err := fasthttp.ListenAndServe(*addr, fasthttplogger.Short(router.Handler)); err != nil {
		log.Fatalf("Error in ListenAndServe: %s", err)
	}
}
