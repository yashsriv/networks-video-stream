# Video Lecture streaming to multiple clients

## Setup

Install go, set up go path and then clone this repo to `$GOPATH/src/github.com/yashsriv/networks-video-stream`:

```shell
$ git clone https://github.com/yashsriv/networks-video-stream.git $GOPATH/src/github.com/yashsriv/networks-video-stream
```

Install dep: https://github.com/golang/dep#installation

Install dependencies:
```shell
$ cd $GOPATH/src/github.com/yashsriv/networks-video-stream
$ dep ensure -v
```

Install npm/yarn, and then:
```shell
$ cd frontend
$ npm install
# or
$ yarn install
```

## Dev Setup
Run server:
```shell
$ go run app.go
```

Now run angular frontend:
```shell
$ cd frontend
$ npm start
# or
$ yarn start
```

Open up http://localhost:4200 and profit!

## Prod Setup

Run build.sh:
```shell
$ ./build.sh
```

Run main server:
```shell
$ cd dist
$ ./server
```
