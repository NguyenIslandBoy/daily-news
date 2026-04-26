.PHONY: run build test migrate

run:
	go run ./cmd/server

build:
	go build -o bin/daily-news.exe ./cmd/server

test:
	go test ./...

migrate:
	go run ./cmd/migrate