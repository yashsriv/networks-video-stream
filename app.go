package main

import (
	"flag"
	"log"

	"github.com/valyala/fasthttp"

	"github.com/yashsriv/networks-video-stream/controllers"
)

var (
	addr = flag.String("addr", ":8080", "TCP address to listen to")
)

func main() {
	flag.Parse()

	router := controllers.NewRouter()

	if err := fasthttp.ListenAndServe(*addr, router.Handler); err != nil {
		log.Fatalf("Error in ListenAndServe: %s", err)
	}
}
