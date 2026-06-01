package main

import (
	"context"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"os"

	"github.com/NguyenIslandBoy/daily-news/internal/api"
	"github.com/NguyenIslandBoy/daily-news/internal/config"
	"github.com/NguyenIslandBoy/daily-news/internal/db"
	"github.com/NguyenIslandBoy/daily-news/internal/scraper"
)

func main() {
	cfg := config.Load()

	pool, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	// Load topics for matcher
	topics, err := db.GetTopics(pool)
	if err != nil {
		log.Fatal("Failed to load topics:", err)
	}

	// Warm dedup from last 24h
	seen, err := db.WarmSeenSet(pool)
	if err != nil {
		log.Fatal("Failed to warm dedup set:", err)
	}
	log.Printf("Dedup warmed with %d known URLs", len(seen))

	// Start scraper engine
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	engine := scraper.NewEngine(pool, topics, seen)
	go engine.Start(ctx)

	// HTTP server
	router := api.NewRouter(pool, engine, cfg.APIKey, cfg.GroqAPIKey)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		WriteTimeout: 30 * time.Second,
		ReadTimeout:  15 * time.Second,
	}
	log.Printf("Server starting on port %s", cfg.Port)
	if err := srv.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
