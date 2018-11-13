# Video Lecture streaming to multiple clients

## Setup

Install go, set up go path and then clone this repo to `$GOPATH/src/github.com/yashsriv/networks-video-stream`:

```
$ git clone https://github.com/yashsriv/networks-video-stream.git $GOPATH/src/github.com/yashsriv/networks-video-stream
```

Install dep: https://github.com/golang/dep#installation

Install dependencies:
```
$ cd $GOPATH/src/github.com/yashsriv/networks-video-stream
$ dep ensure -v
```

Run server:
```
$ go run app.go
```

Open up http://$ipaddr:8080/src/create.html as streamer and http://$ipaddr:8080/src/join.html as joiner and profit!
